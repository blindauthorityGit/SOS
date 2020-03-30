<?php
/**
 * Popup compatibility package
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Popup_Package' ) ) {

	/**
	 * Define Jet_Engine_Popup_Package class
	 */
	class Jet_Engine_Popup_Package {

		public function __construct() {

			add_action(
				'jet-popup/editor/widget-extension/after-base-controls',
				array( $this, 'register_controls' ),
				10, 2
			);

			add_filter(
				'jet-popup/widget-extension/widget-before-render-settings',
				array( $this, 'pass_engine_trigger' ),
				10, 2
			);

			add_filter(
				'jet-popup/ajax-request/get-elementor-content',
				array( $this, 'get_popup_content' ),
				10, 2
			);
		}

		/**
		 * Register Engine trigger
		 * @return [type] [description]
		 */
		public function register_controls( $manager ) {

			$manager->add_control(
				'jet_engine_dynamic_popup',
				array(
					'label'        => __( 'Jet Engine Listing popup', 'jet-engine' ),
					'type'         => Elementor\Controls_Manager::SWITCHER,
					'label_on'     => __( 'Yes', 'jet-engine' ),
					'label_off'    => __( 'No', 'jet-engine' ),
					'return_value' => 'yes',
					'default'      => '',
				)
			);

		}

		/**
		 * If jet_engine_dynamic_popup enbled - set apropriate key in localized popup data
		 *
		 * @param  [type] $data     [description]
		 * @param  [type] $settings [description]
		 * @return [type]           [description]
		 */
		public function pass_engine_trigger( $data, $settings ) {

			$engine_trigger = ! empty( $settings['jet_engine_dynamic_popup'] ) ? true : false;

			if ( $engine_trigger ) {
				$data['is-jet-engine'] = $engine_trigger;
			}

			return $data;

		}

		/**
		 * Get dynamica content related to passed post ID
		 *
		 * @param  [type] $content    [description]
		 * @param  [type] $popup_data [description]
		 * @return [type]             [description]
		 */
		public function get_popup_content( $content, $popup_data ) {

			if ( empty( $popup_data['isJetEngine'] ) || empty( $popup_data['postId'] ) ) {
				return $content;
			}

			$popup_id = $popup_data['popup_id'];

			if ( empty( $popup_id ) ) {
				return $content;
			}

			do_action( 'jet-engine/compatibility/popup-package/get-content', $content, $popup_data );

			$plugin = Elementor\Plugin::instance();

			global $post;

			$post = get_post( $popup_data['postId'] );

			setup_postdata( $post, null, false );
			jet_engine()->listings->data->set_current_object( $post );
			$content = $plugin->frontend->get_builder_content( $popup_id );
			$content = apply_filters( 'jet-engine/compatibility/popup-package/the_content', $content, $popup_data );
			wp_reset_postdata( $post );

			return $content;

		}

	}

}

new Jet_Engine_Popup_Package();
