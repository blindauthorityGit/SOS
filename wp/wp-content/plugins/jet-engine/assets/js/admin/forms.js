var GridLayout = VueGridLayout.GridLayout;
var GridItem = VueGridLayout.GridItem;

Vue.component( 'jet-post-field-control', {
	template: '#jet-post-field-control',
	props: [ 'value', 'fields', 'metaProp', 'termsProp' ],
	data: function () {
		return {
			fieldType: '',
			fieldName: '',
			taxonomies: window.JetEngineFormSettings.taxonomies,
		};
	},
	mounted: function() {

		if ( ! this.value ) {
			this.fieldType = 0;
		} else {

			if ( 0 <= this.fieldsProps.indexOf( this.value ) ) {
				this.fieldType = this.value;
			} else {

				if ( this.value.includes( 'jet_tax__' ) ) {
					this.fieldType = this.termsProp;
				} else {
					this.fieldType = this.metaProp;
				}

				this.fieldName = this.value;
			}

		}

	},
	computed: {
		fieldsProps: function() {
			var result = [];

			for ( var prop in this.fields ) {
				if ( 0 !== prop && this.metaProp !== prop && this.termsProp !== prop ) {
					result.push( prop );
				}
			}

			return result;

		},
	},
	methods: {
		setField: function( $event, from ) {

			var value = $event.target.value;

			if ( 'field_name' === from ) {
				this.fieldName = value;
				this.$emit( 'input', value );
			} else {
				this.fieldType = value;

				if ( this.metaProp !== value && this.termsProp !== value ) {
					this.$emit( 'input', value );
				} else {
					this.$emit( 'input', this.fieldName );
				}
			}

		}
	}
});

var JEBookingFormBuilder = new Vue({
	el: '#form_builder',
	components: {
		GridLayout: GridLayout,
		GridItem: GridItem,
	},
	data: {
		layout: JSON.parse( JSON.stringify( JetEngineFormSettings.form_data ) ),
		result: JSON.parse( JSON.stringify( JetEngineFormSettings.form_data ) ),
		index: 1,
		showEditor: false,
		currentItem: {},
		currentIndex: false,
		fieldTypes: JetEngineFormSettings.field_types,
		inputTypes:JetEngineFormSettings.input_types,
		taxonomies: JetEngineFormSettings.taxonomies,
		postTypes: JetEngineFormSettings.post_types,
		captcha: JSON.parse( JSON.stringify( JetEngineFormSettings.captcha ) ),
		preset: JSON.parse( JSON.stringify( JetEngineFormSettings.preset ) ),
		mimes: JetEngineFormSettings.all_mimes,
		userFields: JetEngineFormSettings.user_fields
	},
	mounted: function () {
		this.index = this.layout.length;
		this.adjustPresetFieldsMap();
	},
	computed: {
		resultJSON: function() {
			return JSON.stringify( this.result );
		},
		availableFields: function() {

			var fields = [];
			var skipFields = [ 'submit', 'page_break', 'heading', 'group_break' ];

			if ( this.layout ) {
				this.layout.forEach( function( item ) {
					if ( -1 === skipFields.indexOf( item.settings.type ) ) {
						fields.push( item.settings.name );
					}
				});
			}

			return fields;

		},
	},
	watch: {
		layout: {
			handler: function() {
				this.adjustPresetFieldsMap();
			},
			deep: true,
		},
	},
	methods: {
		setHeadingName: function() {
			if ( 'heading' === this.currentItem.settings.type || 'group_break' === this.currentItem.settings.type ) {
				this.$set( this.currentItem.settings, 'name', this.currentItem.settings.type );
			}
		},
		setItemCallback: function( cb ) {
			this.$set( this.currentItem.settings, 'dynamic_update_hook', cb );
			this.showCallbacksPopup = false;
		},
		newUpdateArg: function() {

			if ( ! this.currentItem.settings.dynamic_update_args ) {
				this.$set( this.currentItem.settings, 'dynamic_update_args', [] );
			}

			this.currentItem.settings.dynamic_update_args.push( '' );

		},
		adjustPresetFieldsMap: function() {

			var self = this;

			self.layout.forEach( function( item ) {

				if ( 'submit' === item.settings.type || ! item.settings.name ) {
					return;
				}

				if ( ! self.preset.fields_map[ item.settings.name ] ) {
					self.$set( self.preset.fields_map, item.settings.name, {
						'prop': '',
						'key': '',
					} );
				}

			} );
		},
		inArray: function( needle, haystack ) {
			return -1 < haystack.indexOf( needle );
		},
		addRepeaterItem: function( items, item ) {
			items.push( item );
		},
		itemInstance: function( item ) {

			var instance = JetEngineFormSettings.labels.field;

			if ( item.settings.is_message ) {
				instance = JetEngineFormSettings.labels.message;
			}

			if ( item.settings.is_submit ) {
				instance = JetEngineFormSettings.labels.submit;
			}

			return instance;

		},
		currentWidth: function( width ) {
			switch( width ) {

				case 2:
					return '1/6';

				case 3:
					return '1/4';

				case 4:
					return '1/3';

				case 6:
					return '1/2';

				case 8:
					return '2/3';

				case 9:
					return '3/4';

				case 10:
					return '5/6';

				case 12:
					return 'Fullwidth';

				default:
					return width + '/12';
			}
		},
		editField: function( item, index ) {

			this.applyFieldChanges();

			this.currentItem  = item;
			this.currentIndex = index;
			this.showEditor   = true;

		},
		applyFieldChanges: function() {

			if ( false === this.currentIndex ) {
				return;
			}

			this.result.splice( this.currentIndex, 1, this.currentItem );

			this.currentItem  = {};
			this.currentIndex = false;
			this.showEditor   = false;

		},
		cancelFieldChanges: function() {

			this.currentItem  = {};
			this.currentIndex = false;
			this.showEditor   = false;

		},
		deleteRepeterItem: function( index, items ) {
			items.splice( index, 1 );
		},
		addField: function( isSubmit, isMessage, isPageBreak ) {
			var maxY            = 0,
				currY           = 0,
				newItem         = {},
				defaultSettings = JSON.parse( JSON.stringify( JetEngineFormSettings.default_settings ) );

			isPageBreak = isPageBreak || false;

			defaultSettings.is_message    = isMessage;
			defaultSettings.is_submit     = isSubmit;
			defaultSettings.is_page_break = isPageBreak;

			if ( isSubmit ) {
				defaultSettings.type      = 'submit';
				defaultSettings.name      = 'submit';
				defaultSettings.label     = 'Submit';
				defaultSettings.className = '';
			} else if ( isPageBreak ) {
				defaultSettings.type      = 'page_break';
				defaultSettings.name      = 'page_break';
				defaultSettings.label     = 'Next';
				defaultSettings.className = '';
			}

			for ( var i = 0; i < this.result.length; i++ ) {
				currY = this.result[ i ].y;
				if ( currY > maxY ) {
					maxY = currY;
				}
			}

			maxY++;

			newItem = {
				"x": 0,
				"y": maxY,
				"w": 12,
				"h": 1,
				"i": String(this.index),
				"settings": defaultSettings,
			};

			this.index++;

			this.layout.push( newItem );
			this.result.push( newItem );

		},
		updateLayout: function( newLayout ) {
			this.result.splice( 0, this.result.length );
			for ( var i = 0; i <= newLayout.length - 1; i++ ) {
				this.result.push( newLayout[ i ] );
			}
		},
		removeField: function( item, index ) {

			if ( ! confirm( JetEngineFormSettings.confirm_message ) ) {
				return;
			}

			this.layout.splice( index, 1 );
			this.reindexLayout();

			for ( var i = 0; i < this.result.length; i++ ) {
				if ( this.result[ i ].i == item.i ) {
					this.result.splice( i, 1 );
					return;
				}
			}

		},
		reindexLayout : function () {
			for ( var i = 0; i < this.layout.length; i++ ) {
				this.layout[i]['i'] = String( i );
			}
		}
	}
});

