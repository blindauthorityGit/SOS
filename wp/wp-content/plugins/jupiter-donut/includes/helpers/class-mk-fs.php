<?php

/**
 * Class helper as wrapper of built-in WP wp_filesystem object
 *
 * @version 1.0.0
 * @author  Sofyan Sitorus <sofyan@artbees.net>
 *
 * @since 5.7
 */

require_once ABSPATH . 'wp-admin/includes/file.php';
require_once ABSPATH . 'wp-admin/includes/template.php';
require_once ABSPATH . 'wp-admin/includes/class-wp-filesystem-base.php';

class Mk_Fs {

	/**
	 * @var array
	 */
	private $options = [];

	/**
	 * @var array
	 */
	public $errors = [];

	/**
	 * @var null
	 */
	public $wp_filesystem = null;

	/**
	 * @var array
	 */
	private $creds_data = [];

	/**
	 * @var boolean
	 */
	private $initialized = false;

	/**
	 * Constructor
	 *
	 * @param (array)   $args The arguments for the object options. Default: []
	 * @param (boolean) $init Whether to initialise the object instantly. Default: false.
	 * @param (boolean) $force Whether to force create new instance of $wp_filesystem object. Default: false.
	 */
	public function __construct( $args = [], $init = false, $force = false ) {
		$this->errors = new WP_Error();

		$args = wp_parse_args(
			(array) $args, [
				'form_post'                    => '',    // (string)  The URL to post the form to. Default: ''.
			'type'                         => '',    // (string)  Chosen type of filesystem. Default: ''.
			'error'                        => false, // (boolean) Whether the current request has failed to connect. Default: false.
			'context'                      => '',    // (string)  Full path to the directory that is tested for being writable. Default: WP_CONTENT_DIR.
			'extra_fields'                 => null,  // (array)   Extra POST fields in array key value pair format. Default: null.
			'allow_relaxed_file_ownership' => false, // (boolean) Whether to allow Group/World writable. Default: false.
			'override'                     => true,  // (boolean) Whether to override some built-in function with custom function. Default: true.
			]
		);

		foreach ( $args as $key => $value ) {
			$this->setOption( $key, $value );
		}

		if ( $init ) {
			$this->init( $force );
		}
	}

	/**
	 * Initialize the wp_filesystem object
	 *
	 * @param  (boolean) $force Whether to force create new instance of $wp_filesystem object. Default: false.
	 * @return boolean
	 */
	public function init( $force = false ) {

		global $wp_filesystem;

		$this->initialized = true;

		if ( ! $force && $wp_filesystem && $wp_filesystem instanceof WP_Filesystem_Base ) {

			$this->wp_filesystem = $wp_filesystem;
			return true;

		} else {

			$this->creds_data = request_filesystem_credentials(
				$this->getOption( 'form_post' ),
				$this->getOption( 'type' ),
				$this->getOption( 'error' ),
				$this->getOption( 'context' ),
				$this->getOption( 'extra_fields' ),
				$this->getOption( 'allow_relaxed_file_ownership' )
			);

			if ( ! WP_Filesystem( $this->creds_data, $this->getOption( 'context' ), $this->getOption( 'allow_relaxed_file_ownership' ) ) ) {

				if ( isset( $wp_filesystem->errors ) && is_wp_error( $wp_filesystem->errors ) && $wp_filesystem->errors->get_error_code() ) {
					$this->add_error( $wp_filesystem->errors->get_error_code(), $wp_filesystem->errors->get_error_message(), $wp_filesystem->errors->get_error_data() );
				} else {
					$this->add_error( 'unable_to_connect_to_filesystem', __( 'Unable to connect to the filesystem. Please confirm your credentials.', 'jupiter-donut' ), $this->creds_data );
				}

				return false;
			} else {

				$this->wp_filesystem = $wp_filesystem;

				return true;
			}
		}
	}

