<?php
/**
 * Class description
 *
 * @package   JetWoo Widgets
 * @author    Zemez
 * @license   GPL-2.0+
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Woo_Widgets_Shortcodes' ) ) {

	/**
	 * Define Jet_Woo_Widgets_Shortcodes class
	 */
	class Jet_Woo_Widgets_Shortcodes {

		/**
		 * A reference to an instance of this class.
		 *
		 * @since 1.0.0
		 * @var   object
		 */
		private static $instance = null;

		/**
		 * Check if processing elementor widget
		 *
		 * @var boolean
		 */
		private $shortocdes = array();

		/**
		 * Initalize integration hooks
		 *
		 * @return void
		 */
		public function init() {
			add_action( 'init', array( $this, 'register_shortcodes' ), 30 );
		}

		/**
		 * Register plugins shortcodes
		 *
		 * @return void
		 */
		public function register_shortcodes() {

			require jet_woo_widgets()->plugin_path( 'includes/base/class-jet-woo-widgets-shortcode-base.php' );

			foreach ( glob( jet_woo_widgets()->plugin_path( 'includes/shortcodes/' ) . '*.php' ) as $file ) {
				$this->register_shortcode( $file );
			}

		}

		/**
		 * Call chortcode instance from passed file.
		 *
		 * @return void
		 */
		public function register_shortcode( $file ) {

			$base  = basename( str_replace( '.php', '', $file ) );
			$class = ucwords( str_replace( '-', ' ', $base ) );
			$class = str_replace( ' ', '_', $class );

			require $file;

			if ( ! class_exists( $class ) ) {
				return;
			}

			$shortcode = new $class;

			$this->shortocdes[ $shortcode->get_tag() ] = $shortcode;

		}

		/**
		 * Get shortcode class instance by tag
		 *
		 * @param  [type] $tag [description]
		 * @return [type]      [description]
		 */
		public function get_shortcode( $tag ) {
			return isset( $this->shortocdes[ $tag ] ) ? $this->shortocdes[ $tag ] : false;
		}

		/**
		 * Returns the instance.
		 *
		 * @since  1.0.0
		 * @return object
		 */
		public static function get_instance( $shortcodes = array() ) {

			// If the single instance hasn't been set, set it now.
			if ( null == self::$instance ) {
				self::$instance = new self( $shortcodes );
			}
			return self::$instance;
		}
	}

}

/**
 * Returns instance of Jet_Woo_Widgets_Shortcodes
 *
 * @return object
 */
function jet_woo_widgets_shortocdes() {
	return Jet_Woo_Widgets_Shortcodes::get_instance();
}
