<?php
/**
 * White labeling class.
 *
 * @package JupiterX_Core\Framework\Control_Panel\White_Label
 *
 * @since 1.11.0
 */

if ( ! class_exists( 'JupiterX_Control_Panel_White_Label' ) ) {
	/**
	 * Settings.
	 *
	 * @since 1.11.0
	 */
	class JupiterX_Control_Panel_White_Label {

		/**
		 * Constructor.
		 *
		 * @since 1.11.0
		 */
		public function __construct() {
			add_action( 'admin_head', [ $this, 'inline_css' ] );
			add_filter( 'jupiterx_control_panel_sections', [ $this, 'enabled_pages' ], 999 );
			add_action( 'jupiterx_control_panel_settings_white_label', [ $this, 'settings_html' ] );
		}

		/**
		 * Inline styles for control panel page.
		 *
		 * @since 1.11.0
		 */
		public function inline_css() {
			if ( jupiterx_is_white_label() && jupiterx_get_option( 'white_label_cpanel_logo' ) ) {
				?>
				<style type="text/css">
					.jupiterx-cp-jupiterx-logo {
						height: 55px;
						margin-top: 0;
						background: url(<?php echo esc_url( jupiterx_get_option( 'white_label_cpanel_logo' ) ); ?>) no-repeat center center;
						background-size: 100%;
					}
				</style>
				<?php
			}
		}

		/**
		 * Set enabled pages in control panel.
		 *
		 * @since 1.11.0
		 *
		 * @param array $sections Control panel sections.
		 */
		public function enabled_pages( $sections ) {
			if ( ! jupiterx_is_white_label() ) {
				return $sections;
			}

			$enabled_pages = jupiterx_get_option( 'white_label_cpanel_pages', [] );

			if ( empty( $enabled_pages ) ) {
				$enabled_pages = [];
			}

			// Always show settings page.
			array_push( $enabled_pages, 'settings' );

			$sections = array_intersect_key( $sections, array_flip( $enabled_pages ) );

			return $sections;
		}

		/**
		 * Render white label settings on control panel.
		 *
		 * @since 1.11.0
		 * @SuppressWarnings(PHPMD.NPathComplexity)
		 */
		public function settings_html() {
			?>
			<div class="col-md-12"><hr></div>
			<div class="form-group col-md-12">
				<label for="jupiterx-cp-settings-white-label"><?php esc_html_e( 'White Label', 'jupiterx-core' ); ?></label>
				<input type="hidden" name="jupiterx_white_label" value="0">
				<div class="jupiterx-switch">
					<input type="checkbox" id="jupiterx-cp-settings-white-label-mode" name="jupiterx_white_label" value="1" <?php checked( jupiterx_get_option( 'white_label' ), true ); ?>>
					<label for="jupiterx-cp-settings-white-label-mode"></label>
				</div>
			</div>
			<div class="form-group col-md-6 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<label class="m-0"><?php esc_html_e( 'Control Panel Pages', 'jupiterx-core' ); ?></label>
				<small class="form-text text-muted mb-2"><?php esc_html_e( 'Enable or disable control panel pages.', 'jupiterx-core' ); ?></small>
				<input type="hidden" name="jupiterx_white_label_cpanel_pages" value="">
				<?php
				$pages = [
					'home'          => esc_html__( 'Home', 'jupiterx-core' ),
					'plugins'       => esc_html__( 'Plugins', 'jupiterx-core' ),
					'templates'     => esc_html__( 'Templates', 'jupiterx-core' ),
					'image_size'    => esc_html__( 'Image Sizes', 'jupiterx-core' ),
					'system_status' => esc_html__( 'System Status', 'jupiterx-core' ),
					'updates'       => esc_html__( 'Updates', 'jupiterx-core' ),
				];

				$enabled_pages = jupiterx_get_option( 'white_label_cpanel_pages', array_keys( $pages ) );

				if ( empty( $enabled_pages ) ) {
					$enabled_pages = [];
				}

				foreach ( $pages as $page_id => $page_name ) :
					echo '<div class="custom-control custom-checkbox">';
					echo '<input type="checkbox" class="custom-control-input" name="jupiterx_white_label_cpanel_pages[]" ' . ( ( in_array( $page_id, $enabled_pages, true ) ) ? 'checked="checked"' : '' ) . ' value="' . esc_attr( $page_id ) . '" id="jupiterx_white_label_cpanel_pages_' . esc_attr( $page_id ) . '">';
					echo '<label class="custom-control-label" for="jupiterx_white_label_cpanel_pages_' . esc_attr( $page_id ) . '">' . $page_name . '</label>'; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
					echo '</div>';
				endforeach;
				?>
			</div>
			<div class="form-group col-md-6 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<label for="jupiterx-white-label-cpanel-logo"><?php esc_html_e( 'Control Panel Logo', 'jupiterx-core' ); ?></label>
				<div class="input-group jupiterx-image-uploader <?php echo jupiterx_get_option( 'white_label_cpanel_logo' ) ? 'has-image' : ''; ?>">
					<input class="jupiterx-form-control" value="<?php echo esc_attr( jupiterx_get_option( 'white_label_cpanel_logo' ) ); ?>" name="jupiterx_white_label_cpanel_logo" placeholder="<?php esc_html_e( 'Select an image', 'jupiterx-core' ); ?>" type="text" />
					<div class="input-group-append">
						<a class="btn btn-danger remove-button" href="#"><?php esc_html_e( 'Remove', 'jupiterx-core' ); ?></a>
						<a class="btn btn-secondary upload-button" href="#"><?php esc_html_e( 'Upload', 'jupiterx-core' ); ?></a>
					</div>
				</div>
				<small class="form-text text-muted mb-2"><?php esc_html_e( 'Change control panel logo.', 'jupiterx-core' ); ?></small>
			</div>
			<div class="form-group col-md-6 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<label for="jupiterx-cp-settings-white-label-text-occurence"><?php esc_html_e( 'Text Occurence', 'jupiterx-core' ); ?></label>
				<input type="text" class="jupiterx-form-control" id="jupiterx-cp-settings-white-label-text-occurence" value="<?php echo esc_attr( jupiterx_get_option( 'white_label_text_occurence' ) ); ?>" name="jupiterx_white_label_text_occurence">
				<small class="form-text text-muted mb-2"><?php esc_html_e( 'Replace \'Jupiter X\' text to the entire admin pages.', 'jupiterx-core' ); ?></small>
			</div>
			<div class="form-group col-md-6 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<label for="jupiterx-cp-settings-white-label-menu-icon"><?php esc_html_e( 'Menu Icon', 'jupiterx-core' ); ?></label>
				<input type="text" class="jupiterx-form-control" id="jupiterx-cp-settings-white-label-menu-icon" value="<?php echo esc_attr( jupiterx_get_option( 'white_label_menu_icon' ) ); ?>" name="jupiterx_white_label_menu_icon" placeholder="dashicons-admin-generic">
				<small class="form-text text-muted mb-2">
					<?php
					printf(
						// translators: 1: Choose icon link.
						esc_html__( '%1$s an icon and paste the class name.', 'jupiterx-core' ),
						'<a href="https://developer.wordpress.org/resource/dashicons" target="_blank">' . esc_html__( 'Choose', 'jupiterx-core' ) . '</a>'
					);
					?>
				</small>
			</div>
			<div class="form-group col-md-6 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<label for="jupiterx-cp-settings-white-label-help-links"><?php esc_html_e( 'Help Links', 'jupiterx-core' ); ?></label>
				<input type="hidden" name="jupiterx_white_label_help_links" value="0">
				<div class="jupiterx-switch">
					<input type="checkbox" id="jupiterx-cp-settings-white-label-help-links" name="jupiterx_white_label_help_links" value="1" <?php checked( jupiterx_get_option( 'white_label_help_links', true ), true ); ?>>
					<label for="jupiterx-cp-settings-white-label-help-links"></label>
				</div>
				<small class="form-text text-muted mb-2"><?php esc_html_e( 'Enable help links from control panel, customizer and meta options.', 'jupiterx-core' ); ?></small>
			</div>
			<div class="form-group col-md-6 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<label for="jupiterx-cp-settings-white-label-menu-help"><?php esc_html_e( 'Menu Help', 'jupiterx-core' ); ?></label>
				<input type="hidden" name="jupiterx_white_label_menu_help" value="0">
				<div class="jupiterx-switch">
					<input type="checkbox" id="jupiterx-cp-settings-white-label-menu-help" name="jupiterx_white_label_menu_help" value="1" <?php checked( jupiterx_get_option( 'white_label_menu_help', true ), true ); ?>>
					<label for="jupiterx-cp-settings-white-label-menu-help"></label>
				</div>
				<small class="form-text text-muted mb-2"><?php esc_html_e( 'Enable help link from menu.', 'jupiterx-core' ); ?></small>
			</div>
			<div class="form-group col-md-12 <?php echo ! jupiterx_get_option( 'white_label' ) ? 'hidden' : ''; ?>" data-for="jupiterx_white_label">
				<div class="alert alert-info"><?php esc_html_e( 'For further customization on theme name, slug, thumbnail and description that appears in Appearance > Themes, please create a basic child theme.', 'jupiterx-core' ); ?></div>
			</div>
			<?php
		}
	}

	new JupiterX_Control_Panel_White_Label();
}
