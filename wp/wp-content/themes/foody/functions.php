<?php
/**
 * Foody functions and definitions.
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package Foody
 */

if ( ! function_exists( 'foody_setup' ) ) :
/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
 
 
function foody_setup() {
	/*
	 * Make theme available for translation.
	 * Translations can be filed at WordPress.org.
	 * If you're building a theme based on foody, use a find and replace
	 * to change 'foody' to the name of your theme in all the template files.
	 */
	load_theme_textdomain( 'foody');
	

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );
	
	// add theme support woocommerce 	
	add_theme_support( 'woocommerce' );

	/*
	 * Let WordPress manage the document title.
	 * By adding theme support, we declare that this theme does not use a
	 * hard-coded <title> tag in the document head, and expect WordPress to
	 * provide it for us.
	 */
	add_theme_support( 'title-tag' );
	
	// for custom logo		
		add_theme_support( 'custom-logo', array(		
			'height'      => 248,		
			'width'       => 248,		
			'flex-height' => true,		
		) );  

	/*
	 * Enable support for Post Thumbnails on posts and pages.
	 *
	 * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
	 */
	add_theme_support( 'post-thumbnails' );
	
	// Thumbnail sizes		
		add_image_size( 'foody-featured', 600, 600, true );		
				
		add_image_size( 'foody-featured-single', 980, 600, true );		
				
		add_editor_style('editor-style.css');		
				
		set_post_thumbnail_size( 825, 510, true );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menus( array(
		'primary' => esc_html__( 'Primary', 'foody' ),
	) );

	/*
	 * Switch default core markup for search form, comment form, and comments
	 * to output valid HTML5.
	 */
	add_theme_support( 'html5', array(
		'search-form',
		'comment-form',
		'comment-list',
		'gallery',
		'caption',
	) );

	
	// custom logo 		
		if ( ! function_exists( 'foody_custom_logo' ) ) :		
		/**		
	 	* Displays the optional custom logo.		
	 	*		
	 	*	 Does nothing if the custom logo is not available.		
	 	*		
	 	* @since foody		
	 	*/		
		function foody_custom_logo() {		
		if ( function_exists( 'the_custom_logo' ) ) {		
			the_custom_logo();		
		}		
	}		
		endif;
		
	// Set up the WordPress core custom background feature.
	add_theme_support( 'custom-background', apply_filters( 'foody_custom_background_args', array(
		'default-color' => 'ffffff',
		'default-image' => '',
	) ) );
}
endif;
add_action( 'after_setup_theme', 'foody_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function foody_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'foody_content_width', 640 );
}
add_action( 'after_setup_theme', 'foody_content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function foody_widgets_init() {
	register_sidebar( array(
		'name'          => esc_html__( 'Foody Sidebar', 'foody' ),
		'id'            => 'sidebar-1',
		'description'   => esc_html__( 'Add widgets here.', 'foody' ),
		'before_widget' => '<section id="%1$s" class="widget %2$s">',
		'after_widget'  => '</section>',
		'before_title'  => '<h2 class="widget-title">',
		'after_title'   => '</h2>',
	) );
	
	register_sidebar(array(		
			'id' => 'foody_footer1',		
			'name' => esc_html__( 'Footer 1', 'foody' ),		
			'description'   => esc_html__( 'Add widgets here.', 'foody' ),		
			'before_widget' => '<section id="%1$s" class="widget col-sm-2 %2$s">',		
			'after_widget' => '</section>',		
			'before_title' => '<h2 class="widgettitle">',		
			'after_title' => '</h2>',		
		));		
				
		register_sidebar(array(		
			'id' => 'foody_footer2',		
			'name' => esc_html__( 'Footer 2', 'foody' ),		
			'description'   => esc_html__( 'Add widgets here.', 'foody' ),		
			'before_widget' => '<section id="%1$s" class="widget col-sm-2 %2$s">',		
			'after_widget' => '</section>',		
			'before_title' => '<h2 class="widgettitle">',		
			'after_title' => '</h2>',		
		));		
		register_sidebar(array(		
			'id' => 'foody_footer3',		
			'name' => esc_html__( 'Footer 3', 'foody' ),		
			'description'   => esc_html__( 'Add widgets here.', 'foody' ),		
			'before_widget' => '<section id="%1$s" class="widget col-sm-2 %2$s">',		
			'after_widget' => '</section>',		
			'before_title' => '<h2 class="widgettitle">',		
			'after_title' => '</h2>',		
		));		
		register_sidebar(array(		
			'id' => 'foody_footer4',		
			'name' => esc_html__( 'Footer 4', 'foody' ),		
			'description'   => esc_html__( 'Add widgets here.', 'foody' ),		
			'before_widget' => '<section id="%1$s" class="widget col-sm-2 %2$s">',		
			'after_widget' => '</section>',		
			'before_title' => '<h2 class="widgettitle">',		
			'after_title' => '</h2>',		
		));
		register_sidebar(array(		
			'id' => 'foody_footer5',		
			'name' => esc_html__( 'Footer 5', 'foody' ),		
			'description'   => esc_html__( 'Add widgets here.', 'foody' ),		
			'before_widget' => '<section id="%1$s" class="widget col-sm-4 %2$s">',		
			'after_widget' => '</section>',		
			'before_title' => '<h2 class="widgettitle">',		
			'after_title' => '</h2>',		
		));
		
		register_sidebar(array(		
			'id' => 'sidebar-shop',		
			'name' => esc_html__( 'Sidebar Shop', 'foody' ),		
			'description'   => esc_html__( 'Add widgets here.', 'foody' ),		
			'before_widget' => '<section id="%1$s" class="widget %2$s">',		
			'after_widget' => '</section>',		
			'before_title' => '<h2 class="widgettitle">',		
			'after_title' => '</h2>',		
		));
		
}
add_action( 'widgets_init', 'foody_widgets_init' );