	/**
	 * Magic method to call the wp_filesystem method
	 *
	 * @param  string $method
	 * @param  array  $args
	 * @return mixed
	 * @see wp-admin/includes/class-wp-filesystem-base.php for complete methods available
	 */
	public function __call( $method, $args ) {

		// Try to initialize the wp_filesystem object
		if ( ! $this->initialized ) {
			$this->init();
		}

		// Stop execution if wp_filesystem objetc is empty
		if ( ! $this->wp_filesystem || ! $this->wp_filesystem instanceof WP_Filesystem_Base ) {
			return false;
		}

		// Do the magic, Abracadabra...!
		switch ( $method ) {
			case 'mkdir':
			case 'put_contents':
			case 'copy':
			case 'is_writable':
				if ( $this->getOption( 'override' ) ) {
					$result = call_user_func_array( [ $this, $method . '_override' ], $args );
				} else {
					$result = call_user_func_array( [ $this->wp_filesystem, $method ], $args );
				}

				break;

			case 'zip':
			case 'unzip':
				$result = call_user_func_array( [ $this, $method . '_custom' ], $args );

				break;

			case 'wp_mkdir':
				$result = call_user_func_array( [ $this->wp_filesystem, 'mkdir' ], $args );
				break;

			default:
				if ( ! is_callable( [ $this->wp_filesystem, $method ] ) ) {
					$this->add_error( 'invalid_wp_filesystem_method', __( 'Invalid method for $wp_filesystem object!', 'jupiter-donut' ) );
					$result = false;
				} else {
					$result = call_user_func_array( [ $this->wp_filesystem, $method ], $args );
				}

				break;
		}

		$this->setErrors();

		return $result;
	}

	/**
	 * Create directory recursively
	 *
	 * @param  (string)  $path
	 * @param  (boolean) $chmod
	 * @param  (boolean) $chown
	 * @param  (boolean) $chgrp
	 * @return boolean
	 */
	private function mkdir_override( $path, $chmod = false, $chown = false, $chgrp = false ) {
		// Check if $path already exists
		if ( $this->is_dir( $path ) ) {
			return true;
		} else {

			// If file exists has same name with directory, delete it
			if ( $this->exists( $path ) ) {
				$this->delete( $path );
			}

			$home_path = get_home_path();

			$path = str_replace( '\\', '/', $path );

			// Check if path is relative
			if ( 0 !== strpos( $path, $home_path ) ) {
				$path = trailingslashit( $home_path ) . trim( $path, '/' );
			}

			// Split path as folder chunks.
			$folders = explode( '/', str_replace( $home_path, '', $path ) );

			if ( $folders ) {
				$new_folders = [];

				// Check directories nested, create new if not exixts.
				foreach ( $folders as $folder ) {
					$new_folders[] = trim( $folder, '/' );
					$new_folder    = trailingslashit( $home_path ) . implode( '/', $new_folders );

					// Skip if $new_folder already exists
					if ( $this->is_dir( $new_folder ) ) {
						continue;
					}

					// If file exists has same name with $new_folder, delete it
					if ( $this->exists( $new_folder ) ) {
						@$this->delete( $new_folder );
					}

					// Create the $new_folder
					if ( ! $this->wp_mkdir( $new_folder, $chmod, $chown, $chgrp ) ) {
						$this->add_error( 'can_not_create_directory', sprintf( __( 'Can\'t create directory %s', 'jupiter-donut' ), $new_folder ) );
						return false;
					}
				}
			}
			return true;
		}
	}

	/**
	 * Write contents to a file
	 *
	 * @param  (string)  $file
	 * @param  (string)  $contents
	 * @param  (boolean) $mode
	 * @return boolean
	 */
	private function put_contents_override( $file, $contents, $mode = false ) {

		if ( $this->is_dir( $file ) ) {
			$this->add_error( 'directory_exists_has_same_name', sprintf( __( 'A directory exists has same name %s', 'jupiter-donut' ), $new_folder ) );
			return false;
		}

		$path = dirname( $file );

		if ( ! $this->is_dir( $path ) ) {
			$this->wp_mkdir( $path );
		}

		return $this->wp_filesystem->put_contents( $file, $contents, $mode );
	}

	/**
	 * Copy file
	 *
	 * @param  (string)  $source
	 * @param  (string)  $destination
	 * @param  (boolean) $overwrite
	 * @param  (boolean) $mode
	 * @return boolean
	 */
	private function copy_override( $source, $destination, $overwrite = true, $mode = false ) {
		if ( ! $overwrite && $this->exists( $destination ) ) {
			$this->add_error( 'file_already_exists', sprintf( __( 'File already exists %s', 'jupiter-donut' ), $new_folder ) );
			return false;
		}

		if ( ! $this->exists( $source ) ) {
			$this->add_error( 'copy_source_file_not_exists', sprintf( __( 'Copy source file not exists: %s', 'jupiter-donut' ), $source ) );
			return false;
		}

		if ( ! $this->is_file( $source ) ) {
			$this->add_error( 'copy_source_file_not_valid', sprintf( __( 'Copy source file not valid: %s', 'jupiter-donut' ), $source ) );
			return false;
		}

		if ( ! $this->is_readable( $source ) ) {
			$this->add_error( 'copy_source_file_not_readable', sprintf( __( 'Copy source file not readable: %s', 'jupiter-donut' ), $source ) );
			return false;
		}

		$content = $this->get_contents( $source );

		if ( false === $content ) {
			return false;
		}

		return $this->put_contents( $destination, $content, $mode );
	}