var SlickList       = window.VueSlicksort.SlickList,
	SlickItem       = window.VueSlicksort.SlickItem,
	HandleDirective = window.VueSlicksort.HandleDirective;

var JEBookingFormNotifications = new Vue({
	el: '#notifications_builder',
	data: {
		items: JSON.parse( JSON.stringify( JetEngineFormSettings.notifications_data ) ),
		index: 1,
		showEditor: false,
		currentItem: {},
		currentIndex: false,
		availableTypes: JetEngineFormSettings.notification_types,
		postTypes: JetEngineFormSettings.post_types,
		postStatuses: JetEngineFormSettings.post_statuses,
		userFields: JetEngineFormSettings.user_fields,
		postProps: JetEngineFormSettings.post_props,
		userProps: JetEngineFormSettings.user_props,
		allPages: JetEngineFormSettings.pages,
		redirectNotice: JetEngineFormSettings.labels.redirect_notice,
		activecampFields: JetEngineFormSettings.activecamp_fields,
		validateActiveCampAPI: false,
		loadingActiveCampLists: false
	},
	components: {
		'slick-list': SlickList,
		'slick-item': SlickItem,
	},
	directives: {
		handle: HandleDirective
	},
	mounted: function() {

		var self = this;

		self.items.forEach( function( item, index ) {

			var overwrite = false;

			if ( item.fields_map && undefined !== item.fields_map.length ) {
				item.fields_map = {};
				overwrite = true;
			}

			if ( undefined === item.activecampaign ) {
				item.activecampaign = {
					fields_map: {},
					lists: {}
				};
				overwrite = true;
			}

			if ( item.activecampaign.fields_map && undefined !== item.activecampaign.fields_map.length ) {
				item.activecampaign.fields_map = {};
				overwrite = true;
			}

			if ( item.activecampaign.lists && undefined !== item.activecampaign.lists.length ) {
				item.activecampaign.lists = {};
				overwrite = true;
			}

			if ( undefined === item.default_meta ) {
				item.default_meta = [];
				overwrite = true;
			}

			if ( overwrite ) {
				self.items.splice( index, 1, item );
			}

		} );

	},
	computed: {
		resultJSON: function() {
			return JSON.stringify( this.items );
		},
		availableFields: function() {

			var fields = JSON.parse( JSON.stringify( JEBookingFormBuilder.availableFields ) );

			this.items.forEach( function( item ) {
				if ( 'register_user' === item.type && item.add_user_id ) {
					fields.push( 'user_id' );
				}

				if ( 'insert_post' === item.type ) {
					fields.push( 'inserted_post_id' );
				}

			});

			return fields;

		},
	},
	methods: {
		showRedirectNotice: function( item, index ) {

			if ( 'redirect' !== item.type ) {
				return false;
			}

			return index < ( this.items.length - 1 );

		},
		addField: function() {

			this.items.push( {
				'type': 'email',
				'mail_to': 'admin',
				'hook_name': 'send',
				'custom_email': '',
				'from_field': '',
				'post_type': '',
				'fields_map': {},
				'email': {},
				'default_meta': [],
				'activecampaign': {
					fields_map: {},
					lists: {}
				}
			} );

		},
		addRepeaterItem: function( items, item ) {
			items.push( item );
		},
		deleteRepeterItem: function( index, items ) {
			items.splice( index, 1 );
		},
		editItem: function( item, index ) {

			this.applyItemChanges();

			this.currentItem  = JSON.parse( JSON.stringify( item ) );
			this.currentIndex = index;
			this.showEditor   = true;

			if ( undefined === this.currentItem.default_meta ) {
				this.$set( this.currentItem, 'default_meta', [] );
			}

		},
		applyItemChanges: function() {

			if ( false === this.currentIndex ) {
				return;
			}

			if ( this.currentItem.fields_map ) {
				for ( var field in this.currentItem.fields_map ) {
					if ( 'register_user' === this.currentItem.type ) {
						if ( 0 > this.availableFields.indexOf( this.currentItem.fields_map[ field ] ) ) {
							delete( this.currentItem.fields_map[ field ] );
						}
					} else if ( 'update_user' === this.currentItem.type ) {
						if ( 0 > this.availableFields.indexOf( field ) ) {
							delete( this.currentItem.fields_map[ field ] );
						}
					}
				}
			}

			this.items.splice( this.currentIndex, 1, this.currentItem );

			this.currentItem  = false;
			this.currentIndex = false;
			this.showEditor   = false;

		},
		cancelItemChanges: function() {

			this.currentItem  = false;
			this.currentIndex = false;
			this.showEditor   = false;

		},
		removeItem: function( item, index ) {

			if ( ! confirm( JetEngineFormSettings.confirm_message ) ) {
				return;
			}

			if( index === this.currentIndex && this.showEditor ){
				this.showEditor   = false;
			}

			this.items.splice( index, 1 );

		},
		validateActiveCampaignAPI: function() {
			this.getActiveCampaignLists( {}, true );
		},
		getActiveCampaignLists: function( event, isValidate ) {
			var self = this,
				url,
				lists = {},
				api_url = this.currentItem.activecampaign.api_url,
				api_key = this.currentItem.activecampaign.api_key,
				endpoint = '/admin/api.php?api_action=list_list';

			isValidate = isValidate || false;

			if ( isValidate ) {
				self.validateActiveCampAPI = true;
			} else {
				self.loadingActiveCampLists = true;
			}

			url = api_url + endpoint + '&api_key=' + api_key + '&ids=all&api_output=json';

			jQuery.getJSON( url )
				.success( function( data ) {
					if ( undefined !== data.result_code && data.result_code ) {

						for ( var prop in data ) {
							if ( undefined === data[prop].id ) {
								continue;
							}

							lists[data[prop].id] = data[prop].name;
						}

						self.$set( self.currentItem.activecampaign, 'lists', lists );
						self.$set( self.currentItem.activecampaign, 'isValidAPI', true );
					} else {
						self.$set( self.currentItem.activecampaign, 'isValidAPI', false );
					}

					self.validateActiveCampAPI = false;
					self.loadingActiveCampLists = false;
				} )
				.error( function() {
					self.$set( self.currentItem.activecampaign, 'isValidAPI', false );
					self.validateActiveCampAPI = false;
					self.loadingActiveCampLists = false;
				} );
		}
	}
});

function JEBookingFormSetMessages() {
	var $messages = jQuery('#messages-settings .messages-list'),
		messages_data = JetEngineFormSettings.messages;

	if( $messages.length ){
		jQuery.each( messages_data, function( message, value ) {
			$messages.find( 'input[name="_messages['+ message + ']"]' )[0].value = value;
		});
	}
}

jQuery( document ).ready( JEBookingFormSetMessages );
