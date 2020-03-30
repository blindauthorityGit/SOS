<?php
/**
 * Adds posts control.
 *
 * @package Raven
 * @since 1.0.0
 */

namespace Raven\Controls\Group;

use \Elementor\Group_Control_Base;

defined( 'ABSPATH' ) || die();

/**
 * Raven posts control.
 *
 * A base control for creating posts control. Use to build a WP_Query arguments.
 *
 * Creating new control in the editor (inside `Widget_Base::_register_controls()`
 * method):
 *
 *    $this->add_group_control(
 *        'raven-posts',
 *        [
 *            'name' => 'posts',
 *            'post_type' => [ 'post', 'product' ],
 *        ]
 *    );
 *
 * @since 1.0.0
 *
 * @param string $name           The field name.
 * @param array  $post_type      Optional. Define specific post type/s to use. Default
 *                               is an empty array, including all the post types.
 * @param array  $fields_options Optional. An array of arays contaning data that
 *                               overrides control settings. Default is an empty array.
 * @param string $separator      Optional. Set the position of the control separator.
 *                               Available values are 'default', 'before', 'after'
 *                               and 'none'. 'default' will position the separator
 *                               depending on the control type. 'before' / 'after'
 *                               will position the separator before/after the
 *                               control. 'none' will hide the separator. Default
 *                               is 'default'.
 */
class Posts extends Group_Control_Base {

	/**
	 * Fields.
	 *
	 * Holds all the posts control fields.
	 *
	 * @since 1.0.0
	 * @access protected
	 * @static
	 *
	 * @var array Posts control fields.
	 */
	protected static $fields;

	/**
	 * Retrieve type.
	 *
	 * Get posts control type.
	 *
	 * @since 1.0.0
	 * @access public
	 * @static
	 *
	 * @return string Control type.
	 */
	public static function get_type() {
		return 'raven-posts';
	}

	/**
	 * Get post types.
	 *
	 * Get post types for source. Filter post types using `name` key in $args variable.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param  array $args Control arguments.
	 *
	 * @return array Filtered or non-filtered post types.
	 *
	 * @SuppressWarnings(PHPMD.CyclomaticComplexity)
	 * @SuppressWarnings(PHPMD.NPathComplexity)
	 */
	private static function get_post_types( $args ) {
		$post_types = [];

		$types_objects = [];

		$is_array = is_array( $args['post_type'] );

		$is_assoc = $is_array && array_values( $args['post_type'] ) !== $args['post_type'];

		// Get specific post type.
		if ( is_string( $args['post_type'] ) ) {
			$types_objects[] = get_post_type_object( $args['post_type'] );
		}

		// Get defined post types.
		if ( ! empty( $args['post_type'] ) && $is_array ) {
			$types_key = $is_assoc ? array_keys( $args['post_type'] ) : $args['post_type'];

			foreach ( $types_key as $type_name ) {
				$types_objects[] = get_post_type_object( $type_name );
			}
		}

		// A fallback for every failed conditions above.
		if ( 0 === count( $types_objects ) ) {
			$types_objects = get_post_types( [ 'show_in_nav_menus' => true ], 'objects' );
		}

		foreach ( $types_objects as $object ) {
			if ( ! is_null( $object ) ) {
				$post_types[ $object->name ] = $object->label;
			}
		}

		if ( $is_array && $is_assoc ) {
			$post_types = array_intersect_key( $args['post_type'], $post_types );
		}

		return $post_types;
	}

	/**
	 * Move field position.
	 *
	 * Set field position after the $position key.
	 *
	 * @since 1.0.0
	 * @access private
	 * @static
	 *
	 * @param string $control_id Field control ID to move.
	 * @param array  $fields All fields.
	 * @param string $position Before insert position.
	 *
	 * @SuppressWarnings(PHPMD.UnusedPrivateMethod)
	 */
	private static function set_field_position( $control_id, $fields, $position ) {
		$index = array_search( $position, array_keys( $fields ), true );

		if ( false !== $index ) {
			$temp[ $control_id ] = $fields[ $control_id ];
			$pos                 = $index + 1;

			unset( $fields[ $control_id ] );
			$fields = array_merge( array_slice( $fields, 0, $pos ), $temp, array_slice( $fields, $pos ) );
		}

		return $fields;
	}

	/**
	 * Init fields.
	 *
	 * Initialize posts control fields.
	 *
	 * @since 1.0.0
	 * @access public
	 *
	 * @return array Control fields.
	 */
	public function init_fields() {
		$fields = [];

		$fields['post_type'] = [
			'label' => _x( 'Source', 'Posts Group Control', 'raven' ),
			'type' => 'select',
		];

		return $fields;
	}

