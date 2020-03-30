<?php
/**
 * Meta boxes manager
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	die;
}

if ( ! class_exists( 'Jet_Engine_Meta_Boxes' ) ) {

	/**
	 * Define Jet_Engine_Meta_Boxes class
	 */
	class Jet_Engine_Meta_Boxes extends Jet_Engine_Base_WP_Intance {

		/**
		 * Base slug for CPT-related pages
		 * @var string
		 */
		public $page = 'jet-engine-meta';

		/**
		 * Action request key
		 *
		 * @var string
		 */
		public $action_key = 'cpt_meta_action';

		/**
		 * Set object type
		 * @var string
		 */
		public $object_type = '';

		/**
		 * Meta fields for object
		 *
		 * @var null
		 */
		public $meta_fields = array();

		private $custom_groups = array();

		/**
		 * Init data instance
		 *
		 * @return [type] [description]
		 */
		public function init_data() {

			add_action( 'jet-engine/pages/cpt/register', array( $this, 'add_meta_fields_to_rel_components' ) );
			add_action( 'jet-engine/pages/taxonomies/register', array( $this, 'add_meta_fields_to_rel_components' ) );

			require $this->component_path( 'data.php' );
			$this->data = new Jet_Engine_Meta_Boxes_Data( $this );

		}

		/**
		 * Add meta fields editor to components where it allowed
		 */
		public function add_meta_fields_to_rel_components() {

			$pages = $this->get_instance_pages();

			if ( ! class_exists( 'Jet_Engine_Meta_Boxes_Page_Edit' ) ) {
				require $pages['Jet_Engine_Meta_Boxes_Page_Edit'];
			}

			add_action(
				'jet-engine/post-type/edit/before-enqueue-assets',
				array( 'Jet_Engine_Meta_Boxes_Page_Edit', 'enqueue_meta_fields' )
			);

			add_action(
				'jet-engine/taxonomies/edit/before-enqueue-assets',
				array( 'Jet_Engine_Meta_Boxes_Page_Edit', 'enqueue_meta_fields' )
			);

			add_action(
				'jet-engine/post-types/meta-fields',
				function() {
					echo '<jet-meta-fields v-model="metaFields"></jet-meta-fields>';
				}
			);

			add_action(
				'jet-engine/taxonomies/meta-fields',
				function() {
					echo '<jet-meta-fields v-model="metaFields"></jet-meta-fields>';
				}
			);

		}

		/**
		 * Initiizlize post type specific API endpoints
		 *
		 * @param  Jet_Engine_REST_API $api_manager API manager instance.
		 * @return void
		 */
		public function init_rest( $api_manager ) {

			require_once $this->component_path( 'rest-api/add-meta-box.php' );
			require_once $this->component_path( 'rest-api/edit-meta-box.php' );
			require_once $this->component_path( 'rest-api/get-meta-box.php' );
			require_once $this->component_path( 'rest-api/get-meta-boxes.php' );
			require_once $this->component_path( 'rest-api/delete-meta-box.php' );

			$api_manager->register_endpoint( new Jet_Engine_Meta_Boxes_Rest_Add() );
			$api_manager->register_endpoint( new Jet_Engine_Meta_Boxes_Rest_Edit() );
			$api_manager->register_endpoint( new Jet_Engine_Meta_Boxes_Rest_Get() );
			$api_manager->register_endpoint( new Jet_Engine_Meta_Boxes_Rest_Get_All() );
			$api_manager->register_endpoint( new Jet_Engine_Meta_Boxes_Rest_Delete() );

		}

		/**
		 * Return path to file inside component
		 *
		 * @param  [type] $path_inside_component [description]
		 * @return [type]                        [description]
		 */
		public function component_path( $path_inside_component ) {
			return jet_engine()->plugin_path( 'includes/components/meta-boxes/' . $path_inside_component );
		}

		/**
		 * Regiter custom group
		 *
		 * @param  [type] $name  [description]
		 * @param  [type] $label [description]
		 * @return [type]        [description]
		 */
		public function register_custom_group( $name, $label ) {
			$this->custom_groups[ $name ] = $label;
		}

		/**
		 * Register metaboxes
		 *
		 * @return void
		 */
		public function register_instances() {

			$meta_boxes = $this->data->get_raw();

			do_action( 'jet-engine/meta-boxes/register-instances', $this );

			if ( empty( $meta_boxes ) ) {
				$this->store_default_user_meta_fields();
				return;
			}

			foreach ( $meta_boxes as $meta_box ) {

				$args        = $meta_box['args'];
				$meta_fields = $meta_box['meta_fields'];
				$object_type = isset( $args['object_type'] ) ? esc_attr( $args['object_type'] ) : 'post';

				switch ( $object_type ) {

					case 'post':

						if ( ! class_exists( 'Jet_Engine_CPT_Meta' ) ) {
							require $this->component_path( 'post.php' );
						}

						$post_types = ! empty( $args['allowed_post_type'] ) ? $args['allowed_post_type'] : array();
						$title      = isset( $args['name'] ) ? $args['name'] : '';

						foreach ( $post_types as $post_type ) {

							$this->store_fields( $post_type, $meta_fields );

							if ( ! empty( $args['allowed_posts'] ) ) {

								$post_id = $this->get_post_id();

								if ( ! $post_id || ! in_array( $post_id, $args['allowed_posts'] ) ) {
									continue;
								}
							}

							new Jet_Engine_CPT_Meta( $post_type, $meta_fields, $title );

						}

						break;

					case 'tax':
					case 'taxonomy':

						if ( ! class_exists( 'Jet_Engine_CPT_Tax_Meta' ) ) {
							require $this->component_path( 'tax.php' );
						}

						$taxonomies = ! empty( $args['allowed_tax'] ) ? $args['allowed_tax'] : array();

						foreach ( $taxonomies as $taxonomy ) {
							new Jet_Engine_CPT_Tax_Meta( $taxonomy, $meta_fields );
							$this->store_fields( $taxonomy, $meta_fields );
						}

						break;

					case 'user':

						if ( ! class_exists( 'Jet_Engine_CPT_User_Meta' ) ) {
							require $this->component_path( 'user.php' );
						}

						new Jet_Engine_CPT_User_Meta( $args, $meta_fields );

						$object_name = $args['name'] . ' ' . __( '(User fields)', 'jet-engine' );

						$this->store_fields( $object_name, $meta_fields );

						break;

				}

			}

			$this->store_default_user_meta_fields();

		}

		/**
		 * Register the same metabox as default but from outside of this instance
		 *
		 * @return [type] [description]
		 */
		public function register_metabox( $post_type = '', $meta_fields = array(), $title = '', $object_name = null ) {

			$object_name = ! empty( $object_name ) ? $object_name : $post_type;

			$this->store_fields( $object_name, $meta_fields );

			if ( ! class_exists( 'Jet_Engine_CPT_Meta' ) ) {
				require $this->component_path( 'post.php' );
			}

			new Jet_Engine_CPT_Meta( $post_type, $meta_fields, $title );

		}

		/**
		 * Strore information aboutt all registered fields
		 *
		 * @param  string $post_type   [description]
		 * @param  array  $meta_fields [description]
		 * @return [type]              [description]
		 */
		public function store_fields( $object_type = 'post', $meta_fields = array() ) {

			if ( empty( $this->meta_fields[ $object_type ] ) ) {
				$this->meta_fields[ $object_type ] = array();
			}

			$this->meta_fields[ $object_type ] = array_merge(
				$this->meta_fields[ $object_type ],
				array_values( $meta_fields )
			);
		}

		/**
		 * Return all registered meta fields
		 *
		 * @return [type] [description]
		 */
		public function get_registered_fields() {
			return $this->meta_fields;
		}

		/**
		 * Try to get current post ID from request
		 *
		 * @return [type] [description]
		 */
		public function get_post_id() {

			$post_id = isset( $_GET['post'] ) ? $_GET['post'] : false;

			if ( ! $post_id && isset( $_REQUEST['post_ID'] ) ) {
				$post_id = $_REQUEST['post_ID'];
			}

			return $post_id;

		}

		/**
		 * Return fields list registered for users
		 *
		 * @return [type] [description]
		 */
		public function store_default_user_meta_fields() {
			$this->store_fields(
				__( 'Default user fields', 'jet-engine' ),
				array(
					array(
						'name'  => 'first_name',
						'title' => __( 'First Name', 'jet-enegine' ),
						'type'  => 'text',
					),
					array(
						'name'  => 'last_name',
						'title' => __( 'Last Name', 'jet-enegine' ),
						'type'  => 'text',
					),
					array(
						'name'  => 'description',
						'title' => __( 'Biographical Info', 'jet-enegine' ),
						'type'  => 'text',
					),
				)
			);
		}

		/**
		 * Return list of meta fields for post type
		 *
		 * @param  string $object [description]
		 * @return [type]            [description]
		 */
		public function get_meta_fields_for_object( $object = 'post' ) {

			if ( isset( $this->meta_fields[ $object ] ) ) {
				return $this->meta_fields[ $object ];
			} else {
				return array();
			}

		}

		/**
		 * Returns all registered options (or depends on context) to use in select
		 *
		 * @return [type] [description]
		 */
		public function get_fields_for_select( $context = 'plain', $where = 'elementor', $for = 'all' ) {

			$result = array();
			$post_types = get_post_types( array(), 'objects' );
			$taxonomies = get_taxonomies( array(), 'objects' );

			foreach ( $this->meta_fields as $object => $fields ) {

				$group_label = false;

				if ( isset( $post_types[ $object ] ) ) {

					if ( ! in_array( $for, array( 'all', 'posts' ) ) ) {
						continue;
					}

					$group_label = $post_types[ $object ]->labels->name;

				} elseif ( isset( $taxonomies[ $object ] ) ) {

					if ( ! in_array( $for, array( 'all', 'taxonomies' ) ) ) {
						continue;
					}

					$group_label = $taxonomies[ $object ]->labels->name;

				} else {

					if ( ! in_array( $for, array( 'all', 'user' ) ) ) {
						continue;
					}

					$group_label = $object;
				}

				if ( ! $group_label ) {
					continue;
				}

				$group        = array();
				$blocks_group = array();

				foreach ( $fields as $field_data ) {

					if ( ! empty( $field_data['object_type'] ) && 'field' !== $field_data['object_type'] ) {
						continue;
					}

					$name  = $field_data['name'];
					$title = ! empty( $field_data['title'] ) ? $field_data['title'] : $name;

					switch ( $context ) {

						case 'all':

							$group[ $name ] = $title;

							$blocks_group[] = array(
								'value' => $name,
								'label' => $title,
							);

							break;

						case 'plain':

							if ( 'repeater' !== $field_data['type'] ) {
								$group[ $name ] = $title;

								$blocks_group[] = array(
									'value' => $name,
									'label' => $title,
								);

							}

							break;

						case 'repeater':

							if ( 'repeater' === $field_data['type'] ) {
								$group[ $name ] = $title;

								$blocks_group[] = array(
									'value' => $name,
									'label' => $title,
								);
							}

							break;

						case 'media':

							if ( 'media' === $field_data['type'] ) {
								$group[ $name ] = $title;

								$blocks_group[] = array(
									'value' => $name,
									'label' => $title,
								);

							}

							break;

						case 'gallery':

							if ( 'gallery' === $field_data['type'] ) {
								$group[ $name ] = $title;

								$blocks_group[] = array(
									'value' => $name,
									'label' => $title,
								);
							}

							break;

					}

				}

				if ( ! empty( $group ) ) {
					if ( 'blocks' === $where ) {
						$result[] = array(
							'label'  => $group_label,
							'values' => $blocks_group,
						);
					} else {
						$result[] = array(
							'label'   => $group_label,
							'options' => $group,
						);
					}
				}

			}

			return $result;

		}

		/**
		 * Return admin pages for current instance
		 *
		 * @return array
		 */
		public function get_instance_pages() {

			$base_path = $this->component_path( 'pages/' );

			return array(
				'Jet_Engine_Meta_Boxes_Page_List' => $base_path . 'list.php',
				'Jet_Engine_Meta_Boxes_Page_Edit' => $base_path . 'edit.php',
			);

		}

		/**
		 * Returns current menu page title (for JetEngine submenu)
		 * @return [type] [description]
		 */
		public function get_page_title() {
			return __( 'Meta Boxes', 'jet-engine' );
		}

		/**
		 * Returns current instance slug
		 *
		 * @return [type] [description]
		 */
		public function instance_slug() {
			return 'meta';
		}

		/**
		 * Returns default config for add/edit page
		 *
		 * @param  array  $config [description]
		 * @return [type]         [description]
		 */
		public function get_admin_page_config( $config = array() ) {

			$default_settings = array(
				'type'  => 'text',
				'width' => '100%',
			);

			$default = array(
				'api_path_edit'       => '', // Set individually for apropriate page
				'api_path_get'        => jet_engine()->api->get_route( 'get-meta-box' ),
				'api_path_search'     => jet_engine()->api->get_route( 'search-posts' ),
				'edit_button_label'   => '', // Set individually for apropriate page,
				'item_id'             => false,
				'post_types'          => Jet_Engine_Tools::get_post_types_for_js(),
				'taxonomies'          => Jet_Engine_Tools::get_taxonomies_for_js(),
				'redirect'            => '', // Set individually for apropriate page,
				'general_settings'    => array( 'object_type' => 'post' ),
				'meta_fields'         => array(),
				'notices'             => array(
					'name'    => __( 'Please, set meta box title', 'jet-engine' ),
					'success' => __( 'Meta box updated', 'jet-engine' ),
				),
			);

			return array_merge( $default, $config );

		}

	}

}
