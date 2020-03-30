<?php
/**
 * The header for our theme.
 *
 * This is the template that displays all of the <head> section and everything up until <div id="content">
 *
 * @link https://developer.wordpress.org/themes/basics/template-files/#template-partials
 *
 * @package Foody
 */

?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php bloginfo( 'charset' ); ?>">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="profile" href="http://gmpg.org/xfn/11">
<link rel="pingback" href="<?php bloginfo( 'pingback_url' ); ?>">

<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>

<div class="custom-header">
	<div class="custom-header-media">
		<?php the_custom_header_markup(); ?>
	</div>
</div>

<div class="container mob-resltion">
<div id="page" class="site">
	<a class="skip-link screen-reader-text" href="#content"><?php esc_html_e( 'Skip to content', 'foody' ); ?></a>

	<header id="masthead" class="site-header" role="banner">
	
		<div class="site-branding">
			<?php
			
			foody_custom_logo();
			
			if ( is_front_page() && is_home() ) : ?>
				<h1 class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></h1>
			<?php else : ?>
				<p class="site-title"><a href="<?php echo esc_url( home_url( '/' ) ); ?>" rel="home"><?php bloginfo( 'name' ); ?></a></p>
			<?php
			endif;

			$description = get_bloginfo( 'description', 'display' );
			if ( $description || is_customize_preview() ) : ?>
				<p class="site-description"><?php echo $description; /* WPCS: xss ok. */ ?></p>
			<?php
			endif; ?>
		</div><!-- .site-branding -->
		<div class="navbar-container">
			<nav id="site-navigation" class="main-navigation" role="navigation">
				<button class="menu-toggle" aria-controls="primary-menu" aria-expanded="false">
					<span class="icon-bar"></span>		
					<span class="icon-bar"></span>		
					<span class="icon-bar"></span>
				</button>
				<?php wp_nav_menu( array( 'theme_location' => 'primary', 'menu_id' => 'primary-menu' , 'container_class'=> 'foody-nav') ); ?>
			</nav><!-- #site-navigation -->
			
			
			<div class="foody-header-icon">
				<ul class="foody-icon-list">
					<?php 
						
						if ( class_exists( 'WooCommerce' ) ) :?> 
						
							<li><a href="<?php echo esc_url( home_url( '/' ) ); ?>my-account/"><i class="fa fa-user" aria-hidden="true"></i></a></li>
					
							<li><a class="cart-contents" href="<?php echo esc_url(function_exists( 'wc_get_cart_url') ? wc_get_cart_url() : $woocommerce->cart->get_cart_url()); ?>" title="<?php esc_attr_e('View your shopping cart', 'foody'); ?>"><?php echo sprintf(_n('%d item', '%d items', WC()->cart->cart_contents_count, 'foody'), WC()->cart->cart_contents_count);?> <?php echo wp_kses_post(WC()->cart->get_cart_total()); ?></a></li>
							
							
							
					<?php endif; ?>
					<li><span class="foody-search-icon"><a href="javascript:void(0);"><i class="fa fa-search"></i></a></span></li>
				</ul>			
			</div>
			<div class="foody-search-form">
				<?php get_search_form(); ?>
			</div>
		</div>	 
	</header><!-- #masthead -->

</div> <!-- page end -->
</div> <!-- container end -->
	
	
	<div class="container-fluid coupons-bg">
		<div class="container coupons">
			<ul>
				<li><i class="fa fa-truck" aria-hidden="true"></i><?php echo esc_html(get_theme_mod("banner_top_content1"));?></li>
				<li><i class="fa fa-globe" aria-hidden="true"></i><?php echo esc_html(get_theme_mod("banner_top_content2"));?></li>
				<li><i class="fa fa-gift" aria-hidden="true"></i><?php echo esc_html(get_theme_mod("banner_top_content3"));?></li>
			</ul>
		</div>
	</div>
	
	<?php if(get_theme_mod("header_feature_img") != ''): ?>
	
			<img class="foody-banner-img" src="<?php echo esc_url(get_theme_mod("header_feature_img"));?>" />
			
	<?php endif;?>
	
<div class="container">
	<div id="content" class="site-content">