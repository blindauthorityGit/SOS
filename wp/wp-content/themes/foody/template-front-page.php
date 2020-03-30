<?php

/*
Template Name: Homepage
*/

get_header();
	
?>

</div><!-- #content -->
</div>


<?php if(get_theme_mod("foody_home_banner_on_off") != '' && get_theme_mod("foody_home_banner_on_off") == 'on'): ?>
  
<div id="myCarousel" class="carousel slide" data-ride="carousel">
  <!-- Indicators -->
  <ol class="carousel-indicators">
    <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
    <li data-target="#myCarousel" data-slide-to="1"></li>
    <li data-target="#myCarousel" data-slide-to="2"></li>
  </ol>

  <!-- Wrapper for slides -->
  <div class="carousel-inner" role="listbox">
    <div class="item active">
	
		<?php if(get_theme_mod("bnr_img1") != ''): ?>
			
				<img src="<?php echo esc_url(get_theme_mod("bnr_img1"));?>" />
			
		<?php endif;?>
      
    </div> 
 
    <div class="item">
      <?php if(get_theme_mod("bnr_img2") != ''): ?>
			
				<img src="<?php echo esc_url(get_theme_mod("bnr_img2"));?>" />
			
		<?php endif;?>
    </div>

    <div class="item">
      <?php if(get_theme_mod("bnr_img3") != ''): ?>
			
				<img src="<?php echo esc_url(get_theme_mod("bnr_img3"));?>" />
			
		<?php endif;?>
    </div>

  </div>
</div>

<?php endif; ?>

<div class="container">
	<div class="foody-main-container">
		<?php if ( class_exists( 'WooCommerce' ) ) :?>
			<div class="foody-home-product"> 
				<h1 class="home_prodct_titl"><?php echo esc_html(get_theme_mod("recent_product_titl")); ?></h1>
				<?php echo do_shortcode ('[recent_products per_page="4" columns="4"]'); ?>
			</div>
			
			<div class="foody-home-product"> 
				<h1 class="home_prodct_titl"><?php echo esc_html(get_theme_mod("sale_product_titl")); ?></h1>
				<?php echo do_shortcode ('[sale_products per_page="4" columns="4"]'); ?>
			</div>
			
			<div class="foody-home-product"> 
				<h1 class="home_prodct_titl"><?php echo esc_html(get_theme_mod("best_selling_product_titl")); ?></h1>
				<?php echo do_shortcode ('[best_selling_products per_page="4" columns="4"]'); ?>
			</div>
		<?php endif; ?>
		
	</div>
</div>

<?php 
get_footer();
?>