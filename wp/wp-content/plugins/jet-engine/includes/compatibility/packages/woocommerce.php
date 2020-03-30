<?php
/**
 * Class description
 *
 * @package   package_name
 * @author    Cherry Team
 * @license   GPL-2.0+
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Woo_Package' ) ) {

	/**
	 * Define Jet_Engine_Woo_Package class
	 */
	class Jet_Engine_Woo_Package {

		/**
		 * Constructor for the class
		 */
		public function __construct() {
			add_filter( 'jet-engine/post-type/product/meta-fields', array( $this, 'product_fields' ) );
			add_filter( 'jet-engine/taxonomy/product_cat/meta-fields', array( $this, 'product_cat_fields' ) );
			add_action( 'woocommerce_shop_loop', array( $this, 'set_object_on_each_loop_post' ) );
		}

		/**
		 * Set current product as current listing object for each product loop item
		 */
		public function set_object_on_each_loop_post() {
			if ( jet_engine()->listings ) {
				global $post;
				jet_engine()->listings->data->set_current_object( $post );
			}
		}

		/**
		 * Product fields
		 *
		 * @return array
		 */
		public function product_fields( $fields ) {

			if ( empty( $fields ) ) {
				$fields = array();
			}

			$fields[] = array(
				'name'  => '_regular_price',
				'type'  => 'text',
				'title' => __( 'Price', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_sale_price',
				'type'  => 'text',
				'title' => __( 'Sale Price', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_sku',
				'type'  => 'text',
				'title' => __( 'SKU', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => 'total_sales',
				'type'  => 'text',
				'title' => __( 'Sales', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_wc_average_rating',
				'type'  => 'text',
				'title' => __( 'Average Rating', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_stock_status',
				'type'  => 'text',
				'title' => __( 'Stock Status', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_weight',
				'type'  => 'text',
				'title' => __( 'Weight', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_length',
				'type'  => 'text',
				'title' => __( 'Length', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_width',
				'type'  => 'text',
				'title' => __( 'Width', 'jet-engine' ),
			);

			$fields[] = array(
				'name'  => '_height',
				'type'  => 'text',
				'title' => __( 'Height', 'jet-engine' ),
			);

			return $fields;
		}

		/**
		 * Product category fields
		 *
		 * @return array
		 */
		public function product_cat_fields( $fields ) {

			$fields[] = array(
				'name'  => 'thumbnail_id',
				'type'  => 'media',
				'title' => __( 'Thumbnail', 'jet-engine' ),
			);

			return $fields;

		}

	}

}

new Jet_Engine_Woo_Package();