	/**
	 * Check if file or directory is writable
	 *
	 * @param  (string) $file
	 * @return boolean
	 */
	private function is_writable_override( $file ) {

		if ( $this->is_dir( $file ) ) {
			$temp_file = trailingslashit( $file ) . time() . '-' . uniqid() . '.tmp';

			$this->put_contents( $temp_file, '' );

			$is_writable = $this->wp_filesystem->is_writable( $temp_file );

			@$this->delete( $temp_file );

			return $is_writable;
		} else {
			// Create the file if not exists
			if ( ! $this->exists( $file ) ) {
				$this->put_contents( $file, '' );
			}
			return $this->wp_filesystem->is_writable( $file );
		}
	}

	/**
	 * Create zip file
	 *
	 * @param  (array)   $files
	 * @param  (string)  $destination
	 * @param  (boolean) $overwrite
	 * @return boolean
	 */
	public function zip_custom( $files = [], $destination = '', $overwrite = false ) {
		// If the zip file already exists and overwrite is false, return false
		if ( $this->exists( $destination ) && ! $overwrite ) {
			return false;
		}

		// vars
		$valid_files = [];

		// If files were passed in...
		if ( is_array( $files ) ) {
			// cycle through each file
			foreach ( $files as $file_name => $file_path ) {
				// make sure the file exists
				if ( $this->exists( $file_path ) ) {
					$valid_files[ $file_name ] = $file_path;
				}
			}
		}

		// If we did not have good files...
		if ( empty( $valid_files ) ) {
			return false;
		}

		$temp_file = tempnam( sys_get_temp_dir(), 'zip' );

		if ( class_exists( 'ZipArchive', false ) ) {
			$zip = new ZipArchive();

			// Try open the temp file.
			$zip->open( $temp_file );

			// add the files to archive.
			foreach ( $valid_files as $file_name => $file_path ) {
				$zip->addFile( $file_path, $file_name );
			}

			// close the zip -- done!
			$zip->close();

		} else {

			mbstring_binary_safe_encoding();

			require_once( ABSPATH . 'wp-admin/includes/class-pclzip.php' );

			$zip = new PclZip( $temp_file );

			foreach ( $valid_files as $file_name => $file_path ) {
				$zip->create( $file_path, $file_name );
			}

			reset_mbstring_encoding();
		}

		// Copy the temp file to destination.
		$this->copy( $temp_file, $destination );

		// Try delete the temp file.
		@$this->delete( $temp_file );

		// check to make sure the file exists.
		return $this->exists( $destination );
	}

	/**
	 * Extract zip file.
	 *
	 * @param  [type] $source The source zip file.
	 * @param  [type] $destination The destination path.
	 * @return [type]              [description]
	 */
	public function unzip_custom( $source, $destination ) {
		if ( ! $this->exists( $source ) ) {
			$this->add_error( 'zip_source_file_not_exists', sprintf( __( 'Zip source file not exists: %s', 'jupiter-donut' ), $source ) );
			return false;
		}

		if ( ! $this->is_file( $source ) ) {
			$this->add_error( 'zip_source_file_not_valid', sprintf( __( 'Zip source file not valid: %s', 'jupiter-donut' ), $source ) );
			return false;
		}

		if ( ! $this->is_readable( $source ) ) {
			$this->add_error( 'zip_source_file_not_readable', sprintf( __( 'Zip source file not readable: %s', 'jupiter-donut' ), $source ) );
			return false;
		}

		// Check $destination is valid
		if ( ! $this->is_dir( $destination ) ) {

			// If file exists has same name with $destination, delete it
			if ( $this->exists( $destination ) ) {
				$this->delete( $destination );
			}

			// Try create new $destination path
			if ( ! $this->wp_mkdir( $destination ) ) {
				$this->add_error( 'fail_create_unzip_destination_directory', sprintf( __( 'Failed to create unzip destination directory: %s', 'jupiter-donut' ), $destination ) );
				return false;
			}
		}

		// Check $destination is writable
		if ( ! $this->is_writable( $destination ) ) {
			$this->add_error( 'unzip_destination_not_writable', sprintf( __( 'Unzip destination is not writable: %s', 'jupiter-donut' ), $destination ) );
			return false;
		}

		global $wp_filesystem;

		$wp_filesystem = $this->wp_filesystem;

		$unzip_file = unzip_file( $source, $destination );

		if ( is_wp_error( $unzip_file ) ) {
			$this->add_error( $unzip_file->get_error_code(), $unzip_file->get_error_message() );
			return false;
		} elseif ( ! $unzip_file ) {
			$this->add_error( 'failed_unzipping_file', sprintf( __( 'Failed unzipping file: %s', 'jupiter-donut' ), $source ) );
			return false;
		}
		return true;
	}

