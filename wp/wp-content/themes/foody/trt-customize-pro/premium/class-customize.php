<?php
/**
 * Singleton class for handling the theme's customizer integration.
 *
 * @since  1.0.0
 * @access public
 */
final class Foody_Customize {

	/**
	 * Returns the instance.
	 *
	 * @since  1.0.0
	 * @access public
	 * @return object
	 */
	public static function foody_get_instance() {

		static $instance = null;

		if ( is_null( $instance ) ) {
			$instance = new self;
			$instance->foody_setup_actions();
		}

		return $instance;
	}

	/**
	 * Constructor method.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private function __construct() {}

	/**
	 * Sets up initial actions.
	 *
	 * @since  1.0.0
	 * @access private
	 * @return void
	 */
	private function foody_setup_actions() {

		// Register panels, sections, settings, controls, and partials.
		add_action( 'customize_register', array( $this, 'foody_sections' ) );

		// Register scripts and styles for the controls.
		add_action( 'customize_controls_enqueue_scripts', array( $this, 'foody_enqueue_control_scripts' ), 0 );
	}

	/**
	 * Sets up the customizer sections.
	 *
	 * @since  1.0.0
	 * @access public
	 * @param  object  $manager
	 * @return void
	 */
	public function foody_sections( $foody_manager ) {

		get_template_part('trt-customize-pro/premium/section','pro');
		
		// Register custom section types.
		$foody_manager->register_section_type( 'Foody_Customize_Section_Pro' );

		// Register sections.
		$foody_manager->add_section(
			new Foody_Customize_Section_Pro(
				$foody_manager,
				'foody_pro',
				array(
					'title'    => esc_html__( 'Foody Pro', 'foody' ),
					'pro_text' => esc_html__( 'Go Pro','foody' ),
					'pro_url'  => 'https://www.phoeniixx.com/product/foody/',
					'priority' => 11,
					
				)
			)
		);
	}

	/**
	 * Loads theme customizer CSS.
	 *
	 * @since  1.0.0
	 * @access public
	 * @return void
	 */
	public function foody_enqueue_control_scripts() {

		wp_enqueue_script( 'foody-customize-controls', trailingslashit( get_template_directory_uri() ) . 'trt-customize-pro/premium/customize-controls.js', array( 'customize-controls' ) );

		wp_enqueue_style( 'foody-customize-controls', trailingslashit( get_template_directory_uri() ) . 'trt-customize-pro/premium/customize-controls.css' );
	}
}

// Doing this customizer thang!
Foody_Customize::foody_get_instance();
