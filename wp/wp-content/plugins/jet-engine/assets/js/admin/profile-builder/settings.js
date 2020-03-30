(function( $, JetEngineProfileBuilder ) {

	'use strict';

	new Vue( {
		el: '#jet_engine_profile_builder',
		template: '#jet-profile-builder',
		data: {
			settings: JetEngineProfileBuilder.settings,
			pagesList: JetEngineProfileBuilder.pages,
			notLoggedActions: JetEngineProfileBuilder.not_logged_in_actions,
			rewriteOptions: JetEngineProfileBuilder.rewrite_options,
			visibilityOptions: JetEngineProfileBuilder.visibility_options,
			saving: false,
		},
		mounted: function() {
			this.$el.className = 'is-mounted';

			if ( ! this.settings.account_page_structure ) {
				this.$set( this.settings, 'account_page_structure', [
					{
						title: 'Main',
						slug: 'main',
						template: '',
						collapsed: false,
					}
				] );
			}

			if ( ! this.settings.user_page_structure ) {
				this.$set( this.settings, 'user_page_structure', [
					{
						title: 'Main',
						slug: 'main',
						template: '',
						visibility: 'all',
						collapsed: false,
					}
				] );
			}

		},
		watch: {
			settings: {
				handler: function( newSettings, oldSettings ) {
					var self = this;

					Vue.nextTick( function() {
						self.$refs.settingsTabs.updateState();
					} );
				},
				deep: true,
			}
		},
		methods: {
			preSetSlug: function( index, setting ) {

				var pages   = this.settings[ setting ],
					page    = pages[ index ];

				if ( ! page.slug && page.title ) {
					var regex = /\s+/g;
					page.slug = page.title.toLowerCase().replace( regex, '-' );
					pages.splice( index, 1, page );
					this.$set( this.settings, setting, pages );
				}

			},
			addNewPage: function( setting ) {

				var pages   = this.settings[ setting ],
					newPage = {
						title: '',
						slug: '',
						template: '',
						collapsed: false,
					};

				pages.push( newPage );

				this.$set( this.settings, setting, pages );

			},
			buildQuery: function( params ) {
				return Object.keys( params ).map(function( key ) {
					return key + '=' + params[ key ];
				}).join( '&' );
			},
			getPosts: function( query, ids ) {

				if ( ids.length ) {
					ids = ids.join( ',' );
				}

				return wp.apiFetch( {
					method: 'get',
					path: JetEngineProfileBuilder.search_api + '?' + this.buildQuery( {
						query: query,
						ids: ids,
						post_type: JetEngineProfileBuilder.search_in.join( ',' ),
					} )
				} );
			},
			clonePage: function( index, setting ) {

				var pages   = this.settings[ setting ],
					page    = pages[ index ],
					newPage = {
						title: page.title + ' (Copy)',
						slug: page.slug + '-copy',
						template: page.template,
					};

				pages.push( newPage );

				this.$set( this.settings, setting, pages );

			},
			deletePage: function( index, setting ) {
				var pages = this.settings[ setting ];
				pages.splice( index, 1 );
				this.$set( this.settings, setting, pages );
			},
			setPageProp: function( index, key, value, setting ) {
				var pages = this.settings[ setting ],
					page  = pages[ index ];

				page[ key ] = value;

				pages.splice( index, 1, page );
				this.$set( this.settings, setting, pages );
			},
			isCollapsed: function( object ) {

				if ( undefined === object.collapsed || true === object.collapsed ) {
					return true;
				} else {
					return false;
				}

			},
			saveSettings: function() {

				var self = this;

				self.saving = true;

				jQuery.ajax({
					url: window.ajaxurl,
					type: 'POST',
					dataType: 'json',
					data: {
						action: 'jet_engine_save_settings',
						settings: self.settings,
					},
				}).done( function( response ) {

					self.saving = false;

					if ( response.success ) {
						self.$CXNotice.add( {
							message: 'Settings Saved!',
							type: 'success',
							duration: 7000,
						} );
					} else {
						self.$CXNotice.add( {
							message: response.message,
							type: 'error',
							duration: 7000,
						} );
					}

				} ).fail( function( e, textStatus ) {
					self.saving = false;
					self.$CXNotice.add( {
						message: e.statusText,
						type: 'error',
						duration: 7000,
					} );
				} );

			},
		}
	} );

})( jQuery, window.JetEngineProfileBuilder );
