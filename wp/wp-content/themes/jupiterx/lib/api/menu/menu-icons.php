<?php
/**
 * Extends menu icons functionality to add Jupiter Icons to available icon sets.
 *
 * We use the Menu Icons by ThemeIsle plugin to add needed features ( Icons, image, svg for menu ) to Jupiter X.
 * This class extends the plugins' icon picker class to add Jupiter Icons as a new icon set.
 *
 * @link https://wordpress.org/plugins/menu-icons/
 *
 * @package JupiterX\Framework\Admin\Menu
 *
 * @since   1.0.0
 */

/**
 * Extend Menu Icons' icon picker class to add Jupiter Icons.
 *
 * @since   1.0.0
 *
 * @package JupiterX\Framework\Admin\Menu
 */
class JupiterX_Menu_Icons extends Icon_Picker_Type_Font {

	/**
	 * Icon type ID
	 *
	 * @since  1.0.0
	 *
	 * @access protected
	 *
	 * @var    string
	 */
	protected $id = 'jupiterx_icons';

	/**
	 * Holds icon label
	 *
	 * @since  1.0.0
	 *
	 * @access protected
	 * @var    string
	 */
	protected $name = 'Jupiter X Icons';

	/**
	 * Holds icon version
	 *
	 * @since  1.0.0
	 *
	 * @access protected
	 *
	 * @var    string
	 */
	protected $version = JUPITERX_VERSION;

	/**
	 * Get stylesheet URI
	 *
	 * @since  1.0.0
	 *
	 * @return string
	 */
	public function get_stylesheet_uri() {
		return JUPITERX_ASSETS_URL . 'dist/css/icons-admin.css';
	}

	/**
	 * Get icon items
	 *
	 * @since  1.0.0
	 *
	 * @return array
	 */
	public function get_items() {
		$items = [
			[
				'id'   => 'jupiterx-icon-creative-market',
				'name' => __( 'Creative Market', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-long-arrow',
				'name' => __( 'Long Arrow', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-search-1',
				'name' => __( 'Search 1', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-search-2',
				'name' => __( 'Search 2', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-search-3',
				'name' => __( 'Search 3', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-search-4',
				'name' => __( 'Search 4', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-share-email',
				'name' => __( 'Share E-Mail', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-1',
				'name' => __( 'Shopping Cart 1', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-2',
				'name' => __( 'Shopping Cart 2', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-3',
				'name' => __( 'Shopping Cart 3', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-4',
				'name' => __( 'Shopping cart 4', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-5',
				'name' => __( 'Shopping cart 5', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-6',
				'name' => __( 'Shopping cart 6', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-7',
				'name' => __( 'Shopping cart 7', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-8',
				'name' => __( 'Shopping cart 8', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-9',
				'name' => __( 'Shopping cart 9', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-shopping-cart-10',
				'name' => __( 'Shopping cart 10', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-zillow',
				'name' => __( 'Zillow', 'jupiterx' ),
			],
			[
				'id'   => 'jupiterx-icon-zomato',
				'name' => __( 'Zomato', 'jupiterx' ),
			],
		];

		return $items;
	}
}