/* Rearange the position of price and rating on Shop page */
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 10 );
remove_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 5 );

add_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_price', 5 );
add_action( 'woocommerce_after_shop_loop_item_title', 'woocommerce_template_loop_rating', 10 );

// remove sidebar from single product page

function foody_remove_sidebar_product_page() {
    if ( is_singular('product') ) {
        remove_action('woocommerce_sidebar', 'woocommerce_get_sidebar');
    }
}
add_action('template_redirect', 'foody_remove_sidebar_product_page');

/**
 * Enqueue scripts and styles.
 */
function foody_scripts() {

	wp_enqueue_script( 'foody-navigation', get_template_directory_uri() . '/js/navigation.js', array('jquery'), '1.0', true );

	wp_enqueue_script( 'foody-skip-link-focus-fix', get_template_directory_uri() . '/js/skip-link-focus-fix.js', array('jquery'), '1.0', true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
		
	wp_enqueue_style( 'foody-raleway-font','https://fonts.googleapis.com/css?family=Raleway', array(), '1.0', 'all' );
	
	wp_enqueue_style( 'foody-shadows-into-light','https://fonts.googleapis.com/css?family=Shadows+Into+Light', array(), '1.0', 'all' );
	
	wp_enqueue_style( 'bootstrap', get_template_directory_uri() .'/css/bootstrap.min.css',array(),'3.3.4' );
	
	wp_enqueue_style( 'font-awesome', get_template_directory_uri() .'/css/font-awesome-4.3.0/css/font-awesome.min.css',array(),'4.0.3' );
	
	wp_enqueue_style( 'foody-style', get_stylesheet_uri() );
 
	wp_enqueue_script( 'bootstrap', get_template_directory_uri() . '/js/bootstrap.min.js', array('jquery'), '3.3.4', true );
	
	wp_enqueue_script( 'foody-custom-js', get_template_directory_uri() . '/js/foody-custom-js.js', array('jquery'), '3.3.4', true );
	
}
add_action( 'wp_enqueue_scripts', 'foody_scripts' );

function foody_admin_script($foody_hook){
	
	if($foody_hook != 'appearance_page_foody_pro') {
		return;
	} 
    
	wp_enqueue_style( 'foody-font-awesome', get_template_directory_uri() .'/css/font-awesome-4.3.0/css/font-awesome.min.css',array(),'4.0.3' );
	wp_enqueue_style( 'foody-custom-css', get_template_directory_uri() .'/css/foody_custom.css',array(),'1.0' );

}

add_action( 'admin_enqueue_scripts', 'foody_admin_script' );

// Display an optional post thumbnail.
if ( ! function_exists( 'foody_post_thumbnail')) :		
		
			
	function foody_post_thumbnail() {		
			
		if ( post_password_required() || is_attachment() || ! has_post_thumbnail() ) {		
			
			return;		
			
		}		
			
			
		if ( is_singular() ) :		
			
		?>		
			
			
		<div class="entry-summary">		
			
			<?php the_post_thumbnail(); ?>		
			
		</div><!-- .post-thumbnail -->		
			
			
		<?php else : ?>		
			
			
		<div class="post-thumbnail">		
			<a href="<?php the_permalink(); ?>">		
			
				<?php		
			
					the_post_thumbnail('post-thumbnail', array( 'alt' => esc_attr(get_the_title())));		
			
				?>		
			
			</a>		
		</div>		
			
			
			
		<?php endif; // End is_singular()		
			
	}		
			
	endif;		
			
/**
 * Clean up the_excerpt()
 */
function foody_excerpt_length($length) {
 
	if ( is_admin() ) {
        return $length;
    }else{
		return 50;
	}
	
}		

function foody_excerpt_more($more) {
 
	return '<a class="foody-excerpt-btn" href="'.get_the_permalink().'" rel="nofollow">Read More...</a>';
}

add_filter('excerpt_length', 'foody_excerpt_length');

add_filter('excerpt_more', 'foody_excerpt_more');	


/*Add theme menu page*/
 
add_action('admin_menu', 'foody_menu');

function foody_menu() {
	
	$foody_page_title = __("Foody",'foody');
	
	$foody_menu_title = __("Foody",'foody');
	
	add_theme_page($foody_page_title, $foody_menu_title, 'edit_theme_options', 'foody-pro', 'foody_pro_page');
	
}

/*
**
** Premium Theme Feature Page
**
*/

function foody_pro_page(){
	
	if ( is_admin() ) {
		
		$importer_active=sanitize_text_field($_GET['active_class']);
		
		$importer_new = (isset($importer_active))?$importer_active:'';
		?>
		
		<div id="profile-page" class="wrap">
		
			<h2><?php _e( 'Foody', 'foody' ) ?></h2>
			
			<h2 class="nav-tab-wrapper woo-nav-tab-wrapper">
			
				<a class="nav-tab<?php  if($importer_new==1 || $importer_new==''){ echo esc_attr( " active" ); }?>" href="?page=foody-pro&amp;importer=demo-documentation&amp;active_class=1"><?php _e('Live Demo and Documentation','foody'); ?></a>
				
				<a class="nav-tab<?php  if($importer_new==2){ echo esc_attr( " active" ); }?>" href="?page=foody-pro&amp;importer=free-vs-pro&amp;active_class=2"><?php _e('Free Vs Pro','foody'); ?></a>
				
				<a class="nav-tab<?php  if($importer_new==3){ echo esc_attr( " active" ); }?>" href="?page=foody-pro&amp;importer=phoen-data-importer&amp;active_class=3"><?php _e('One Click Demo Import','foody'); ?></a>
			
			</h2>
					
		</div>
	
			<?php
		
		$coupon_importer=sanitize_text_field($_GET['importer']);
		
		$importer = (isset($coupon_importer))?$coupon_importer:'';
		 
		if($importer=='' || $importer == 'demo-documentation'){
			 
			 include_once( get_template_directory(). '/inc/admin/premium-screen/demo-documentation.php');
			 
		}elseif($importer == 'free-vs-pro' ){
			 
			include_once( get_template_directory(). '/inc/admin/premium-screen/index.php');
			 
		}elseif ($importer == 'phoen-data-importer' ) { ?>
		
			<div class="demo-import-tab-content info-tab-content">
				<?php if ( has_action( 'foody_phoen_importer_tab_main' ) ) {
				do_action( 'foody_phoen_importer_tab_main' );
			} else { ?>
				<div id="plugin-filter" class="demo-import-boxed">
					<?php
				   $plugin_name = 'theme-data-importor-by-phoeniixx';
					$status = is_dir( WP_PLUGIN_DIR . '/' . $plugin_name );
					$button_class = 'install-now button';
					$button_txt = esc_html__( 'Install Now', 'foody' );
					if ( ! $status ) {
						$install_url = wp_nonce_url(
							add_query_arg(
								array(
									'action' => 'install-plugin',
									'plugin' => $plugin_name
								),
								network_admin_url( 'update.php' )
							),
							'install-plugin_'.$plugin_name
						);

					} else {
						$install_url = add_query_arg(array(
							'action' => 'activate',
							'plugin' => rawurlencode( $plugin_name . '/main.php' ),
							'plugin_status' => 'all',
							'paged' => '1',
							'_wpnonce' => wp_create_nonce('activate-plugin_' . $plugin_name . '/main.php'),
						), network_admin_url('plugins.php'));
						$button_class = 'activate-now button-primary';
						$button_txt = esc_html__( 'Active Now', 'foody' );
					}

					$detail_link = add_query_arg(
						array(
							'importer' => 'plugin-information',
							'plugin' => $plugin_name,
							'TB_iframe' => 'true',
							'width' => '772',
							'height' => '349',

						),
						network_admin_url( 'plugin-install.php' )
					);

					echo '<p>';
					printf( esc_html__(
						'%1$s you will need to install and activate the %2$s plugin first.', 'foody' ),
						'<b>'.esc_html__( 'Hey.', 'foody' ).'</b>',
						'<a class="thickbox open-plugin-details-modal" href="'.esc_url( $detail_link ).'">'.esc_html__( 'One Click Demo Importer By Phoeniixx', 'foody' ).'</a>'
					);
					echo '</p>';

					echo '<p class="plugin-card-'.esc_attr( $plugin_name ).'"><a href="'.esc_url( $install_url ).'" data-slug="'.esc_attr( $plugin_name ).'" class="'.esc_attr( $button_class ).'">'.$button_txt.'</a></p>';

					?>
				</div>
			<?php } ?>
		</div>
		<?php 
		} 
		
	} 
	
} 

/* Include Premium Button Class File*/

require_once( trailingslashit( get_template_directory() ) . 'trt-customize-pro/premium/class-customize.php' );

/**
 * Implement the TGM 
 */
require get_template_directory() . '/inc/libs/execute-libs.php';

/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Custom functions that act independently of the theme templates.
 */
require get_template_directory() . '/inc/extras.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';


require get_template_directory(). '/inc/phoen_dashboard.php';
/**
 * Load Jetpack compatibility file.
 */
require get_template_directory() . '/inc/jetpack.php';