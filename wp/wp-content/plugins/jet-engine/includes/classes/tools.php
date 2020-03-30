<?php
/**
 * Tools class
 */

class Jet_Engine_Tools {

	/**
	 * Returns all post types list to use in JS components
	 *
	 * @return [type] [description]
	 */
	public static function get_post_types_for_js( $placeholder = false ) {

		$post_types = get_post_types( array(), 'objects' );
		$types_list = self::prepare_list_for_js( $post_types, 'name', 'label' );

		if ( $placeholder && is_array( $placeholder ) ) {
			$types_list = array_merge( array( $placeholder ), $types_list );
		}

		return $types_list;
	}

	/**
	 * Return all taxonomies list to use in JS components
	 *
	 * @return [type] [description]
	 */
	public static function get_taxonomies_for_js() {
		$taxonomies = get_taxonomies( array(), 'objects' );
		return self::prepare_list_for_js( $taxonomies, 'name', 'label' );
	}

	/**
	 * Prepare pssed array for using in JS options
	 *
	 * @return [type] [description]
	 */
	public static function prepare_list_for_js( $array = array(), $value_key = null, $label_key = null ) {

		$result = array();

		if ( ! is_array( $array ) || empty( $array ) ) {
			return $result;
		}

		foreach ( $array as $item ) {

			$value = null;
			$label = null;

			if ( is_object( $item ) ) {
				$value = $item->$value_key;
				$label = $item->$label_key;
			} elseif ( is_array( $item ) ) {
				$value = $item[ $value_key ];
				$label = $item[ $label_key ];
			} else {
				$value = $item;
				$label = $item;
			}

			$result[] = array(
				'value' => $value,
				'label' => $label,
			);
		}

		return $result;

	}

	/**
	 * Render new elementor icons
	 *
	 * @return [type] [description]
	 */
	public static function render_icon( $icon, $icon_class ) {

		if ( ! is_array( $icon ) && is_numeric( $icon ) ) {
			ob_start();

			echo '<div class="' . $icon_class . ' is-svg-icon">';
			echo wp_get_attachment_image( $icon, 'full' );
			echo '</div>';

			return ob_get_clean();
		}

		if ( empty( $icon['value'] ) ) {
			return false;
		}

		$is_new = class_exists( 'Elementor\Icons_Manager' ) && Elementor\Icons_Manager::is_migration_allowed();

		if ( $is_new ) {
			ob_start();

			if ( 'svg' === $icon['library'] ) {
				echo '<div class="' . $icon_class . ' is-svg-icon">';
			}

			Elementor\Icons_Manager::render_icon( $icon, array(
				'class'       => $icon_class,
				'aria-hidden' => 'true',
			) );

			if ( 'svg' === $icon['library'] ) {
				echo '</div>';
			}

			return ob_get_clean();

		} else {
			return false;
		}

	}

	/**
	 * Get html attributes string.
	 *
	 * @param  array $attrs
	 * @return string
	 */
	public static function get_attr_string( $attrs ) {
		$result_array = array();

		foreach ( $attrs as $key => $value ) {
			if ( is_array( $value ) ) {
				$value = join( ' ', $value );
			}

			$result_array[] = sprintf( '%1$s="%2$s"', $key, esc_attr( $value ) );
		}

		return join( ' ', $result_array );
	}

	/**
	 * Check if is valid timestamp
	 *
	 * @param  mixed $timestamp
	 * @return boolean
	 */
	public static function is_valid_timestamp( $timestamp ) {
		return ( ( string ) ( int ) $timestamp === $timestamp || ( int ) $timestamp === $timestamp )
			&& ( $timestamp <= PHP_INT_MAX )
			&& ( $timestamp >= ~PHP_INT_MAX );
	}

}
