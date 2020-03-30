<?php
/**
 * Add Module Base.
 *
 * @package Raven
 * @since 1.0.0
 */

namespace Raven\Base;

use Raven\Plugin;
use Raven\Controls\File_Uploader;

defined( 'ABSPATH' ) || die();

/**
 * Module Base.
 *
 * An abstract class to register new Raven module.
 *
 * @since 1.0.0
 * @abstract
 * @SuppressWarnings(PHPMD.NumberOfChildren)
 */
abstract class Module_Base {

	/**
	 * Module instances.
	 *
	 * Holds all the module instances.
	 *
	 * @access public
	 * @static
	 *
	 * @var array
	 */
	public static $instances = [];

	/**
	 * Reflection instance.
	 *
	 * @access private
	 *
	 * @var object
	 */
	private $reflection;

	/**
	 * Disables class cloning and throw an error on object clone.
	 *
	 * The whole idea of the singleton design pattern is that there is a single
	 * object. Therefore, we don't want the object to be cloned.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	public function __clone() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cheatin&#8217; huh?', 'raven' ), '1.0.0' );
	}

	/**
	 * Disables unserializing of the class.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	public function __wakeup() {
		_doing_it_wrong( __FUNCTION__, esc_html__( 'Cheatin&#8217; huh?', 'raven' ), '1.0.0' );
	}

	/**
	 * Disables unserializing of the class.
	 *
	 * @access public
	 * @since 1.0.0
	 */
	public static function class_name() {
		return get_called_class();
	}

	/**
	 * Ensures only one instance of the module class is loaded or can be loaded.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 */
	public static function get_instance() {
		if ( empty( static::$instances[ static::class_name() ] ) ) {
			static::$instances[ static::class_name() ] = new static();
		}

		return static::$instances[ static::class_name() ];
	}

	/**
	 * Get widgets.
	 *
	 * Get the module widgets.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function get_widgets() {
		return [];
	}

	/**
	 * Module base constructor.
	 *
	 * Initializing the module base class by hooking in register widgets action.
	 *
	 * @since 1.0.0
	 * @access public
	 */
	public function __construct() {
		$this->reflection = new \ReflectionClass( $this );

		add_action( 'elementor/widgets/widgets_registered', [ $this, 'register_widgets' ] );

		// Control hooks.
		add_action( 'wp_ajax_raven_control_file_upload', [ File_Uploader::class, 'handle_file_upload' ] );
	}

	/**
	 * Register widgets.
	 *
	 * Instantiate the widgets.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @param object $widgets_manager Widget manager instance.
	 */
	public function register_widgets( $widgets_manager ) {

		foreach ( $this->get_widgets() as $widget_name ) {
			// Prepare class name.
			$class_name = str_replace( '-', '_', $widget_name );
			$class_name = $this->reflection->getNamespaceName() . '\Widgets\\' . $class_name;

			// Register.
			if ( $class_name::is_active() ) {
				$widgets_manager->register_widget_type( new $class_name() );
			}
		}

	}

	/**
	 * Retrieve module active state.
	 *
	 * Use to disable or enable the module on a certain condition.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return boolean
	 */
	public static function is_active() {
		return true;
	}

	/**
	 * Translated strings.
	 *
	 * @since 1.6.0
	 * @access public
	 *
	 * @return array
	 */
	public function translations() {
		return [];
	}
}
