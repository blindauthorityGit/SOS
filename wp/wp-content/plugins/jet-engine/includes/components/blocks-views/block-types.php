<?php
/**
 * Elementor views manager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Blocks_Views_Types' ) ) {

	/**
	 * Define Jet_Engine_Blocks_Views_Types class
	 */
	class Jet_Engine_Blocks_Views_Types {

		public function __construct() {
			$this->register_block_types();
		}

		/**
		 * Register block types
		 *
		 * @return [type] [description]
		 */
		public function register_block_types() {

			$types_dir = jet_engine()->plugin_path( 'includes/components/blocks-views/block-types/' );

			require $types_dir . 'base.php';
			require $types_dir . 'dynamic-field.php';
			require $types_dir . 'dynamic-image.php';
			require $types_dir . 'dynamic-link.php';
			require $types_dir . 'dynamic-repeater.php';
			require $types_dir . 'dynamic-meta.php';
			require $types_dir . 'dynamic-terms.php';
			require $types_dir . 'listing-grid.php';

			new Jet_Engine_Blocks_Views_Type_Dynamic_Field();
			new Jet_Engine_Blocks_Views_Type_Dynamic_Image();
			new Jet_Engine_Blocks_Views_Type_Dynamic_Link();
			new Jet_Engine_Blocks_Views_Type_Dynamic_Repeater();
			new Jet_Engine_Blocks_Views_Type_Dynamic_Meta();
			new Jet_Engine_Blocks_Views_Type_Dynamic_Terms();

			new Jet_Engine_Blocks_Views_Type_Listing_Grid();

		}

	}

}