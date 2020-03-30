<?php
/**
 * Elementor views manager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Render_Dynamic_Field' ) ) {

	class Jet_Engine_Render_Dynamic_Field extends Jet_Engine_Render_Base {

		public $show_field     = true;
		public $more_string    = '...';
		public $excerpt_length = '...';
		public $prevent_icon   = false;

		public function get_name() {
			return 'jet-listing-dynamic-field';
		}

		public function default_settings() {
			return array(
				'dynamic_field_source'             => 'object',
				'dynamic_field_post_object'        => 'post_title',
				'dynamic_field_relation_type'      => 'grandparents',
				'dynamic_field_relation_post_type' => '',
				'dynamic_excerpt_length'           => '',
				'field_tag'                        => 'div',
				'hide_if_empty'                    => false,
				'dynamic_field_filter'             => false,
				'date_format'                      => 'F j, Y',
				'num_dec_point'                    => '.',
				'num_thousands_sep'                => ',',
				'num_decimals'                     => 2,
				'related_list_is_single'           => false,
				'related_list_is_linked'           => true,
				'related_list_tag'                 => 'ul',
				'multiselect_delimiter'            => ',',
				'dynamic_field_custom'             => false,
				'dynamic_field_format'             => '%s',
			);
		}

		/**
		 * Custom excerpt more link
		 *
		 * @return [type] [description]
		 */
		public function excerpt_more() {
			return $this->more_string;
		}

		/**
		 * Custom excerpt more link
		 *
		 * @return [type] [description]
		 */
		public function excerpt_length() {
			return absint( $this->excerpt_length );
		}

		/**
		 * Render post/term field content
		 *
		 * @param  array $settings Widget settings.
		 * @return void
		 */
		public function render_field_content( $settings ) {

			$source = $this->get( 'dynamic_field_source' );
			$result = '';

			switch ( $source ) {
				case 'object':

					$field = $this->get( 'dynamic_field_post_object' );
					$auto  = $this->get( 'dynamic_field_wp_excerpt', '' );

					if ( 'post_excerpt' === $field && ! empty( $auto ) ) {

						$this->more_string = ! empty( $settings['dynamic_excerpt_more'] ) ? $settings['dynamic_excerpt_more'] : '';
						$this->excerpt_length = ! empty( $settings['dynamic_excerpt_length'] ) ? $settings['dynamic_excerpt_length'] : '';

						add_filter( 'excerpt_more', array( $this, 'excerpt_more' ) );

						if ( $this->excerpt_length ) {
							add_filter( 'excerpt_length', array( $this, 'excerpt_length' ), 9999 );
						}

						$result = get_the_excerpt();

						remove_filter( 'excerpt_more', array( $this, 'excerpt_more' ) );

						if ( $this->excerpt_length ) {
							remove_filter( 'excerpt_length', array( $this, 'excerpt_length' ), 9999 );
						}

					} else {
						$result = jet_engine()->listings->data->get_prop( $field );
					}

					if ( 'post_content' === $field ) {
						$result = apply_filters( 'the_content', $result );
					}

					break;

				case 'meta':

					$field = ! empty( $settings['dynamic_field_post_meta_custom'] ) ? $settings['dynamic_field_post_meta_custom'] : false;

					if ( ! $field && isset( $settings['dynamic_field_post_meta'] ) ) {
						$field = ! empty( $settings['dynamic_field_post_meta'] ) ? $settings['dynamic_field_post_meta'] : false;
					}

					if ( $field ) {
						$result = jet_engine()->listings->data->get_meta( $field );
					}

					break;

				case 'options_page':

					$option = ! empty( $settings['dynamic_field_option'] ) ? $settings['dynamic_field_option'] : false;

					if ( $option ) {
						$result = jet_engine()->listings->data->get_option( $option );
					}

					break;

				case 'relations_hierarchy':

					$rel_type = ! empty( $settings['dynamic_field_relation_type'] ) ? $settings['dynamic_field_relation_type'] : 'grandparents';
					$post_type = ! empty( $settings['dynamic_field_relation_post_type'] ) ? $settings['dynamic_field_relation_post_type'] : '';

					if ( ! $post_type ) {
						return __( 'Please select post type', 'jet-engine' );
					}

					if ( 'grandparents' === $rel_type ) {
						$result = jet_engine()->relations->hierarchy->get_grandparent( $post_type );
					} else {
						$result = jet_engine()->relations->hierarchy->get_grandchild( $post_type );
					}

					break;

				default:

					$result = apply_filters( 'jet-engine/listings/dynamic-field/field-value', null, $settings );
					break;
			}

			if ( is_array( $result ) ) {
				$result = array_filter( $result );
			}

			if ( 'false' === $result ) {
				$result = false;
			}

			$hide_if_empty = isset( $settings['hide_if_empty'] ) ? $settings['hide_if_empty'] : false;
			$hide_if_empty = filter_var( $hide_if_empty, FILTER_VALIDATE_BOOLEAN );

			if ( $hide_if_empty && empty( $result ) ) {
				$this->show_field = false;
				return;
			} elseif ( empty( $result ) ) {
				$result = ! empty( $settings['field_fallback'] ) ? $settings['field_fallback'] : $result;
			}

			$this->render_filtered_result( $result, $settings );

		}

		/**
		 * Render result with applied format from settings
		 *
		 * @param  [type] $result   [description]
		 * @param  [type] $settings [description]
		 * @return [type]           [description]
		 */
		public function render_filtered_result( $result, $settings ) {

			$is_filtered = isset( $settings['dynamic_field_filter'] ) ? $settings['dynamic_field_filter'] : false;
			$is_filtered = filter_var( $is_filtered, FILTER_VALIDATE_BOOLEAN );

			if ( $is_filtered ) {
				$result = $this->apply_callback( $result, $settings );
			}

			if ( is_wp_error( $result ) ) {
				_e( '<strong>Warning:</strong> Error appears on callback applying. Please select other callback to filter field value.', 'jet-engine' );
				return;
			}

			$is_custom = isset( $settings['dynamic_field_custom'] ) ? $settings['dynamic_field_custom'] : false;

			if ( $is_custom && ! empty( $settings['dynamic_field_format'] ) ) {
				$result = sprintf( $settings['dynamic_field_format'], $result );
				$result = do_shortcode( $result );
			}

			if ( ! is_array( $result ) ) {
				echo $result;
			}

		}

		/**
		 * Apply filter callback
		 * @param  [type] $result   [description]
		 * @param  [type] $settings [description]
		 * @return [type]           [description]
		 */
		public function apply_callback( $result, $settings ) {

			$callback = isset( $settings['filter_callback'] ) ? $settings['filter_callback'] : '';

			if ( ! $callback ) {
				return;
			}

			if ( ! is_callable( $callback ) ) {
				return;
			}

			$args = array();

			switch ( $callback ) {

				case 'date':
				case 'date_i18n':

					if ( ! Jet_Engine_Tools::is_valid_timestamp( $result ) ) {
						$result = strtotime( $result );
					}

					$format = ! empty( $settings['date_format'] ) ? $settings['date_format'] : 'F j, Y';
					$args   = array( $format, $result );

					break;

				case 'number_format':

					$result        = floatval( $result );
					$dec_point     = isset( $settings['num_dec_point'] ) ? $settings['num_dec_point'] : '.';
					$thousands_sep = isset( $settings['num_thousands_sep'] ) ? $settings['num_thousands_sep'] : ',';
					$decimals      = isset( $settings['num_decimals'] ) ? $settings['num_decimals'] : 2;
					$args          = array( $result, $decimals, $dec_point, $thousands_sep );

					break;

				case 'wp_get_attachment_image':

					$args = array( $result, 'full' );

					break;

				case 'jet_engine_render_multiselect':
				case 'jet_engine_render_post_titles':
				case 'jet_engine_render_checkbox_values':

					$delimiter = isset( $settings['multiselect_delimiter'] ) ? $settings['multiselect_delimiter'] : ', ';
					$args      = array( $result, $delimiter );

					break;

				case 'jet_related_posts_list':

					$tag       = isset( $settings['related_list_tag'] ) ? $settings['related_list_tag'] : '';
					$is_linked = isset( $settings['related_list_is_linked'] ) ? $settings['related_list_is_linked'] : '';
					$is_single = isset( $settings['related_list_is_single'] ) ? $settings['related_list_is_single'] : '';
					$delimiter = isset( $settings['multiselect_delimiter'] ) ? $settings['multiselect_delimiter'] : ', ';
					$is_linked = filter_var( $is_linked, FILTER_VALIDATE_BOOLEAN );
					$is_single = filter_var( $is_single, FILTER_VALIDATE_BOOLEAN );
					$args      = array( $result, $tag, $is_single, $is_linked, $delimiter );

					break;

				case 'jet_engine_render_switcher':

					$true_text  = isset( $settings['switcher_true'] ) ? $settings['switcher_true'] : '';
					$false_text = isset( $settings['switcher_false'] ) ? $settings['switcher_false'] : '';
					$args       = array( $result, $true_text, $false_text );

					break;

				case 'jet_engine_render_checklist':

					$cols = isset( $settings['checklist_cols_num'] ) ? $settings['checklist_cols_num'] : 1;

					$field_icon = ! empty( $settings['field_icon'] ) ? esc_attr( $settings['field_icon'] ) : false;
					$new_icon   = ! empty( $settings['selected_field_icon'] ) ? $settings['selected_field_icon'] : false;

					$base_class    = $this->get_name();
					$new_icon_html = Jet_Engine_Tools::render_icon( $new_icon, $base_class . '__icon' );
					$icon          = false;

					if ( $new_icon_html ) {
						$icon = $new_icon_html;
					} elseif ( $field_icon ) {
						$icon = sprintf( '<i class="%1$s %2$s__icon"></i>', $field_icon, $base_class );
					}

					if ( $icon ) {
						$this->prevent_icon = true;
					}

					$args = array( $result, $icon, $cols );

					break;

				default:

					$args = apply_filters(
						'jet-engine/listing/dynamic-field/callback-args',
						array( $result ),
						$callback,
						$settings,
						$this
					);

					break;
			}

			return call_user_func_array( $callback, $args );

		}

		/**
		 * Check if is valid timestamp
		 *
		 * @deprecated Use Jet_Engine_Tools::is_valid_timestamp()
		 *
		 * @param  [type]  $timestamp [description]
		 * @return boolean            [description]
		 */
		public function is_valid_timestamp( $timestamp ) {
			return ( ( string ) ( int ) $timestamp === $timestamp || ( int ) $timestamp === $timestamp )
				&& ( $timestamp <= PHP_INT_MAX )
				&& ( $timestamp >= ~PHP_INT_MAX );
		}

		public function render() {

			$this->show_field = true;

			$base_class    = $this->get_name();
			$settings      = $this->get_settings();
			$tag           = ! empty( $settings['field_tag'] ) ? esc_attr( $settings['field_tag'] ) : 'div';
			$field_display = ! empty( $settings['field_display'] ) ? esc_attr( $settings['field_display'] ) : 'inline';
			$field_icon    = ! empty( $settings['field_icon'] ) ? esc_attr( $settings['field_icon'] ) : false;
			$new_icon      = ! empty( $settings['selected_field_icon'] ) ? $settings['selected_field_icon'] : false;

			$classes = array(
				'jet-listing',
				$base_class,
				'display-' . $field_display
			);

			if ( ! empty( $settings['className'] ) ) {
				$classes[] = esc_attr( $settings['className'] );
			}

			ob_start();
			$this->render_field_content( $settings );
			$field_content = ob_get_clean();

			ob_start();

			printf( '<%1$s class="%2$s">', $tag, implode( ' ', $classes ) );

				if ( 'inline' === $field_display ) {
					printf( '<div class="%s__inline-wrap">', $base_class );
				}

				if ( ! $this->prevent_icon ) {

					$new_icon_html = Jet_Engine_Tools::render_icon( $new_icon, $base_class . '__icon' );

					if ( $new_icon_html ) {
						echo $new_icon_html;
					} elseif ( $field_icon ) {
						printf( '<i class="%1$s %2$s__icon"></i>', $field_icon, $base_class );
					}

				}

				do_action( 'jet-engine/listing/dynamic-field/before-field', $this );

				printf( '<div class="%s__content">', $base_class );
					echo $field_content;
				echo '</div>';

				do_action( 'jet-engine/listing/dynamic-field/after-field', $this );

				if ( 'inline' === $field_display ) {
					echo '</div>';
				}

			printf( '</%s>', $tag );

			$content = ob_get_clean();

			if ( $this->show_field ) {
				echo $content;
			}

		}

	}

}
