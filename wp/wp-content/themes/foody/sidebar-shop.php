<div id="sidebar1" class="sidebar" role="complementary">
	
	<?php
	
	if ( is_shop() && current_user_can( 'publish_posts' ) ) :
 
		if ( is_active_sidebar( 'sidebar-shop' ) ) :

			dynamic_sidebar( 'sidebar-shop' );

		else : ?>
			
			<div class="alert alert-message">
			
				<p><?php esc_html_e("Please activate some Widgets","foody"); ?>.</p>
			
			</div>

		<?php 
		
		endif; 
	
	else :
		
		if ( is_active_sidebar( 'sidebar-shop' ) ) : ?>

			<?php dynamic_sidebar( 'sidebar-shop' );
		
		endif; 
	
	endif;
	?>

</div>