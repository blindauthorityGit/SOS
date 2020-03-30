<?php
/**
 * Handles TGMPA functionalities.
 *
 * @since 1.5.0
 *
 * @package Jupiter\Framework\Admin\TGMPA
 */

add_action( 'tgmpa_register', 'jupiterx_register_tgmpa_plugins' );
/**
 * Register the required plugins.
 *
 * @since 1.5.0
 *
 * @SuppressWarnings(PHPMD.ElseExpression)
 */
function jupiterx_register_tgmpa_plugins() {
	if ( ! jupiterx_is_premium() ) :
		$free_plugins = [
			[
				'name' => __( 'Jupiter X Core', 'jupiterx' ),
				'slug' => 'jupiterx-core',
				'required' => false,
				'force_activation' => false,
				'force_deactivation' => false,
			],
			[
				'name' => __( 'Elementor', 'jupiterx' ),
				'slug' => 'elementor',
				'required' => false,
				'force_activation' => false,
				'force_deactivation' => false,
			],
			[
				'name' => __( 'Advanced Custom Fields', 'jupiterx' ),
				'slug' => 'advanced-custom-fields',
				'required' => false,
				'force_activation' => false,
				'force_deactivation' => false,
			],
			[
				'name' => __( 'Lazy Load', 'jupiterx' ),
				'slug' => 'lazy-load',
				'required' => false,
				'force_activation' => false,
				'force_deactivation' => false,
				'label_type' => __( 'Optional', 'jupiterx' ),
			],
			[
				'name' => __( 'Woocommerce', 'jupiterx' ),
				'slug' => 'woocommerce',
				'required' => false,
				'force_activation' => false,
				'force_deactivation' => false,
				'label_type' => __( 'Optional', 'jupiterx' ),
			],
			[
				'name' => __( 'Menu Icons by ThemeIsle', 'jupiterx' ),
				'slug' => 'menu-icons',
				'required' => false,
				'force_activation' => false,
				'force_deactivation' => false,
				'label_type' => __( 'Optional', 'jupiterx' ),
			],
		];

		$plugins = apply_filters( 'jupiterx_tgmpa_plugins', $free_plugins );
	else :
		$plugins = get_transient( 'jupiterx_tgmpa_plugins' );

		if ( false === $plugins && jupiterx_is_premium() ) {
			$response = json_decode( wp_remote_retrieve_body( wp_remote_get( 'https://themes.artbees.net/wp-json/plugins/v1/list?theme_name=jupiterx' ) ) );

			if ( ! is_array( $response ) ) {
				return;
			}

			$plugins = [];

			foreach ( $response as $index => $plugin ) {
				$plugins[ $index ] = (array) $plugin;

				if ( 'wp-repo' === $plugins[ $index ]['source'] ) {
					unset( $plugins[ $index ]['version'] );
					unset( $plugins[ $index ]['source'] );
				}

				if (
					! empty( $plugins[ $index ]['label_type'] ) &&
					'Optional' === $plugins[ $index ]['label_type']
				) {
					$plugins[ $index ]['label_type'] = __( 'Optional', 'jupiterx' );
				}
			}

			set_transient( 'jupiterx_tgmpa_plugins', $plugins, 12 * HOUR_IN_SECONDS );
		}
	endif;

	$config = [
		'id'           => 'jupiterx',
		'default_path' => '',
		'menu'         => 'tgmpa-install-plugins',
		'has_notices'  => true,
		'dismissable'  => true,
		'dismiss_msg'  => '',
		'is_automatic' => false,
		'message'      => '',
	];

	tgmpa( $plugins, $config );
}

add_filter( 'tgmpa_plugin_action_links', 'jupiterx_tgmpa_go_pro_link' );
add_filter( 'tgmpa_network_admin_plugin_action_links', 'jupiterx_tgmpa_go_pro_link' );
/**
 * Change go pro action links in TGMPA.
 *
 * @param array $action_links List of action links.
 *
 * @since 1.10.0
 *
 * @return array $action_links Modified list of action links.
 */
function jupiterx_tgmpa_go_pro_link( $action_links ) {
	if ( isset( $action_links['pro'] ) ) {
		$action_links['pro'] = '<a href="' . esc_url( jupiterx_upgrade_link( 'plugins' ) ) . '" class="jupiterx-tgmpa-pro-plugin-action-link" target="_blank">' . __( 'Go Pro', 'jupiterx' ) . '<span class="screen-reader-text">' . __( 'Buy Jupiter X', 'jupiterx' ) . '</span></a>';
	}

	return $action_links;
}
