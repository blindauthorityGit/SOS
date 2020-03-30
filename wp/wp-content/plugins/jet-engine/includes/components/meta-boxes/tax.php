<?php
/**
 * Meta boxes mamager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_CPT_Meta' ) ) {
	require jet_engine()->plugin_path( 'includes/components/meta-boxes/post.php' );
}

if ( ! class_exists( 'Jet_Engine_CPT_Tax_Meta' ) ) {

	/**
	 * Define Jet_Engine_CPT_Tax_Meta class
	 */
	class Jet_Engine_CPT_Tax_Meta extends Jet_Engine_CPT_Meta {

		/**
		 * Constructor for the class
		 */
		function __construct( $taxonomy, $meta_box ) {

			new Cherry_X_Term_Meta( array(
				'tax'        => $taxonomy,
				'builder_cb' => array( $this, 'get_builder_for_meta' ),
				'fields'     => $this->prepare_meta_fields( $meta_box ),
			) );

		}

	}

}
