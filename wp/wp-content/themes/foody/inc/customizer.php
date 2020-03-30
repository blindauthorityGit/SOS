<?php
/**
 * Foody Theme Customizer.
 *
 * @package Foody
 */

/**
 * Add postMessage support for site title and description for the Theme Customizer.
 *
 * @param WP_Customize_Manager $wp_customize Theme Customizer object.
 */

							
function foody_customize_register( $wp_customize ) {
	
	$wp_customize->get_setting( 'blogname' )->transport         = 'postMessage';
	$wp_customize->get_setting( 'blogdescription' )->transport  = 'postMessage';
	$wp_customize->get_setting( 'header_textcolor' )->transport = 'postMessage';
	
	
	// Home page option banner top content	
	$wp_customize->add_section("banner_top_content", array(
		"title" => __("Header Options", "foody"),
		"priority" => 30,
	));
	
			// for header content 1
			$wp_customize->add_setting("banner_top_content1", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"banner_top_content1",
				array(
					"label" => __("Banner Top Content 1", "foody"),
					"section" => "banner_top_content",
					"settings" => "banner_top_content1",
					"type" => "text",
					
				)
			));
			
			// for header content 2
			$wp_customize->add_setting("banner_top_content2", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"banner_top_content2",
				array(
					"label" => __("Banner Top Content 2", "foody"),
					"section" => "banner_top_content",
					"settings" => "banner_top_content2",
					"type" => "text",
					
				)
			));
			
			// for header content 3
			$wp_customize->add_setting("banner_top_content3", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"banner_top_content3",
				array(
					"label" => __("Banner Top Content 3", "foody"),
					"section" => "banner_top_content",
					"settings" => "banner_top_content3",
					"type" => "text",
					
				)
			));
			
			// header featured image
				$wp_customize->add_setting("header_feature_img", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'esc_url_raw'
			));
			$wp_customize->add_control(new WP_Customize_Image_Control(
				$wp_customize,
				"header_feature_img",
				array(
					"label" => __("Header Featured Image", "foody"),
					"section" => "banner_top_content",
					"settings" => "header_feature_img",
					
				)
			));
	
	
	
	// Banner image
	$wp_customize->add_section("banner", array(
		"title" => __("Banner", "foody"),
		"priority" => 31,
	));
	
		// for banner on off option
		$wp_customize->add_setting("foody_home_banner_on_off", array(
			"default" => 'off',
			"transport" => "refresh",
			'sanitize_callback' => 'foody_radio_sanitize_row',
		));
		$wp_customize->add_control(new WP_Customize_Control(
			$wp_customize,
			"foody_home_banner_on_off",
			array(
			'type' => 'radio',
			'label' => __("Banner On/Off", "foody"),
			'section' => 'banner',
			'choices' => array(
				'on' => 'On',
				'off' => 'Off',
			),
		)
		));	
			
			// for banner image 1
			$wp_customize->add_setting("bnr_img1", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'esc_url_raw'
			));
			$wp_customize->add_control(new WP_Customize_Image_Control(
				$wp_customize,
				"bnr_img1",
				array(
					"label" => __("Banner Image 1", "foody"),
					"section" => "banner",
					"settings" => "bnr_img1",
					
				)
			)); 
			
			// for banner image 2
			$wp_customize->add_setting("bnr_img2", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'esc_url_raw'
			));
			$wp_customize->add_control(new WP_Customize_Image_Control(
				$wp_customize,
				"bnr_img2",
				array(
					"label" => __("Banner Image 2", "foody"),
					"section" => "banner",
					"settings" => "bnr_img2",
					
				)
			)); 
			
			// for banner image 3
			$wp_customize->add_setting("bnr_img3", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'esc_url_raw'
			));
			
			$wp_customize->add_control(new WP_Customize_Image_Control(
				$wp_customize,
				"bnr_img3",
				array(
					"label" => __("Banner Image 3", "foody"),
					"section" => "banner",
					"settings" => "bnr_img3",
					
				)
			));
	
	
	//Home page product title
	$wp_customize->add_section("product_title_set", array(
		"title" => __("Product Title Text", "foody"),
		"priority" => 32,
	));
	
			// for recent product title
			$wp_customize->add_setting("recent_product_titl", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"recent_product_titl",
				array(
					"label" => __("Recent Product Title", "foody"),
					"section" => "product_title_set",
					"settings" => "recent_product_titl",
					
				)
			));
			
			// for sale product title
			$wp_customize->add_setting("sale_product_titl", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"sale_product_titl",
				array(
					"label" => __("Sale Product Title", "foody"),
					"section" => "product_title_set",
					"settings" => "sale_product_titl",
					
				)
			));
			
			// for best selling product title
			$wp_customize->add_setting("best_selling_product_titl", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"best_selling_product_titl",
				array(
					"label" => __("Best Selling Product Title", "foody"),
					"section" => "product_title_set",
					"settings" => "best_selling_product_titl",
					
				)
			));
	
	
	//Footer text 
	$wp_customize->add_section("footer_sec", array(
		"title" => __("Footer Text", "foody"),
		"priority" => 32,
	));
			
			// for copyright text
			$wp_customize->add_setting("footer_text", array(
				"default" => '',
				"transport" => "refresh",
				'sanitize_callback' => 'foody_text_sanitize'
			));
			$wp_customize->add_control(new WP_Customize_Control(
				$wp_customize,
				"footer_text",
				array(
					"label" => __("Footer Text", "foody"),
					"section" => "footer_sec",
					"settings" => "footer_text",
					
				)
			));
	
}
add_action( 'customize_register', 'foody_customize_register' );

function foody_text_sanitize( $input ) {
	return wp_kses_post( force_balance_tags( $input ) );
}

function foody_radio_sanitize_row($input) {
  $valid_keys = array(
		'on' => 'On',
		'off' => 'Off',
  );
  if ( array_key_exists( $input, $valid_keys ) ) {
	 return $input;
  } else {
	 return '';
  }
}
/**
 * Binds JS handlers to make Theme Customizer preview reload changes asynchronously.
 */
function foody_customize_preview_js() {
	wp_enqueue_script( 'foody_customizer', get_template_directory_uri() . '/js/customizer.js', array( 'customize-preview' ), '1.0', true );
}
add_action( 'customize_preview_init', 'foody_customize_preview_js' );