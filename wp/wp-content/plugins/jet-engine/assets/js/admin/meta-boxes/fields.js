Vue.component( 'jet-meta-fields', {
	name: 'jet-meta-fields',
	template: '#jet-meta-fields',
	props: {
		value: {
			type: Array,
			default: function() {
				return [];
			},
		},
	},
	data: function() {
		return {
			fieldsList: this.value,
			fieldTypes: JetEngineFieldsConfig.field_types,
			postTypes: JetEngineFieldsConfig.post_types,
			blockTitle: JetEngineFieldsConfig.title,
			buttonLabel: JetEngineFieldsConfig.button,
			disabledFields: JetEngineFieldsConfig.disabled,
		};
	},
	watch: {
		value: function( val ) {
			var openedTab = false;

			for ( var i = 0; i < val.length; i++ ) {
				switch ( val[i].object_type ) {
					case 'field':
						val[i].isNested = openedTab;
						break;

					case 'tab':
					case 'accordion':
						openedTab = true;
						val[i].isNested = false;
						break;

					case 'endpoint':
						openedTab = false;
						val[i].isNested = false;
						break;
				}
			}

			this.fieldsList = val;
		},
		fieldsList: {
			handler: function( val ) {
				this.$emit( 'input', val );
			},
			deep: true,
		},
	},
	computed: {
		repeaterFieldTypes: function() {
			var blackList = [ 'radio', 'repeater', 'select', 'checkbox' ];
			return this.fieldTypes.filter( function( field ) {
				return 0 > blackList.indexOf( field.value );
			} );
		},
	},
	methods: {
		onInput: function() {
			this.$emit( 'input', this.fieldsList );
		},
		getFieldSubtitle: function( field ) {

			var result = field.name + ' (';

			if ( 'field' === field.object_type ) {
				result += field.type;
			} else {
				result += field.object_type;
			}

			result += ')';

			return result;

		},
		addNewField: function( event ) {

			var field = {
				title: '',
				name: '',
				object_type: 'field',
				width: '100%',
				options: [],
				type: 'text',
				collapsed: false,
			};

			this.fieldsList.push( field );
			//this.onInput();

		},
		setFieldProp: function( index, key, value ) {

			var field = this.fieldsList[ index ];

			field[ key ] = value;

			this.fieldsList.splice( index, 1, field );
			//this.onInput();

		},
		preSetFieldName: function( index ) {

			var field = this.fieldsList[ index ];

			if ( ! field.name && field.title ) {
				var regex = /\s+/g;
				field.name = field.title.toLowerCase().replace( regex, '-' );
				this.fieldsList.splice( index, 1, field );
				//this.onInput();
			}

		},
		preSetRepeaterFieldName: function( fieldIndex, repeaterFieldIndex ) {

			var field         = this.fieldsList[ fieldIndex ],
				repeaterField = field['repeater-fields'][ repeaterFieldIndex ];

			if ( ! repeaterField.name && repeaterField.title ) {
				var regex = /\s+/g;
				repeaterField.name = repeaterField.title.toLowerCase().replace( regex, '-' );
				field['repeater-fields'].splice( repeaterFieldIndex, 1, repeaterField );
				this.fieldsList.splice( fieldIndex, 1, field );
				//this.onInput();
			}

		},
		setOptionProp: function( fieldIndex, optionIndex, key, value ) {

			var field  = this.fieldsList[ fieldIndex ],
				option = field.options[ optionIndex ];

			if ( 'is_checked' === key && ( 'radio' === field.type || ! field.is_multiple ) ) {
				for ( var i = 0; i < field.options.length; i++ ) {
					if ( field.options[ i ].is_checked ) {
						field.options[ i ].is_checked = false;
					}
				}
			}

			option[ key ] = value;

			field.options.splice( optionIndex, 1, option );
			this.fieldsList.splice( fieldIndex, 1, field );
			//this.onInput();

		},
		getOptionSubtitle: function( option ) {

			var result = option.key;

			if ( option.is_checked ) {
				result += ' (checked)';
			}

			return result;

		},
		setRepeaterFieldProp: function( fieldIndex, repeaterFieldIndex, key, value ) {

			var field         = this.fieldsList[ fieldIndex ],
				repeaterField = field['repeater-fields'][ repeaterFieldIndex ];

			repeaterField[ key ] = value;

			field['repeater-fields'].splice( repeaterFieldIndex, 1, repeaterField );
			this.fieldsList.splice( fieldIndex, 1, field );
			//this.onInput();

		},
		cloneField: function( index ) {

			var field    = this.fieldsList[ index ],
				newField = {
					'title':            field.title + ' (Copy)',
					'name':             field.name + '_copy',
					'object_type':      field.object_type,
					'tab_layout':       field.tab_layout,
					'options':          field.options,
					'type':             field.type,
					'repeater-fields':  field['repeater-fields'],
					'description':      field.description,
					'width':            field.width,
					'is_timestamp':     field.is_timestamp,
					'search_post_type': field.search_post_type,
					'is_multiple':      field.is_multiple,
					'default_val':      field.default_val,
					'is_required':      field.is_required,
				};

			//this.onInput();

			this.fieldsList.splice( index + 1, 0, newField );

		},
		deleteField: function( index ) {
			this.fieldsList.splice( index, 1 );
		},
		cloneOption: function( optionIndex, fieldIndex ) {

			var field     = this.fieldsList[ fieldIndex ],
				option    = field.options[ optionIndex ],
				newOption = {
					key: option.key + '_copy',
					value: option.value + '(Copy)',
				};

			field.options.splice( optionIndex + 1, 0, newOption );

			this.fieldsList.splice( fieldIndex, 1, field );
			//this.onInput();

		},
		deleteOption: function( optionIndex, fieldIndex ) {
			this.fieldsList[ fieldIndex ].options.splice( optionIndex, 1 );
		},
		addNewFieldOption: function( $event, index ) {

			var option = {
				key: '',
				value: '',
				collapsed: false,
			};

			if ( ! this.fieldsList[ index ].options ) {
				this.fieldsList[ index ].options = [];
			}

			this.fieldsList[ index ].options.push( option );

			//this.onInput();

		},

		cloneRepeaterField: function( childIndex, fieldIndex ) {

			var field         = this.fieldsList[ fieldIndex ],
				repeaterField = field['repeater-fields'][ childIndex ],
				newField      = {
					title:            repeaterField.title + ' (Copy)',
					name:             repeaterField.name + '_copy',
					type:             repeaterField.type,
					is_timestamp:     repeaterField.is_timestamp,
					search_post_type: repeaterField.search_post_type,
					is_multiple:      repeaterField.is_multiple,
				};

			field['repeater-fields'].splice( childIndex + 1, 0, newField );

			this.fieldsList.splice( fieldIndex, 1, field );
			//this.onInput();

		},
		deleteRepeaterField: function( childIndex, fieldIndex ) {
			this.fieldsList[ fieldIndex ]['repeater-fields'].splice( childIndex, 1 );
			//this.onInput();
		},
		addNewRepeaterField: function( $event, index ) {

			var field = {
				title: '',
				name: '',
				type: 'text',
				collapsed: false,
			};

			if ( ! this.fieldsList[ index ]['repeater-fields'] ) {
				this.$set( this.fieldsList[ index ], 'repeater-fields', [] );
			}

			this.fieldsList[ index ]['repeater-fields'].push( field );
			//this.onInput();

		},

		isCollapsed: function( object ) {
			if ( undefined === object.collapsed || true === object.collapsed ) {
				return true;
			} else {
				return false;
			}
		},

		isNestedField: function( field ) {
			if ( undefined !== field.isNested && field.isNested ) {
				return true;
			}

			return false;
		}
	},
} );