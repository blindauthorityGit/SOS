<?php 
add_action( 'load-themes.php',  'foody_activation_admin_notice_main' );

function foody_admin_import_notice(){
    ?>
    <div class="updated notice notice-success notice-alt is-dismissible">
        <p><?php printf( esc_html__( 'Save time by import our demo data, your website will be set up and ready to customize in minutes. %s', 'foody' ), '<a class="button button-secondary" href="'.esc_url( add_query_arg( array( 'page' => 'foody-pro&importer=phoen-data-importer&amp;active_class=3' ), admin_url( 'themes.php' ) ) ).'">'.esc_html__( 'Import Demo Data', 'foody' ).'</a>'  ); ?></p>
    </div>
    <?php
}

function foody_activation_admin_notice_main(){
    global $pagenow;
    if ( is_admin() && ('themes.php' == $pagenow) && isset( $_GET['activated'] ) ) {
		
        add_action( 'admin_notices', 'foody_admin_import_notice' );
    }
}