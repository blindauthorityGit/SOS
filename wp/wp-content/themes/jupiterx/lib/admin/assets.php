<?php
/**
 * Manage admin assets.
 *
 * @package JupiterX\Framework\Admin
 *
 * @since 1.3.0
 */

jupiterx_add_smart_action( 'admin_enqueue_scripts', 'jupiterx_enqueue_admin_scripts' );
/**
 * Enqueue admin scripts.
 *
 * @since 1.3.0
 */
function jupiterx_enqueue_admin_scripts() {
	wp_enqueue_style( 'jupiterx-admin-icons', JUPITERX_ASSETS_URL . 'dist/css/icons-admin.css', [], JUPITERX_VERSION );
	wp_enqueue_style( 'jupiterx-common', JUPITERX_ASSETS_URL . 'dist/css/common' . JUPITERX_MIN_CSS . '.css', [], JUPITERX_VERSION );

	if ( jupiterx_is_screen( 'widgets' ) ) {
		wp_enqueue_script( 'wp-color-picker-alpha', JUPITERX_ASSETS_URL . 'dist/js/wp-color-picker-alpha' . JUPITERX_MIN_JS . '.js', [ 'wp-color-picker' ], JUPITERX_VERSION, true );
		wp_enqueue_script( 'jupiterx-modal', JUPITERX_ASSETS_URL . 'dist/js/jupiterx-modal' . JUPITERX_MIN_JS . '.js', [], JUPITERX_VERSION, true );
		wp_enqueue_script( 'jupiterx-gsap', JUPITERX_CONTROL_PANEL_ASSETS_URL . 'lib/gsap/gsap' . JUPITERX_MIN_JS . '.js', [], '1.19.1', true );
		wp_enqueue_style( 'jupiterx-modal', JUPITERX_ASSETS_URL . 'dist/css/jupiterx-modal' . JUPITERX_MIN_CSS . '.css', [], JUPITERX_VERSION );
	}

	wp_enqueue_script( 'jupiterx-common', JUPITERX_ASSETS_URL . 'dist/js/common' . JUPITERX_MIN_JS . '.js', [ 'jquery', 'wp-util', 'updates' ], JUPITERX_VERSION, true );
	wp_localize_script(
		'jupiterx-common',
		'jupiterxUtils',
		[
			'proBadge'    => jupiterx_get_pro_badge(),
			'proBadgeUrl' => jupiterx_get_pro_badge_url(),
			'helpLinks'   => jupiterx_is_help_links(),
		]
	);
	wp_localize_script(
		'jupiterx-common',
		'jupiterx_admin_textdomain',
		[
			'add_custom_sidebar_modal_title' => __( 'Add New Custom Sidebar', 'jupiterx' ),
			'add_custom_sidebar'             => __( 'Add Custom Sidebar', 'jupiterx' ),
			'delete_custom_sidebar'          => __( 'Delete Custom Sidebar', 'jupiterx' ),
			'deleting'                       => __( 'Deleting', 'jupiterx' ),
		]
	);
	wp_add_inline_script( 'jupiterx-common', 'var jupiterxPremium = true;', 'before' );
	wp_add_inline_script( 'jupiterx-common', 'var jupiterXControlPanelURL = "' . esc_url( admin_url( 'admin.php?page=jupiterx' ) ) . '";', 'before' );

	if ( jupiterx_is_callable( 'JupiterX_Pro' ) && method_exists( 'JupiterX_Pro', 'plugin_name' ) ) {
		wp_add_inline_script( 'jupiterx-common', '
			( function() {
				if ( typeof jupiterx === \'object\' && typeof jupiterx.uninstallPro !== \'undefined\' ) {
					jupiterx.uninstallPro();
				}
			} )( );
		', 'after' );
	}
}

jupiterx_add_smart_action( 'admin_print_footer_scripts', 'jupiterx_print_admin_templates' );
jupiterx_add_smart_action( 'jupiterx_print_templates', 'jupiterx_print_admin_templates' );
/**
 * Print admin JS templates.
 *
 * @since 1.3.0
 */
function jupiterx_print_admin_templates() {
	?>
	<?php
	?>
	<script type="text/html" id="tmpl-jupiterx-upgrade">
		<div class="jupiterx-upgrade">
			<div class="jupiterx-upgrade-step jupiterx-upgrade-buy active">
				<div class="jupiterx-upgrade-count">
					<span class="jupiterx-upgrade-num">1</span>
				</div>
				<div class="jupiterx-upgrade-content">
					<div class="jupiterx-upgrade-title">
						<?php esc_html_e( 'Get a Jupiter X license', 'jupiterx' ); ?>
						<div class="jupiterx-upgrade-help-buy">
							<a target="_blank" href="https://help.artbees.net/getting-started/upgrading-to-pro">
								<i class="jupiterx-icon-question-circle"></i>
								<?php esc_html_e( 'Help', 'jupiterx' ); ?>
							</a>
						</div>
					</div>
					<a href="{{ data.url || 'https://themeforest.net/item/jupiter-multipurpose-responsive-theme/5177775?ref=artbees&utm_medium=AdminUpgradePopup&utm_campaign=FreeJupiterXAdminUpgradeCampaign' }}" target="_blank" class="jupiterx-upgrade-buy-pro btn btn-primary"><?php esc_html_e( 'Buy Jupiter X Pro', 'jupiterx' ); ?></a>
				</div>
			</div>
			<div class="jupiterx-upgrade-step jupiterx-upgrade-activate-key">
				<div class="jupiterx-upgrade-count">
					<span class="jupiterx-upgrade-num">2</span>
				</div>
				<div class="jupiterx-upgrade-content">
					<div class="jupiterx-upgrade-title"><?php esc_html_e( 'Activate PRO version', 'jupiterx' ); ?></div>
					<div class="form-inline jupiterx-upgrade-api-field">
						<input type="text" class="jupiterx-form-control jupiterx-upgrade-api-key" placeholder="<?php esc_html_e( 'Enter your API key', 'jupiterx' ); ?>">
						<a class="jupiterx-upgrade-help-icon" href="https://help.artbees.net/getting-started/theme-registration/getting-an-api-key" target="_blank">
							<i class="jupiterx-icon-question-circle"></i>
							<span class="screen-reader-text"><?php esc_html_e( 'Getting an API key', 'jupiterx' ); ?></span>
						</a>
					</div>
					<button type="submit" class="btn btn-primary jupiterx-upgrade-activate"><?php esc_html_e( 'Activate Product', 'jupiterx' ); ?></button>
				</div>
			</div>
			<div class="jupiterx-upgrade-step jupiterx-upgrade-install-plugin">
				<div class="jupiterx-upgrade-count">
					<span class="jupiterx-upgrade-num">3</span>
				</div>
				<div class="jupiterx-upgrade-content">
					<div class="jupiterx-upgrade-title"><?php esc_html_e( 'Install Jupiter X Pro plugin', 'jupiterx' ); ?></div>
					<div class="jupiterx-upgrade-install-progress"></div>
				</div>
			</div>
		</div>
	</script>
	<script type="text/html" id="tmpl-jupiterx-activate">
		<div class="jupiterx-upgrade-step jupiterx-upgrade-activate-key active">
			<div class="jupiterx-upgrade-content">
				<div class="form-inline jupiterx-upgrade-api-field">
					<input type="text" class="jupiterx-form-control jupiterx-upgrade-api-key" placeholder="<?php esc_html_e( 'Enter your API key', 'jupiterx' ); ?>">
					<a class="jupiterx-upgrade-help-icon" href="https://help.artbees.net/getting-started/theme-registration/getting-an-api-key" target="_blank">
						<i class="jupiterx-icon-question-circle"></i>
						<span class="screen-reader-text"><?php esc_html_e( 'Getting an API key', 'jupiterx' ); ?></span>
					</a>
				</div>
				<button type="submit" class="btn btn-primary jupiterx-upgrade-activate"><?php esc_html_e( 'Activate Product', 'jupiterx' ); ?></button>
			</div>
		</div>
	</script>
	<?php
	?>
	<script type="text/html" id="tmpl-jupiterx-progress-bar">
		<div class="progress">
			<div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 20%"></div>
		</div>
	</script>
	<?php
	?>
	<script type="text/html" id="tmpl-jupiterx-cp-registration">
		<div class="jupiterx-upgrade-step jupiterx-upgrade-activate-key active">
			<div class="jupiterx-upgrade-content">
				<div class="form-inline jupiterx-upgrade-api-field">
					<input type="text" class="jupiterx-form-control jupiterx-purchase-code-mode-element d-block jupiterx-upgrade-email" id="jupiterx-cp-register-email" placeholder="<?php esc_html_e( 'Email Address', 'jupiterx' ); ?>">
					<a class="jupiterx-tooltip jupiterx-purchase-code-mode-element" data-content="<?php esc_attr_e( 'This address will be used to provide you technical support.', 'jupiterx' ); ?>" href="#" data-toggle="popover" data-trigger="focus" data-placement="top"></a>

					<input type="text" class="jupiterx-form-control jupiterx-purchase-code-mode-element d-block jupiterx-upgrade-api-key" id="jupiterx-cp-register-purchase-code-input" placeholder="<?php esc_html_e( 'Envato purchase code', 'jupiterx' ); ?>">
					<a class="jupiterx-tooltip jupiterx-purchase-code-mode-element" data-content="<?php esc_attr_e( "Please check <a href='https://help.artbees.net/getting-started/theme-registration/finding-the-purchase-code' target='_blank'>this</a> to learn how to find your purchase code.", 'jupiterx' ); ?>" href="#" data-toggle="popover" data-trigger="focus" data-placement="top"></a>

					<input type="text" class="jupiterx-form-control jupiterx-api-mode-element d-none jupiterx-upgrade-api-key" id="jupiterx-cp-register-api-input" placeholder="<?php esc_html_e( 'Artbees API key', 'jupiterx' ); ?>">
					<a class="jupiterx-tooltip jupiterx-api-mode-element d-none" data-content="<?php esc_attr_e( "Please check <a href='https://themes.artbees.net/docs/getting-an-api-key/' target='_blank'>this</a> to learn how to find your API key.", 'jupiterx' ); ?>" href="#" data-toggle="popover" data-trigger="focus" data-placement="top"></a>

					<a href="#" class="jupiterx-upgrade-activate" id="jupiterx-api-key-switch"><?php esc_html_e( 'Or insert API key', 'jupiterx' ); ?></a>
					<span id="jupiterx-cp-mailing-list-option-wrapper" class="jupiterx-purchase-code-mode-element d-flex">
						<input type="checkbox" class="jupiterx-form-control" id="jupiterx-cp-register-mailing-list">
						<label for="jupiterx-cp-register-mailing-list">
							<span><?php esc_html_e( 'I’d like to subscribe to Artbees Themes newsletter to get product updates & news, early access, weekly digests and more.', 'jupiterx' ); ?></span>
						</label>
					</span>
					<span id="jupiterx-cp-gdpr-option-wrapper" class="jupiterx-purchase-code-mode-element d-flex">
						<input type="checkbox" class="jupiterx-form-control" id="jupiterx-cp-register-gdpr">
						<label for="jupiterx-cp-register-gdpr">
							<span>
								<?php printf( 'I consent to Artbees Themes collecting my personal information according to its <a href="%s" target="_blank">%s</a> and <a href="%s" target="_blank">%s</a>', 'https://themes.artbees.net/privacy-policy/', esc_html__( 'Privacy policy', 'jupiterx' ), 'https://themes.artbees.net/terms-of-use', esc_html__( 'Terms of use', 'jupiterx' ) ); ?>
							</span>
						</label>

					</span>
					<?php wp_nonce_field( 'license_manager', 'license-manager-nonce' ); ?>
				</div>

			</div>
		</div>
	</script>
	<?php
	?>
	<?php
}

add_action( 'admin_init', 'jupiterx_admin_scripts' );
/**
 * Register admin scripts.
 *
 * @since 1.11.0
 */
function jupiterx_admin_scripts() {
	wp_register_style( 'jupiterx-templates', JUPITERX_ASSETS_URL . 'dist/css/templates' . JUPITERX_MIN_CSS . '.css', [ 'jupiterx-modal' ], JUPITERX_VERSION );
	wp_register_script( 'jupiterx-templates', JUPITERX_ASSETS_URL . 'dist/js/templates' . JUPITERX_MIN_JS . '.js', [ 'jquery', 'underscore', 'jupiterx-modal' ], JUPITERX_VERSION, true );
	wp_localize_script( 'jupiterx-templates', 'jupiterxTemplates', [
		'siteUrl'           => home_url(),
		'adminAjaxUrl'      => admin_url( 'admin-ajax.php' ),
		'proBadgeUrl'       => jupiterx_get_pro_badge_url(),
		'isPremium'         => jupiterx_is_premium(),
		'upgradeLink'       => esc_url( jupiterx_upgrade_link( 'templates' ) ),
		'template'          => jupiterx_get_option( 'template_installed_id', null ),
		'api'               => 'https://themes.artbees.net/wp-json/templates/v1',
		'i18n'              => [
			'all'                   => __( 'All', 'jupiterx' ),
			'empty'                 => __( 'No template found.', 'jupiterx' ),
			'emptyInfo'             => __( 'Clear some filters and try again.', 'jupiterx' ),
			'loadMore'              => __( 'Load More', 'jupiterx' ),
			'import'                => __( 'Import', 'jupiterx' ),
			'preview'               => __( 'Preview', 'jupiterx' ),
			'confirm'               => __( 'Confirm', 'jupiterx' ),
			'cancel'                => __( 'Cancel', 'jupiterx' ),
			'discard'               => __( 'Discard', 'jupiterx' ),
			'install'               => __( 'Install', 'jupiterx' ),
			'yes'                   => __( 'Yes', 'jupiterx' ),
			'askContinue'           => __( 'Are you sure to continue?', 'jupiterx' ),
			'installTitle'          => __( 'Important Notice', 'jupiterx' ),
			'installText'           => __( 'You are about to install <strong>{template}</strong> template. Installing a new template will remove all current data on your website. Are you sure you want to proceed?', 'jupiterx' ),
			'mediaTitle'            => __( 'Include Images and Videos?', 'jupiterx' ),
			'mediaText'             => sprintf(
				/* translators: Learn more URL */
				__( 'Would you like to import images and videos as preview? <br> Notice that all images are <strong>strictly copyrighted</strong> and you need to acquire the license in case you want to use them on your project. <a href="%s" target="_blank">Learn More</a>', 'jupiterx' ),
				'https://help.artbees.net/getting-started/installing-a-template'
			),
			'mediaConfirm'          => __( 'Do not include', 'jupiterx' ),
			'mediaCancel'           => __( 'Include', 'jupiterx' ),
			'progressTitle'         => __( 'Installing in progress...', 'jupiterx' ),
			'progressBackup'        => __( 'Backup database', 'jupiterx' ),
			'progressPackage'       => __( 'Downloading package', 'jupiterx' ),
			'progressPlugins'       => __( 'Installing required plugins...', 'jupiterx' ),
			'progressInstall'       => __( 'Installing in progress...', 'jupiterx' ),
			'completedTitle'        => __( 'All Done!', 'jupiterx' ),
			'completedText'         => __( 'Template is successfully installed.', 'jupiterx' ),
			'errorTitle'            => __( 'Something went wrong!', 'jupiterx' ),
			'errorText'             => __( 'There is an error while installing the template, please contact support.', 'jupiterx' ),
			'customTitle'           => __( 'Choose how you want to import this template:', 'jupiterx' ),
			'customMediaText'       => __( 'Include media (Copyrighted).', 'jupiterx' ),
			'completeImportTitle'   => __( 'Full import ', 'jupiterx' ),
			'completeImportText'    => __( 'Your current content, settings, widgets, etc. will be removed and the database will be reset. New page contents and settings will be replaced.', 'jupiterx' ),
			'completeImportWarning' => __( 'All your current content, settings, widgets, etc. will be removed and the new content will be replaced.', 'jupiterx' ),
			'partialImportTitle'    => __( 'Content import', 'jupiterx' ),
			'partialImportText'     => __( 'Keep your current content, settings, widgets, etc. Only the new page contents will be imported.', 'jupiterx' ),
		],
	] );
}
