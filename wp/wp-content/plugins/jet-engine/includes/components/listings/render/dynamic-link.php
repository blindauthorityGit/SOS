<?php
/**
 * Elementor views manager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Render_Dynamic_Link' ) ) {

	class Jet_Engine_Render_Dynamic_Link extends Jet_Engine_Render_Base {

		private $show_field = true;

		public function get_name() {
			return 'jet-listing-dynamic-link';
		}

		/**
		 * Render link tag
		 *
		 * @param  [type] $settings   [description]
		 * @param  [type] $base_class [description]
		 * @return [type]             [description]
		 */
		public function render_link( $settings, $base_class ) {

			$format = '<a href="%1$s" class="%2$s__link"%5$s%6$s>%3$s%4$s</a>';
			$source = ! empty( $settings['dynamic_link_source'] ) ? $settings['dynamic_link_source'] : '_permalink';
			$custom = ! empty( $settings['dynamic_link_source_custom'] ) ? $settings['dynamic_link_source_custom'] : '';

			$url = apply_filters(
				'jet-engine/listings/dynamic-link/custom-url',
				false,
				$settings
			);

			if ( ! $url ) {
				if ( $custom ) {
					$url = jet_engine()->listings->data->get_meta( $custom );
				} elseif ( '_permalink' === $source ) {
					$url = jet_engine()->listings->data->get_current_object_permalink();
				} elseif ( 'options_page' === $source ) {
					$option = ! empty( $settings['dynamic_link_option'] ) ? $settings['dynamic_link_option'] : false;
					$url    = jet_engine()->listings->data->get_option( $option );
				} elseif ( $source ) {
					$url = jet_engine()->listings->data->get_meta( $source );
				}
			}

			$label    = ! empty( $settings['link_label'] ) ? $settings['link_label'] : false;
			$icon     = ! empty( $settings['link_icon'] ) ? $settings['link_icon'] : false;
			$new_icon = ! empty( $settings['selected_link_icon'] ) ? $settings['selected_link_icon'] : false;

			if ( $label ) {
				$label = jet_engine()->listings->macros->do_macros( $label, $url );
				$label = sprintf( '<span class="%1$s__label">%2$s</span>', $base_class, $label );
			}

			$new_icon_html = \Jet_Engine_Tools::render_icon( $new_icon, $base_class . '__icon' );

			if ( $new_icon_html ) {
				$icon = $new_icon_html;
			} elseif ( $icon ) {
				$icon = sprintf( '<i class="%1$s__icon %2$s"></i>', $base_class, $icon );
			}

			if ( is_wp_error( $url ) ) {
				echo $url->get_error_message();
				return;
			}

			$open_in_new = isset( $settings['open_in_new'] ) ? $settings['open_in_new'] : '';
			$rel_attr    = isset( $settings['rel_attr'] ) ? esc_attr( $settings['rel_attr'] ) : '';
			$rel         = '';
			$target      = '';

			if ( $rel_attr ) {
				$rel = sprintf( ' rel="%s"', $rel_attr );
			}

			if ( $open_in_new ) {
				$target = ' target="_blank"';
			}

			if ( ! empty( $settings['hide_if_empty'] ) && empty( $url ) ) {
				$this->show_field = false;
				return;
			}

			if ( is_object( $url ) && $url instanceof WP_Post ) {
				$url = get_permalink( $url->ID );
			}

			$url = $this->maybe_add_query_args( $url, $settings );

			printf( $format, $url, $base_class, $icon, $label, $rel, $target );

		}

		/**
		 * Maybe add query arguments to URL string
		 *
		 * @return [type] [description]
		 */
		public function maybe_add_query_args( $url = null, $settings = array() ) {

			if ( empty( $settings['add_query_args'] ) || empty( $settings['query_args'] ) ) {
				return $url;
			}

			$query_args = $settings['query_args'];
			$query_args = preg_split( '/\r\n|\r|\n/', $query_args );

			if ( empty( $query_args ) || ! is_array( $query_args ) ) {
				return $url;
			}

			$final_query_args = array();

			foreach ( $query_args as $arg ) {
				$arg = explode( '=', $arg );

				if ( 1 < count( $arg ) ) {
					$final_query_args[ $arg[0] ] = jet_engine()->listings->macros->do_macros( $arg[1], $url );
				}

			}

			if ( ! empty( $final_query_args ) ) {
				$url = add_query_arg( $final_query_args, $url );
			}

			return $url;
		}

		public function render() {

			$base_class = $this->get_name();
			$settings   = $this->get_settings();
			$tag        = isset( $settings['link_wrapper_tag'] ) ? $settings['link_wrapper_tag'] : 'div';

			ob_start();

			$classes = array(
				'jet-listing',
				$base_class,
			);

			if ( ! empty( $settings['className'] ) ) {
				$classes[] = esc_attr( $settings['className'] );
			}

			printf( '<%1$s class="%2$s">', $tag, implode( ' ', $classes ) );

				do_action( 'jet-engine/listing/dynamic-link/before-field', $this );

				$this->render_link( $settings, $base_class );

				do_action( 'jet-engine/listing/dynamic-link/after-field', $this );

			printf( '</%s>', $tag );

			$content = ob_get_clean();

			if ( $this->show_field ) {
				echo $content;
			}

		}

	}

}