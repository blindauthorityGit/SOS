<?php
/**
 * Meta oxes mamager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_CPT_Meta' ) ) {

	/**
	 * Define Jet_Engine_CPT_Meta class
	 */
	class Jet_Engine_CPT_Meta {

		public static $index = 0;

		public $post_type;
		public $meta_box;

		public $custom_css = array();
		public $is_allowed_on_admin_hook = null;

		public static $wrappers_hooked = false;

		public $layout_now        = false;
		public $current_component = false;
		public $current_panel     = false;

		/**
		 * Constructor for the class
		 */
		function __construct( $post_type, $meta_box, $title = '', $context = 'normal', $priority = 'high' ) {

			if ( ! $title ) {
				$title = esc_html__( 'Settings', 'jet-engine' );
			}

			$this->post_type = $post_type;
			$this->meta_box  = $meta_box;

			new Cherry_X_Post_Meta( array(
				'id'            => $this->get_box_id(),
				'title'         => $title,
				'page'          => array( $post_type ),
				'context'       => $context,
				'priority'      => $priority,
				'callback_args' => false,
				'builder_cb'    => array( $this, 'get_builder_for_meta' ),
				'fields'        => $this->prepare_meta_fields( $meta_box ),
			) );

			add_action( 'admin_enqueue_scripts', array( $this, 'maybe_enqueue_custom_css' ), 0 );

		}

		public function get_box_id() {
			self::$index++;
			return 'jet-engine-cpt-' . self::$index;
		}

		/**
		 * Returns builder for meta
		 *
		 * @return [type] [description]
		 */
		public function get_builder_for_meta() {

			if ( ! self::$wrappers_hooked ) {

				add_action( 'cx_post_meta/meta_box/before', array( $this, 'open_meta_wrap' ) );
				add_action( 'cx_post_meta/meta_box/after', array( $this, 'close_meta_wrap' ) );

				self::$wrappers_hooked = true;

			}

			$builder_data = jet_engine()->framework->get_included_module_data( 'cherry-x-interface-builder.php' );

			return new CX_Interface_Builder(
				array(
					'path' => $builder_data['path'],
					'url'  => $builder_data['url'],
				)
			);

		}

		/**
		 * Open meta wrap
		 * @return [type] [description]
		 */
		public function open_meta_wrap() {
			echo '<div class="jet-engine-meta-wrap">';
		}

		/**
		 * Open meta wrap
		 * @return [type] [description]
		 */
		public function close_meta_wrap() {
			echo '</div>';
		}

		/**
		 * Prepare meta fields for registering
		 *
		 * @param  array  $meta_box [description]
		 * @return [type]           [description]
		 */
		public function prepare_meta_fields( $meta_box = array() ) {

			$result            = array();
			$date_assets_added = false;

			foreach ( $meta_box as $field ) {

				if ( isset( $field['title'] ) ) {
					$title = $field['title'];
				} elseif ( isset( $field['label'] ) ) {
					$title = $field['label'];
				} else {
					$title = '';
				}

				if ( ! empty( $field['object_type'] ) && 'field' !== $field['object_type'] ) {

					// process endpoint
					if ( 'endpoint' === $field['object_type'] ) {
						$this->current_component = false;
						$this->current_panel     = false;
						continue;
					}

					if ( $this->current_component && $this->layout_now !== $field['object_type'] ) {
						$this->current_component = false;
						$this->layout_now        = false;
					}

					// Start layout element
					if ( ! $this->current_component ) {

						$this->current_component = $field['name'] . '_' . $field['object_type'];
						$this->layout_now        = $field['object_type'];

						switch ( $field['object_type'] ) {
							case 'tab':
								$layout = ! empty( $field['tab_layout'] ) ? $field['tab_layout'] : 'horizontal';
								$type   = 'component-tab-' . $layout;
								break;

							case 'accordion':
								$type = 'component-accordion';
								break;
						}

						$result[ $this->current_component ] = array(
							'type' => $type,
						);

					}

					// Start new group inside layout element
					$this->current_panel = $field['name'];

					$result[ $this->current_panel ] = array(
						'type'        => 'settings',
						'parent'      => $this->current_component,
						'title'       => $title,
					);

					continue;

				}

				$result[ $field['name'] ] = array(
					'type'    => $field['type'],
					'element' => 'control',
					'title'   => $title,
				);

				if ( ! empty( $this->current_panel ) ) {
					$result[ $field['name'] ]['parent'] = $this->current_panel;
				}

				if ( ! empty( $field['width'] ) && '100%' !== $field['width'] ) {
					$this->custom_css[ $field['name'] ] = $field['width'];
				}

				if ( empty( $field['description'] ) ) {
					$result[ $field['name'] ]['description'] = __( 'Name: ', 'jet-engine' ) . $field['name'];
				} else {
					$result[ $field['name'] ]['description'] = $field['description'] . '<br>' . __( 'Name: ', 'jet-engine' ) . $field['name'];
				}

				if ( ! empty( $field['is_required'] ) ) {
					$result[ $field['name'] ]['required'] = true;
				}

				if ( ! empty( $field['default_val'] ) ) {
					$result[ $field['name'] ]['value'] = $field['default_val'];
				}

				switch ( $field['type'] ) {
					case 'select':

						if ( empty( $field['options'] ) ) {
							$field['options'] = array();
						}

						$prepared_options = $this->prepare_select_options( $field );

						$result[ $field['name'] ]['options'] = $prepared_options['options'];

						if ( ! empty( $prepared_options['default'] ) ) {
							$result[ $field['name'] ]['value'] = $prepared_options['default'];
						}

						if ( ! empty( $field['options_callback'] ) ) {
							$result[ $field['name'] ]['options_callback'] = $field['options_callback'];
						}

						$multiple = ! empty( $field['is_multiple'] ) ? $field['is_multiple'] : false;
						$multiple = filter_var( $multiple, FILTER_VALIDATE_BOOLEAN );

						if ( $multiple ) {
							$result[ $field['name'] ]['multiple'] = true;
						}

						break;

					case 'checkbox':

						if ( empty( $field['options'] ) ) {
							$field['options'] = array();
						}

						$prepared_options                    = $this->prepare_select_options( $field );
						$result[ $field['name'] ]['options'] = $prepared_options['options'];

						if ( ! empty( $prepared_options['default'] ) ) {
							$result[ $field['name'] ]['value'] = $prepared_options['default'];
						}

						if ( ! empty( $field['options_callback'] ) ) {
							$result[ $field['name'] ]['options_callback'] = $field['options_callback'];
						}

						$field['is_array'] = ! empty( $field['is_array'] ) ? $field['is_array'] : false;
						$field['is_array'] = filter_var( $field['is_array'], FILTER_VALIDATE_BOOLEAN );

						$result[ $field['name'] ]['is_array'] = $field['is_array'];

						break;

					case 'radio':

						if ( empty( $field['options'] ) ) {
							$field['options'] = array();
						}

						$prepared_options                    = $this->prepare_radio_options( $field['options'] );
						$result[ $field['name'] ]['options'] = $prepared_options['options'];

						if ( ! empty( $prepared_options['default'] ) ) {
							$result[ $field['name'] ]['value'] = $prepared_options['default'];
						}

						if ( ! empty( $field['options_callback'] ) ) {
							$result[ $field['name'] ]['options_callback'] = $field['options_callback'];
						}

						break;

					case 'repeater':

						if ( empty( $field['repeater-fields'] ) ) {
							$field['repeater-fields'] = array();
						}

						$result[ $field['name'] ]['fields'] = $this->prepare_repeater_fields(
							$field['repeater-fields']
						);

						break;

					case 'iconpicker':

						$result[ $field['name'] ]['icon_data'] = $this->get_icon_data();

						break;

					case 'wysiwyg':

						$result[ $field['name'] ]['sanitize_callback'] = 'jet_engine_sanitize_wysiwyg';

						break;

					case 'textarea':

						$result[ $field['name'] ]['sanitize_callback'] = 'jet_engine_sanitize_textarea';

						if ( ! empty( $field['max_length'] ) ) {
							$result[ $field['name'] ]['maxlength'] = absint( $field['max_length'] );
						}

						break;

					case 'text':

						if ( ! empty( $field['max_length'] ) ) {
							$result[ $field['name'] ]['maxlength'] = absint( $field['max_length'] );
						}

						break;

					case 'posts':

						$multiple  = ! empty( $field['is_multiple'] ) ? $field['is_multiple'] : false;
						$multiple  = filter_var( $multiple, FILTER_VALIDATE_BOOLEAN );
						$post_type = isset( $field['search_post_type'] ) ? $field['search_post_type'] : 'any';

						$result[ $field['name'] ]['action']       = 'cx_search_posts';
						$result[ $field['name'] ]['post_type']    = $post_type;
						$result[ $field['name'] ]['inline_style'] = 'width: 100%;';
						$result[ $field['name'] ]['multiple']     = $multiple;

						break;

					case 'media':

						$result[ $field['name'] ]['multi_upload'] = false;

						break;

					case 'gallery':

						$result[ $field['name'] ]['type']         = 'media';
						$result[ $field['name'] ]['multi_upload'] = 'add';

						break;

					case 'date':
					case 'time':
					case 'datetime':
					case 'datetime-local':

						$key = $field['name'];

						$result[ $key ]['type']         = 'text';
						$result[ $key ]['input_type']   = $field['type'];
						$result[ $key ]['autocomplete'] = 'off';

						$field['is_timestamp'] = ! empty( $field['is_timestamp'] ) ? $field['is_timestamp'] : false;
						$field['is_timestamp'] = filter_var( $field['is_timestamp'], FILTER_VALIDATE_BOOLEAN );

						if ( $field['is_timestamp'] ) {
							$result[ $key ]['is_timestamp'] = true;
						}

						if ( ! empty( $result[ $key ]['value'] ) ) {
							$val = strtotime( $result[ $key ]['value'] );

							if ( $val ) {
								$result[ $key ]['value'] = date( 'Y-m-d', $val );
							}

						}

						add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_date_assets' ) );

						break;

				}

			}

			return $result;

		}

		public function is_allowed_on_current_admin_hook( $hook ) {

			if ( null !== $this->is_allowed_on_admin_hook ) {
				return $this->is_allowed_on_admin_hook;
			}

			$allowed_hooks = array(
				'post-new.php',
				'post.php',
			);

			if ( ! in_array( $hook, $allowed_hooks ) ) {
				$this->is_allowed_on_admin_hook = false;
				return $this->is_allowed_on_admin_hook;
			}

			if ( get_post_type() !== $this->post_type ) {
				$this->is_allowed_on_admin_hook = false;
				return $this->is_allowed_on_admin_hook;
			}

			$this->is_allowed_on_admin_hook = true;
			return $this->is_allowed_on_admin_hook;

		}

		/**
		 * Maybe add custom css
		 *
		 * @return [type] [description]
		 */
		public function maybe_enqueue_custom_css( $hook ) {

			if ( ! $this->is_allowed_on_current_admin_hook( $hook ) ) {
				return;
			}

			wp_enqueue_style(
				'jet-engine-meta-boxes',
				jet_engine()->plugin_url( 'assets/css/admin/meta-boxes.css' ),
				array(),
				jet_engine()->get_version()
			);

			if ( ! empty( $this->custom_css ) ) {

				$custom_css = '';

				foreach ( $this->custom_css as $el => $width ) {
					$custom_css .= '.cx-control[data-control-name="' . $el . '"] { max-width: ' . $width . '; flex: 0 0 ' . $width . '; }';
				}

				wp_add_inline_style( 'jet-engine-meta-boxes', $custom_css );

			}

		}

		/**
		 * Enqueue date-related assets
		 *
		 * @param  [type] $hook [description]
		 * @return [type]       [description]
		 */
		public function enqueue_date_assets( $hook = false ) {

			if ( ! $this->is_allowed_on_current_admin_hook( $hook ) ) {
				return;
			}

			wp_enqueue_script( 'jquery-ui-datepicker' );
			wp_enqueue_script( 'jquery-ui-slider' );

			wp_enqueue_script(
				'jquery-ui-timepicker-addon',
				jet_engine()->plugin_url( 'assets/lib/jquery-ui-timepicker/jquery-ui-timepicker-addon.min.js' ),
				array(),
				jet_engine()->get_version(),
				true
			);

			wp_enqueue_script(
				'jet-engine-meta-boxes',
				jet_engine()->plugin_url( 'assets/js/admin/meta-boxes.js' ),
				array( 'jquery' ),
				jet_engine()->get_version(),
				true
			);

			wp_enqueue_style(
				'jquery-ui-timepicker-addon',
				jet_engine()->plugin_url( 'assets/lib/jquery-ui-timepicker/jquery-ui-timepicker-addon.min.css' ),
				array(),
				jet_engine()->get_version()
			);

		}

		/**
		 * Returns default icon data
		 *
		 * @return void
		 */
		public function get_icon_data() {

			ob_start();

			include jet_engine()->plugin_path( 'assets/js/admin/icons.json' );
			$json = ob_get_clean();

			$icons_list = array();
			$icons      = json_decode( $json, true );

			foreach ( $icons['icons'] as $icon ) {
				$icons_list[] = $icon['id'];
			}

			return array(
				'icon_set'    => 'jetFontAwesome',
				'icon_css'    => ELEMENTOR_ASSETS_URL . 'lib/font-awesome/css/font-awesome.min.css',
				'icon_base'   => 'fa',
				'icon_prefix' => 'fa-',
				'icons'       => $icons_list,
			);

		}

		public function prepare_repeater_fields( $repeater_fields = array() ) {

			if ( ! $repeater_fields ) {
				$repeater_fields = array();
			}

			$result            = array();
			$date_assets_added = false;

			foreach ( $repeater_fields as $field ) {
				$result[ $field['name'] ] = array(
					'type'  => $field['type'],
					'id'    => $field['name'],
					'name'  => $field['name'],
					'label' => $field['title'] . ' (' . __( 'name: ', 'jet-engine' ) . $field['name'] . ')',
				);

				switch ( $field['type'] ) {

					case 'iconpicker':

						$result[ $field['name'] ]['icon_data'] = $this->get_icon_data();

						break;

					case 'wysiwyg':

						$result[ $field['name'] ]['sanitize_callback'] = 'jet_engine_sanitize_wysiwyg';

						break;

					case 'media':

						$result[ $field['name'] ]['multi_upload'] = false;

						break;

					case 'gallery':

						$result[ $field['name'] ]['type']         = 'media';
						$result[ $field['name'] ]['multi_upload'] = 'add';

						break;

					case 'posts':

						$multiple  = ! empty( $field['is_multiple'] ) ? $field['is_multiple'] : false;
						$multiple  = filter_var( $multiple, FILTER_VALIDATE_BOOLEAN );
						$post_type = isset( $field['search_post_type'] ) ? $field['search_post_type'] : 'any';

						$result[ $field['name'] ]['action']       = 'cx_search_posts';
						$result[ $field['name'] ]['post_type']    = $post_type;
						$result[ $field['name'] ]['inline_style'] = 'width: 100%;';
						$result[ $field['name'] ]['multiple']     = $multiple;

						break;

					case 'date':
					case 'time':
					case 'datetime':
					case 'datetime-local':

						$result[ $field['name'] ]['type']         = 'text';
						$result[ $field['name'] ]['input_type']   = $field['type'];
						$result[ $field['name'] ]['autocomplete'] = 'off';

						if ( ! $date_assets_added ) {
							add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_date_assets' ) );
							$date_assets_added = true;
						}

						break;

				}

			}

			return $result;

		}

		public function prepare_radio_options( $options = array() ) {

			$result = array(
				'options' => array(),
				'default' => false,
			);

			if ( empty( $options ) ) {
				return $result;
			}

			foreach ( $options as $option ) {

				$result['options'][ $option['key'] ] = array(
					'label' => $option['value']
				);

				if ( ! empty( $option['is_checked'] ) ) {
					$result['default'] = $option['key'];
				}

			}

			return $result;

		}

		/**
		 * Prepare options for select
		 * @return [type] [description]
		 */
		public function prepare_select_options( $field = array() ) {

			$result = array(
				'options' => array(),
				'default' => false,
			);

			if ( empty( $field['options'] ) ) {
				return $result;
			}

			if ( 'checkbox' === $field['type'] ) {
				$multiple = true;
			} else {
				$multiple = ! empty( $field['is_multiple'] ) ? $field['is_multiple'] : false;
				$multiple = filter_var( $multiple, FILTER_VALIDATE_BOOLEAN );
			}

			if ( $multiple ) {
				$result['default'] = array();
			}

			foreach ( $field['options'] as $option ) {
				$result['options'][ $option['key'] ] = $option['value'];

				if ( ! empty( $option['is_checked'] ) ) {
					if ( $multiple ) {
						if ( 'checkbox' === $field['type'] ) {
							$result['default'][ $option['key'] ] = 'true';
						} else {
							$result['default'][] = $option['key'];
						}
					} else {
						$result['default'] = $option['key'];
					}
				}

			}

			return $result;

		}

	}

}