	/**
	 * Set options data
	 *
	 * @param  (string) $key
	 * @param  (string) $value
	 * @return void
	 */
	public function setOption( $key, $value ) {
		switch ( $key ) {
			case 'context':
				if ( ! empty( $value ) ) {
					$value = is_dir( $value ) ? $value : dirname( $value );
					$value = untrailingslashit( $value );
				}
				break;
		}
		$this->options[ $key ] = $value;
	}

	/**
	 * Get options data
	 *
	 * @param  (string)      $key
	 * @param  (null|string) $default
	 * @return mixed
	 */
	public function getOption( $key = null, $default = null ) {
		if ( null === $key ) {
			return $this->options;
		} else {
			return isset( $this->options[ $key ] ) ? $this->options[ $key ] : $default;
		}
	}

	/**
	 * Delete options data
	 *
	 * @param  (string) $key
	 * @return void
	 */
	public function deleteOption( $key ) {
		unset( $this->options[ $key ] );
	}

	/**
	 * Set errors data taken from the wp_filesystem errors
	 *
	 * @return void
	 */
	private function setErrors() {
		if ( isset( $this->wp_filesystem->errors ) && is_wp_error( $this->wp_filesystem->errors ) && $this->wp_filesystem->errors->get_error_code() ) {
			$this->add_error( $this->wp_filesystem->errors->get_error_code(), $this->wp_filesystem->errors->get_error_message() );
		}
	}

	/**
	 * Get current connection method
	 *
	 * @return mixed
	 */
	public function getConnectionMethod() {
		return isset( $this->wp_filesystem->method ) ? $this->wp_filesystem->method : false;
	}

	/**
	 * Get credentials data
	 *
	 * @return mixed
	 */
	public function getCredsData() {
		return $this->creds_data;
	}

	/**
	 * Get all errors
	 *
	 * @return object Will return the WP_Error object
	 */
	public function get_errors() {
		return $this->errors;
	}

	/**
	 * Retrieve all error codes
	 *
	 * @return array
	 */
	public function get_error_codes() {
		return $this->errors->get_error_codes();
	}

	/**
	 * Retrieve first error code available
	 *
	 * @return string, int or Empty if there is no error codes
	 */
	public function get_error_code() {
		return $this->errors->get_error_code();
	}

	/**
	 * Retrieve all error messages or error messages matching code
	 *
	 * @param (string) $code
	 * @return array
	 */
	public function get_error_messages( $code = '' ) {
		return $this->errors->get_error_messages( $code );
	}

	/**
	 * Get the first error message available or error message matching code
	 *
	 * @param (string) $code
	 * @return string
	 */
	public function get_error_message( $code = '' ) {
		return $this->errors->get_error_message( $code );
	}

	/**
	 * Append more error messages to list of error messages.
	 *
	 * @param (string) $code
	 * @param (string) $message
	 * @param (array)  $data
	 * @return void
	 */
	public function add_error( $code, $message, $data = '' ) {
		// Log the error
		if ( defined( 'WP_DEBUG_LOG' ) && WP_DEBUG_LOG ) {
			error_log( 'Mk_Fs Error Code: ' . $code );
			error_log( 'Mk_Fs Error Message: ' . $message );
			if ( $data && ! is_resource( $data ) ) {
				error_log( 'Mk_Fs Error Data: ' . wp_json_encode( $data ) );
			}
		}
		$this->errors->add( $code, $message, $data );
	}
}
