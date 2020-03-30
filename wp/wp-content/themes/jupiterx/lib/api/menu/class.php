<?php
/**
 * Extends menu functionality.
 *
 * @package JupiterX\Framework\Admin\Menu
 *
 * @since   1.0.0
 */

/**
 * The Jupiter Menu main class.
 *
 * @since   1.0.0
 *
 * @package JupiterX\Framework\Admin\Menu
 */
class JupiterX_Menu {

	/**
	 * Class constructor.
	 *
	 * @since 1.0.0
	 *
	 * @return void
	 */
	public function __construct() {

		if ( ! class_exists( 'Menu_Icons' ) ) {
			return;
		}

		add_filter( 'menu_icons_settings_defaults', [ $this, 'defaults' ] );
		add_action( 'icon_picker_types_registry_init', [ $this, 'icon_picker' ] );
	}

	/**
	 * Set Jupiter icons enabled by default.
	 *
	 * @since 1.0.0
	 *
	 * @param array $defaults Default enabled icon sets.
	 *
	 * @return array $defaults Modified default enabled icon sets.
	 */
	public function defaults( $defaults ) {
		$defaults['global']['icon_types'][] = 'jupiterx_icons';
		return $defaults;
	}

	/**
	 * Register Jupiter Icons to Icon Picker.
	 *
	 * @see JupiterX_Menu_Icons
	 *
	 * @since   1.0.0
	 *
	 * @param Icon_Picker_Types_Registry $registry Icon_Picker_Types_Registry instance.
	 *
	 * @return void
	 */
	public function icon_picker( Icon_Picker_Types_Registry $registry ) {
		require_once Icon_Picker::instance()->dir . '/includes/types/font.php';
		require_once JUPITERX_API_PATH . 'menu/menu-icons.php';

		$registry->add( new JupiterX_Menu_Icons() );
	}

}

new JupiterX_Menu();
