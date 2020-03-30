/**
 * File customizer.js.
 *
 * Theme Customizer enhancements for a better user experience.
 *
 * Contains handlers to make Theme Customizer preview reload changes asynchronously.
 */

( function( $ ) {

	// Site title and description.
	wp.customize( 'blogname', function( value ) {
		value.bind( function( to ) {
			$( '.site-title a' ).text( to );
		} );
	} );
	wp.customize( 'blogdescription', function( value ) {
		value.bind( function( to ) {
			$( '.site-description' ).text( to );
		} );
	} );

	// Header text color.
	wp.customize( 'header_textcolor', function( value ) {
		value.bind( function( to ) {
			if ( 'blank' === to ) {
				$( '.site-title a, .site-description' ).css( {
					'clip': 'rect(1px, 1px, 1px, 1px)',
					'position': 'absolute'
				} );
			} else {
				$( '.site-title a, .site-description' ).css( {
					'clip': 'auto',
					'position': 'relative'
				} );
				$( '.site-title a, .site-description' ).css( {
					'color': to
				} );
			}
		} );
	} );
	
	// Whether a header image is available.
	function hasHeaderImage() {
		var image = wp.customize( 'header_image' )();
		return '' !== image && 'remove-header' !== image;
	}
	
	// Toggle a body class if a custom header exists.
	$.each( [ 'external_header_video', 'header_image', 'header_video' ], function( index, settingId ) {
		wp.customize( settingId, function( setting ) {
			setting.bind(function() {
				if ( hasHeaderImage() ) {
					$( document.body ).addClass( 'has-header-image' );
				} else {
					$( document.body ).removeClass( 'has-header-image' );
				}

				if ( ! hasHeaderVideo() ) {
					$( document.body ).removeClass( 'has-header-video' );
				}
			} );
		} );
	} );
	
	// for banner on/off
	wp.customize("foody_home_banner_on_off", function(value) {
		value.bind(function(newval) {
			$("#foody_home_banner_on_off").html(newval);
		} );
	});
	
	// for banner image 1
	wp.customize("bnr_img1", function(value) {
		value.bind(function(newval) {
			$("#bnr_img1").html(newval);
		} );
	});
	
	// for banner image 2
	wp.customize("bnr_img2", function(value) {
		value.bind(function(newval) {
			$("#bnr_img2").html(newval);
		} );
	});
	
	// for banner image 3
	wp.customize("bnr_img3", function(value) {
		value.bind(function(newval) {
			$("#bnr_img3").html(newval);
		} );
	});
	
	// banner top content 1
	wp.customize("banner_top_content1", function(value) {
		value.bind(function(newval) {
			$("#banner_top_content1").html(newval);
		} );
	});
	
	// banner top content 2
	wp.customize("banner_top_content2", function(value) {
		value.bind(function(newval) {
			$("#banner_top_content2").html(newval);
		} );
	});
	
	// banner top content 3
	wp.customize("banner_top_content3", function(value) {
		value.bind(function(newval) {
			$("#banner_top_content3").html(newval);
		} );
	});
	
	// for footer text
	wp.customize("footer_text", function(value) {
		value.bind(function(newval) {
			$("#footer_text").html(newval);
		} );
	});
	
	// for recent product title
	wp.customize("recent_product_titl", function(value) {
		value.bind(function(newval) {
			$("#recent_product_titl").html(newval);
		} );
	});
	
	// for sale product title
	wp.customize("sale_product_titl", function(value) {
		value.bind(function(newval) {
			$("#sale_product_titl").html(newval);
		} );
	});
	
	// for best selling product title
	wp.customize("best_selling_product_titl", function(value) {
		value.bind(function(newval) {
			$("#best_selling_product_titl").html(newval);
		} );
	});
	
} )( jQuery );