<?php
/**
 * The Jupiter Customizer component.
 *
 * @package JupiterX_Core\Customizer
 */

/**
 * Load Kirki library.
 *
 * @since 1.0.0
 */
function jupiterx_customizer_kirki() {
	jupiterx_core()->load_files( [ 'customizer/vendors/kirki/kirki' ] );
}

add_action( 'jupiterx_init', 'jupiterx_load_customizer_dependencies', 5 );
/**
 * Load Customzier.
 *
 * @since 1.9.0
 *
 * @return void
 */
function jupiterx_load_customizer_dependencies() {
	jupiterx_core()->load_files( [ 'customizer/api/customizer' ] );
	jupiterx_core()->load_files( [ 'customizer/api/init' ] );
}

if ( ! function_exists( 'jupiterx_core_customizer_include' ) ) {
	add_action( 'init', 'jupiterx_core_customizer_include', 15 );
	/**
	 * Include customizer setting file.
	 *
	 * With loading customizer on init, we have access to custom post types and custom taxonomies.
	 *
	 * @since 1.9.0
	 *
	 * @return void
	 */
	function jupiterx_core_customizer_include() {
		/**
		 * Hook after registering theme customizer settings.
		 *
		 * @since 1.3.0
		 */
		do_action( 'jupiterx_before_customizer_register' );

		/**
		 * Load customizer settings.
		 */
		require_once jupiterx_core()->plugin_dir() . 'includes/customizer/settings/settings.php';

		/**
		 * Hook after registering theme customizer settings.
		 *
		 * @since 1.3.0
		 */
		do_action( 'jupiterx_after_customizer_register' );
	}
}

/**
 * Ignore phpmd erros.
 *
 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
 * @SuppressWarnings(PHPMD.ExitExpression)
 */
if ( ! function_exists( 'jupiterx_core_customizer_preview_redirect' ) ) {
	add_action( 'template_redirect', 'jupiterx_core_customizer_preview_redirect' );
	/**
	 * Redircet to desired template while selecting a pop-up.
	 *
	 * @since 1.9.0
	 *
	 * @return void
	 */
	function jupiterx_core_customizer_preview_redirect() {
		if ( ! is_customize_preview() ) {
			return;
		}

		$section = jupiterx_get( 'jupiterx' );

		switch ( $section ) {
			case 'jupiterx_post_single':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'blog_single' );
				if ( ! is_singular( 'post' ) && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			case 'jupiterx_portfolio_single':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'portfolio_single' );
				if ( ! is_singular( 'portfolio' ) && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			case 'jupiterx_search':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'search' );
				if ( ! is_search() && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			case 'jupiterx_404':
				$template = get_theme_mod( 'jupiterx_404_template' );
				if ( ! empty( $template ) ) {
					wp_safe_redirect( get_permalink( intval( $template ) ) );
					exit;
				}

				global $wp_query;

				$wp_query->set_404();
				status_header( 404 );

				break;

			case 'jupiterx_maintenance':
				$template = get_theme_mod( 'jupiterx_maintenance_template' );
				if ( ! empty( $template ) ) {
					wp_safe_redirect( get_permalink( intval( $template ) ) );
					exit;
				}
				break;

			case 'jupiterx_blog_archive':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'blog_archive' );
				if ( ! is_post_type_archive( 'post' ) && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			case 'jupiterx_portfolio_archive':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'portfolio_archive' );
				if ( $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			case 'jupiterx_checkout_cart':
				if ( class_exists( 'WooCommerce' ) ) {
					$url = get_permalink( wc_get_page_id( 'cart' ) );
					if ( ! is_cart() && ! is_checkout() && $url ) {
						wp_safe_redirect( $url );
						exit;
					}
				}
				break;

			case 'jupiterx_product_archive':
				if ( class_exists( 'WooCommerce' ) ) {
					$url = JupiterX_Customizer_Utils::get_preview_url( 'product_archive' );
					if ( ! is_product_category() && $url ) {
						wp_safe_redirect( $url );
						exit;
					}
				}
				break;

			case 'jupiterx_product_page':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'product_single' );
				if ( ! is_singular( 'product' ) && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			case 'jupiterx_product_list':
				if ( class_exists( 'WooCommerce' ) ) {
					$url = get_permalink( wc_get_page_id( 'shop' ) );
					if ( ! is_shop() && $url ) {
						wp_safe_redirect( $url );
						exit;
					}
				}
				break;

			case 'jupiterx_page_single':
				$url = JupiterX_Customizer_Utils::get_preview_url( 'single_page' );
				if ( ! is_singular( 'page' ) && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;

			default:
				$post_type = jupiterx_get( 'post_type' );

				if ( $post_type && jupiterx_get( 'single' ) ) {
					$url = JupiterX_Customizer_Utils::get_permalink( JupiterX_Customizer_Utils::get_random_post( $post_type ) );
				} elseif ( $post_type && jupiterx_get( 'archive' ) ) {
					$url = get_post_type_archive_link( $post_type );
				}

				if ( isset( $url ) && $url ) {
					wp_safe_redirect( $url );
					exit;
				}
				break;
		}
	}
}

if ( ! function_exists( 'jupiterx_core_maintenance_page_redirect' ) ) {
	add_action( 'template_redirect', 'jupiterx_core_maintenance_page_redirect' );
	/**
	 * Redirect maintenance pages to specific page template.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 *
	 * @SuppressWarnings(PHPMD.ExitExpression)
	 */
	function jupiterx_core_maintenance_page_redirect() {
		// Current viewing page ID.
		$post_id = get_queried_object_id();

		// Is maintenance enabled?
		$is_enabled = get_theme_mod( 'jupiterx_maintenance', false );

		// The page where redirect ended up.
		$page_template = intval( get_theme_mod( 'jupiterx_maintenance_template' ) );

		// Disable when logged in or viewing the current template.
		if ( is_user_logged_in() || $page_template === $post_id ) {
			return;
		}

		// Maintenance is enabled, page template is not empty and the page status is published.
		if ( $is_enabled && ! empty( $page_template ) && 'publish' === get_post_status( $page_template ) ) {
			wp_safe_redirect( get_permalink( $page_template ) );
			exit;
		}
	}
}

if ( ! function_exists( 'jupiterx_core_404_page_redirect' ) ) {
	add_action( 'template_redirect', 'jupiterx_core_404_page_redirect' );
	/**
	 * Redirect 404 pages to specific page template.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 *
	 * @SuppressWarnings(PHPMD.ExitExpression)
	 */
	function jupiterx_core_404_page_redirect() {
		// The page where redirect ended up.
		$page_template = intval( get_theme_mod( 'jupiterx_404_template' ) );

		// Legitimate non existing page, page template is not empty and the page status must be published.
		if ( is_404() && ! empty( $page_template ) && 'publish' === get_post_status( $page_template ) ) {
			wp_safe_redirect( get_permalink( $page_template ), 301 );
		} elseif ( ! empty( $page_template ) && get_the_ID() === $page_template ) {
			status_header( 404 );
		}
	}
}
