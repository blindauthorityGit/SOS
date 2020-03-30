<?php
if ( ! JUPITERX_CONTROL_PANEL_PLUGINS ) {
	return;
}

$menu_items_access = get_site_option( 'menu_items' );

if ( is_multisite() && ! isset( $menu_items_access['plugins'] ) && ! current_user_can( 'manage_network_plugins' ) ) : ?>
	<div class="jupiterx-cp-pane-box" id="jupiterx-no-plugins">
		<div class="alert alert-warning" role="alert">
			<?php esc_html_e( 'Now you are using a sub site which it\'s plugin functionalities are disabled by Network admin.', 'jupiterx' ); ?>
			<?php esc_html_e( 'To have a full control over plugins, please go to My Sites > Network Admin > Settings and check Plugins option of "Enable administration menus" option. If you don\'t have access to the mentioned page, please contact Network Admin.', 'jupiterx' ); ?>
		</div>
	</div>
<?php
	return;
endif;

$invalid = validate_active_plugins();

if ( ! empty( $invalid ) ) {
	foreach ( $invalid as $plugin_file => $error ) {
		echo '<div id="message" class="error"><p>';
		printf(
			/* translators: 1: plugin file, 2: error message */
			__( 'The plugin %1$s has been <strong>deactivated</strong> due to an error: %2$s', 'jupiterx' ),
			'<code>' . esc_html( $plugin_file ) . '</code>',
			$error->get_error_message()
		);
		echo '</p></div>';
	}
}
?>
<div class="jupiterx-cp-pane-box" id="jupiterx-cp-plugins">
	<div class="jupiterx-cp-plugins-list">
		<div class="jupiterx-cp-plugins-header d-flex">
			<h3 class="mb-0">
				<?php esc_html_e( 'Plugins', 'jupiterx' ); ?>
				<?php jupiterx_the_help_link( 'http://help.artbees.net/getting-started/plugins/installing-the-bundled-plugins', __( 'Installing the Bundled Plugins.', 'jupiterx' ) ); ?>
			</h3>
			<div class="btn-group jupiterx-cp-plugins-filter disabled" role="group">
				<button type="button" class="btn btn-secondary" data-filter="all" disabled><?php esc_html_e( 'All', 'jupiterx' ); ?></button>
				<button type="button" class="btn btn-outline-secondary" data-filter="active" disabled><?php esc_html_e( 'Active', 'jupiterx' ); ?></button>
				<button type="button" class="btn btn-outline-secondary" data-filter="inactive" disabled><?php esc_html_e( 'Inactive', 'jupiterx' ); ?></button>
			</div>
		</div>
		<div id="js__jupiterx-plugins" class="d-flex">
			<svg class="jupiterx-spinner" width="50px" height="50px" viewBox="0 0 66 66" xmlns="http://www.w3.org/2000/svg">
				<circle class="jupiterx-spinner-path" fill="none" stroke-width="6" stroke-linecap="round" cx="33" cy="33" r="30"></circle>
			</svg>
		</div>
	</div>
</div>
