<?php
/**
 * Listings manager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Listings' ) ) {

	/**
	 * Define Jet_Engine_Listings class
	 */
	class Jet_Engine_Listings {

		/**
		 * A reference to an instance of this class.
		 *
		 * @since 1.0.0
		 * @var   object
		 */
		private static $instance = null;

		/**
		 * Library items id for tabs and options list
		 *
		 * @var string
		 */
		private $_id= 'jet-listing-items';

		/**
		 * Macros manager instance
		 *
		 * @var null
		 */
		public $macros = null;

		/**
		 * Filters manager instance
		 *
		 * @var null
		 */
		public $filters = null;

		/**
		 * Data manager instance
		 *
		 * @var null
		 */
		public $data = null;

		/**
		 * Holder for created listings
		 *
		 * @var null
		 */
		public $listings = null;

		/**
		 * Listings post type object
		 *
		 * @var null
		 */
		public $post_type = null;

		/**
		 * Constructor for the class
		 */
		function __construct() {

			require jet_engine()->plugin_path( 'includes/components/listings/post-type.php' );
			require jet_engine()->plugin_path( 'includes/components/listings/macros.php' );
			require jet_engine()->plugin_path( 'includes/components/listings/filters.php' );
			require jet_engine()->plugin_path( 'includes/components/listings/data.php' );

			$this->post_type = new Jet_Engine_Listings_Post_Type();
			$this->macros    = new Jet_Engine_Listings_Macros();
			$this->filters   = new Jet_Engine_Listings_Filters();
			$this->data      = new Jet_Engine_Listings_Data();

			// Ensure backward compatibility
			jet_engine()->post_type = $this->post_type;

			// Frontend
			require jet_engine()->plugin_path( 'includes/components/listings/frontend.php' );
			jet_engine()->frontend = new Jet_Engine_Frontend();

		}

		/**
		 * Returns new listing document
		 *
		 * @param  array  $setting [description]
		 * @return [type]          [description]
		 */
		public function get_new_doc( $setting = array() ) {

			if ( ! class_exists( 'Jet_Engine_Listings_Document' ) ) {
				require jet_engine()->plugin_path( 'includes/components/listings/document.php' );
			}

			return new Jet_Engine_Listings_Document( $setting );
		}

		/**
		 * Return registered listings
		 *
		 * @return [type] [description]
		 */
		public function get_listings() {

			if ( null === $this->listings ) {
				$this->listings = get_posts( array(
					'post_type'      => jet_engine()->post_type->slug(),
					'post_status'    => 'publish',
					'posts_per_page' => -1,
				) );
			}

			return $this->listings;
		}

		/**
		 * Get listings list for options.
		 *
		 * @param string $context Context: elementor or blocks
		 *
		 * @return array
		 */
		public function get_listings_for_options( $context = 'elementor' ) {
			$listings = $this->get_listings();
			$list = wp_list_pluck( $listings, 'post_title', 'ID' );

			$result = array();

			if ( 'blocks' === $context ) {

				$result[] = array(
					'value' => '',
					'label' => '--',
				);

				foreach ( $list as $value => $label ) {
					$result[] = array(
						'value' => $value,
						'label' => $label,
					);
				}

			} else {
				$result = array( '' => '--' ) + $list;
			}

			return $result;
		}

		/**
		 * Get widget hide options.
		 *
		 * @param string $context Context: elementor or blocks
		 *
		 * @return array
		 */
		public function get_widget_hide_options( $context = 'elementor' ) {

			$hide_options = apply_filters( 'jet-engine/listing/grid/widget-hide-options', array(
				''            => __( 'Always show', 'jet-engine' ),
				'empty_query' => __( 'Query is empty', 'jet-engine' ),
			) );

			$result = array();

			if ( 'blocks' === $context ) {
				foreach ( $hide_options as $value => $label ) {
					$result[] = array(
						'value' => $value,
						'label' => $label,
					);
				}

			} else {
				$result = $hide_options;
			}

			return $result;
		}

		/**
		 * Return Listings items slug/ID
		 *
		 * @return [type] [description]
		 */
		public function get_id() {
			return $this->_id;
		}

		/**
		 * Get post types list for options.
		 *
		 * @return array
		 */
		public function get_post_types_for_options() {

			$args = array(
				'public' => true,
			);

			$post_types = get_post_types( $args, 'objects', 'and' );
			$post_types = wp_list_pluck( $post_types, 'label', 'name' );

			if ( isset( $post_types[ jet_engine()->post_type->slug() ] ) ) {
				unset( $post_types[ jet_engine()->post_type->slug() ] );
			}

			return $post_types;

		}

		/**
		 * Returns image size array in slug => name format
		 *
		 * @return  array
		 */
		public function get_image_sizes( $context = 'elementor' ) {

			global $_wp_additional_image_sizes;

			$sizes         = get_intermediate_image_sizes();
			$result        = array();
			$blocks_result = array();

			foreach ( $sizes as $size ) {
				if ( in_array( $size, array( 'thumbnail', 'medium', 'medium_large', 'large' ) ) ) {
					$label           = ucwords( trim( str_replace( array( '-', '_' ), array( ' ', ' ' ), $size ) ) );
					$result[ $size ] = $label;
					$blocks_result[] = array(
						'value' => $size,
						'label' => $label,
					);

				} else {

					$label = sprintf(
						'%1$s (%2$sx%3$s)',
						ucwords( trim( str_replace( array( '-', '_' ), array( ' ', ' ' ), $size ) ) ),
						$_wp_additional_image_sizes[ $size ]['width'],
						$_wp_additional_image_sizes[ $size ]['height']
					);

					$result[ $size ] = $label;
					$blocks_result[] = array(
						'value' => $size,
						'label' => $label,
					);
				}
			}

			$result        = array_merge( array( 'full' => __( 'Full', 'jet-engine' ), ), $result );
			$blocks_result = array_merge(
				array(
					array(
						'value' => 'full',
						'label' => __( 'Full', 'jet-engine' ),
					)
				),
				$blocks_result
			);

			if ( 'blocks' === $context ) {
				return $blocks_result;
			} else {
				return $result;
			}
		}

		/**
		 * Get post taxonomies for options.
		 *
		 * @return array
		 */
		public function get_taxonomies_for_options() {

			$args = array(
				'public' => true,
			);

			$taxonomies = get_taxonomies( $args, 'objects', 'and' );

			return wp_list_pluck( $taxonomies, 'label', 'name' );
		}

		/**
		 * Returns current render instance
		 *
		 * @return object
		 */
		public function get_render_instance( $item = null, $settings = array() ) {

			$renderers = array(
				'dynamic-field'    => 'Jet_Engine_Render_Dynamic_Field',
				'dynamic-image'    => 'Jet_Engine_Render_Dynamic_Image',
				'dynamic-repeater' => 'Jet_Engine_Render_Dynamic_Repeater',
				'dynamic-meta'     => 'Jet_Engine_Render_Dynamic_Meta',
				'dynamic-link'     => 'Jet_Engine_Render_Dynamic_Link',
				'dynamic-terms'    => 'Jet_Engine_Render_Dynamic_Terms',
				'listing-grid'     => 'Jet_Engine_Render_Listing_Grid',
			);

			$current_renderer = isset( $renderers[ $item ] ) ? $renderers[ $item ] : false;

			if ( ! $current_renderer ) {
				return;
			}

			if ( ! class_exists( 'Jet_Engine_Render_Base' ) ) {
				require jet_engine()->plugin_path( 'includes/components/listings/render/base.php' );
			}

			if ( ! class_exists( $current_renderer ) ) {
				require jet_engine()->plugin_path( 'includes/components/listings/render/' . $item . '.php' );
			}

			return new $current_renderer( $settings );
		}

		/**
		 * Render listing
		 *
		 * @param array $settings
		 */
		public function render_listing( $settings = array() ) {

			$instance = $this->get_render_instance( 'listing-grid', $settings );
			$instance->render();

		}

		/**
		 * Render new listing item part
		 *
		 * @param  [type] $item     [description]
		 * @param  [type] $settings [description]
		 * @return [type]           [description]
		 */
		public function render_item( $item = null, $settings = array() ) {

			$instance = $this->get_render_instance( $item, $settings );
			$instance->render();

		}

		/**
		 * Returns allowed fields callbacks
		 *
		 * @return [type] [description]
		 */
		public function get_allowed_callbacks() {

			return apply_filters( 'jet-engine/listings/allowed-callbacks', array(
				'date'                                  => __( 'Format date', 'jet-engine' ),
				'date_i18n'                             => __( 'Format date (localized)', 'jet-engine' ),
				'number_format'                         => __( 'Format number', 'jet-engine' ),
				'get_permalink'                         => __( 'Get post/page link (only URL)', 'jet-engine' ),
				'jet_get_pretty_post_link'              => __( 'Get post/page link (linked title)', 'jet-engine' ),
				'get_term_link'                         => __( 'Get term link', 'jet-engine' ),
				'wp_oembed_get'                         => __( 'Embed URL', 'jet-engine' ),
				'make_clickable'                        => __( 'Make clickable', 'jet-engine' ),
				'jet_engine_icon_html'                  => __( 'Embed icon from Iconpicker', 'jet-engine' ),
				'jet_engine_render_multiselect'         => __( 'Multiple select field values', 'jet-engine' ),
				'jet_engine_render_checkbox_values'     => __( 'Checkbox field values', 'jet-engine' ),
				'jet_engine_render_checklist'           => __( 'Checked values list', 'jet-engine' ),
				'jet_engine_render_switcher'            => __( 'Switcher field values', 'jet-engine' ),
				'jet_engine_render_acf_checkbox_values' => __( 'ACF Checkbox field values', 'jet-engine' ),
				'jet_engine_render_post_titles'         => __( 'Get post titles from IDs', 'jet-engine' ),
				'jet_related_posts_list'                => __( 'Related posts list', 'jet-engine' ),
				'jet_engine_render_field_values_count'  => __( 'Field values count', 'jet-engine' ),
				'wp_get_attachment_image'               => __( 'Get image by ID', 'jet-engine' ),
				'do_shortcode'                          => __( 'Do shortcodes', 'jet-engine' ),
			) );

		}

	}

}