	/**
	 * Prepare fields.
	 *
	 * Process posts control fields before adding them to `add_control()`.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @param array $fields Posts control fields.
	 *
	 * @return array Processed fields.
	 */
	protected function prepare_fields( $fields ) {
		$args = $this->get_args();

		$post_types = self::get_post_types( $args );

		$type_field = [
			'type' => 1 >= count( $post_types ) ? 'hidden' : 'select',
			'default' => key( $post_types ),
			'options' => $post_types,
		];

		$fields['post_type'] = array_merge( $fields['post_type'], $type_field );

		if ( ! in_array( 'ids', $args['exclude'], true ) ) {
			$post_includes = $this->get_type_include_fields( $post_types );

			if ( ! empty( $post_includes ) ) {
				$fields = array_merge( $fields, $post_includes );
			}
		}

		if ( ! in_array( 'taxonomies', $args['exclude'], true ) ) {
			$post_taxonomies = $this->get_taxonomies_fields( $post_types );

			if ( ! empty( $post_taxonomies ) ) {
				$fields = array_merge( $fields, $post_taxonomies );
			}
		}

		if ( ! in_array( 'authors', $args['exclude'], true ) ) {
			$fields['authors'] = $this->get_authors_field( $post_types );
		}

		return parent::prepare_fields( $fields );
	}

	/**
	 * Process fields.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @param array $post_types All post types.
	 *
	 * @return array To embed fields.
	 * @SuppressWarnings(PHPMD.UnusedLocalVariable)
	 */
	protected function get_type_include_fields( $post_types ) {
		$fields = [];

		foreach ( $post_types as $post_type => $post_label ) {
			$options = [];

			$query_post_type = new \WP_Query( [
				'post_type' => $post_type,
				'posts_per_page' => -1, // @codingStandardsIgnoreLine
				'post_status' => 'publish',
			] );

			foreach ( $query_post_type->posts as $post ) {
				$options[ $post->ID ] = $post->post_title;
			}

			$fields[ $post_type . '_includes' ] = [
				'label' => _x( 'Posts', 'Posts Group Control', 'raven' ),
				'type' => 'select2',
				'default' => [],
				'multiple' => true,
				'label_block' => true,
				'options' => $options,
				'condition' => [
					'post_type' => $post_type,
				],
			];

			wp_reset_postdata();
		}

		return $fields;
	}

	/**
	 * Process fields.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @param array $post_types All post types.
	 *
	 * @return array To embed fields.
	 */
	protected function get_taxonomies_fields( $post_types ) {
		$fields = [];

		$keys = array_keys( $post_types );

		$args = [
			'show_in_nav_menus' => true,
		];

		$taxonomies = get_taxonomies( $args, 'objects' );

		$taxonomies = array_filter( $taxonomies, function( $value ) use ( $keys ) {
			return count( array_intersect( $value->object_type, $keys ) );
		} );

		foreach ( $taxonomies as $taxonomy => $taxonomy_object ) {
			$control_id = $taxonomy . '_ids';

			$fields[ $control_id ] = [
				'label' => $taxonomy_object->label,
				'type' => 'select2',
				'default' => [],
				'label_block' => true,
				'multiple' => true,
				'condition' => [
					'post_type' => $taxonomy_object->object_type,
					$taxonomy_object->object_type[0] . '_includes' => [],
				],
			];

			$taxonomy_terms = get_terms( $taxonomy );

			foreach ( $taxonomy_terms as $term ) {
				$fields[ $control_id ]['options'][ $term->term_id ] = $term->name;
			}
		}

		return $fields;
	}

	/**
	 * Process fields.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @param array $post_types All post types.
	 *
	 * @return array To embed fields.
	 *
	 * @SuppressWarnings(PHPMD.UnusedLocalVariable)
	 */
	protected function get_authors_field( $post_types ) {
		$options = [];

		$conditions = [
			'relation' => 'or',
			'terms' => [],
		];

		$query_authors = new \WP_User_Query( [
			'who' => 'authors',
			'has_published_posts' => true,
			'fields' => [ 'ID', 'display_name' ],
		] );

		foreach ( $query_authors->get_results() as $author ) {
			$options[ $author->ID ] = $author->display_name;
		}

		foreach ( $post_types as $post_type => $post_label ) {
			$name = $post_type . '_includes';

			// Compatibility with older version.
			if ( version_compare( ELEMENTOR_VERSION, '2.5.2', '<=' ) ) {
				$name = $this->get_controls_prefix() . $post_type . '_includes';
			}

			$conditions['terms'][] = [
				'name' => $name,
				'operator' => 'in',
				'value' => [],
			];
		}

		return [
			'label' => _x( 'Authors', 'Posts Group Control', 'raven' ),
			'type' => 'select2',
			'default' => [],
			'multiple' => true,
			'label_block' => true,
			'options' => $options,
			'conditions' => $conditions,
		];
	}

	/**
	 * Retrieve child default args.
	 *
	 * Get the default arguments for all the child controls for a specific group
	 * control.
	 *
	 * @since 1.0.0
	 * @access protected
	 *
	 * @return array Default arguments for all the child controls.
	 */
	protected function get_child_default_args() {
		return [
			'post_type' => [],
			'exclude' => [],
		];
	}

	/**
	 * Retrieve default options.
	 *
	 * @since 1.0.0
	 * @access protected
	 */
	protected function get_default_options() {
		return [
			'popover' => false,
		];
	}
}
