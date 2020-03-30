( function( $ ) {

	"use strict";

	var JetEngineForms = {

		calcFields: {},

		init: function() {

			var widgets = {
				'jet-engine-booking-form.default' : JetEngineForms.widgetBookingForm,
			};

			$.each( widgets, function( widget, callback ) {
				window.elementorFrontend.hooks.addAction( 'frontend/element_ready/' + widget, callback );
			});

			$( document )
				.on( 'click.JetEngine', '.jet-form__submit.submit-type-ajax', JetEngineForms.ajaxSubmitForm )
				.on( 'submit.JetEngine', 'form.jet-form.submit-type-reload', JetEngineForms.reloadSubmitForm )
				.on( 'click.JetEngine', '.jet-form__next-page', JetEngineForms.nextFormPage )
				.on( 'click.JetEngine', '.jet-form__prev-page', JetEngineForms.prevFormPage )
				.on( 'focus.JetEngine', '.jet-form__field', JetEngineForms.clearFieldErrors )
				.on( 'change.JetEngine', '.jet-form__field', JetEngineForms.recalcFields )
				.on( 'input.JetEngine/range', '.jet-form__field.range-field', JetEngineForms.updateRangeField );

		},

		widgetBookingForm: function( $scope ) {

			var $calcFields = $scope.find( '.jet-form__calculated-field' );

			$( document ).trigger( 'jet-engine/booking-form/init' );

			JetEngineForms.initFormPager( $scope );
			JetEngineForms.initRangeFields( $scope );

			if ( ! $calcFields.length ) {
				return;
			}

			$calcFields.each( function() {

				var $this      = $( this ),
					calculated = null;

				JetEngineForms.calcFields[ $this.data( 'name' ) ] = {
					'el': $this,
					'listenTo': $this.data( 'listen_to' ),
				};

				calculated = JetEngineForms.calculateValue( $this );

				$this.find( '.jet-form__calculated-field-val' ).text( calculated.toFixed( $this.data( 'precision' ) ) );
				$this.find( '.jet-form__calculated-field-input' ).val( calculated.toFixed( $this.data( 'precision' ) ) );

			});

		},

		initFormPager: function( $scope ) {
			var $pages = $scope.find( '.jet-form-page' ),
				$form  = $scope.find( '.jet-form' );

			if ( ! $pages.length ) {
				return;
			}

			$pages.each( function() {

				var $page = $( this );

				if ( ! $page.hasClass( '.jet-form-page--hidden' ) ) {
					JetEngineForms.initSingleFormPage( $page, $form );
				}

			});

		},

		initSingleFormPage: function( $page, $form ) {

			var $button = $page.find( '.jet-form__next-page' ),
				$msg = $page.find( '.jet-form__next-page-msg' ),
				requiredFields = $page[0].querySelectorAll( '.jet-form__field[required]' ),
				disabled = false;

			if ( requiredFields.length ) {
				for ( var i = 0; i < requiredFields.length; i++) {
					var $field = $( requiredFields[ i ] );
					var val = null;

					if ( 'INPUT' === $field[0].nodeName ) {

						if ( $field.length > 1 ) {
							for( var j = 0; j < $field.length; j++ ){
								if( $field[j].checked ){
									val = $field[j].value;
								}
							}
						} else {
							val = $field.val();
						}
					}

					if ( 'SELECT' === $field[0].nodeName ) {
						val = $field.find( 'option:selected' ).val();
					}

					if ( ! val ) {
						disabled = true;
					}
				}
			}

			if ( disabled ) {

				if ( $msg.length ) {
					$msg.addClass( 'jet-form__next-page-msg--visible' );
				}

				$button.attr( 'disabled', true );
			} else {

				if ( $msg.length ) {
					$msg.removeClass( 'jet-form__next-page-msg--visible' );
				}

				$button.attr( 'disabled', false );
			}

			if ( $page.hasClass( 'jet-form-page--initialized' ) ) {
				return;
			}

			$page.on( 'change', '.jet-form__field', function() {
				JetEngineForms.initSingleFormPage( $page, $form );
			} );

			$page.addClass( 'jet-form-page--initialized' );

		},

		nextFormPage: function() {

			var $button   = $( this ),
				$fromPage = $button.closest( '.jet-form-page' ),
				$toPage   = $fromPage.next();

			JetEngineForms.switchFormPage( $fromPage, $toPage );

		},

		prevFormPage: function() {

			var $button   = $( this ),
				$fromPage = $button.closest( '.jet-form-page' ),
				$toPage   = $fromPage.prev();

			JetEngineForms.switchFormPage( $fromPage, $toPage );
		},

		switchFormPage: function( $fromPage, $toPage ) {

			var $form = $fromPage.closest( '.jet-form' );

			$fromPage.addClass( 'jet-form-page--hidden' );
			$toPage.removeClass( 'jet-form-page--hidden' );

			JetEngineForms.initSingleFormPage( $toPage, $form );

		},

		calculateValue: function( $scope ) {

			var formula  = $scope.data( 'formula' ),
				listenTo = $scope.data( 'listen_to' ),
				regexp   = /%([a-zA-Z0-9-_]+)%/g,
				func     = null;

			formula = formula.replace( regexp, function ( match1, match2 ) {

				var object = $scope.closest( 'form' ).find( '[name="' + match2 + '"], [name="' + match2 + '[]"]' ),
					val    = 0;

				if ( object.length ) {

					if ( 'INPUT' === object[0].nodeName ) {
						if ( object.length > 1 ) {

							for ( var i = 0; i < object.length; i++ ) {
								if ( object[i].checked ) {

									var itemVal = 0;

									if ( undefined !== object[i].dataset.calculate ) {
										itemVal = object[i].dataset.calculate;
									} else {
										itemVal = object[i].value;
									}

									if ( 'checkbox' === object[i].type ) {
										val += parseInt( itemVal, 10 );
									} else {
										val = itemVal;
									}

								}
							}

						} else {
							val = object.val();
						}
					}

					if ( 'SELECT' === object[0].nodeName ) {

						var selectedOption = object.find( 'option:selected' ),
							calcValue      = selectedOption.data( 'calculate' );

						if ( undefined !== calcValue ) {
							val = calcValue;
						} else {
							val = object.find( 'option:selected' ).val();
						}

					}

				}

				if ( ! val ) {
					val = '0';
				}

				val = JetEngine.filters.applyFilters( 'forms/calculated-field-value', val, object );

				return val;

			} );

			func = new Function( 'return ' + formula );

			return func();

		},

		recalcFields: function() {

			var $this      = $( this ),
				fieldName  = $this.attr( 'name' ),
				fieldPrecision = 2,
				calculated = null;

			$.each( JetEngineForms.calcFields, function( calcFieldName, field ) {

				fieldName = fieldName.replace( '[]', '' );

				if ( 0 <= $.inArray( fieldName, field.listenTo ) ) {

					calculated = JetEngineForms.calculateValue( field.el );
					fieldPrecision  = field.el.data( 'precision' );

					field.el.find( '.jet-form__calculated-field-val' ).text( calculated.toFixed( fieldPrecision ) );
					field.el.find( '.jet-form__calculated-field-input' ).val( calculated.toFixed( fieldPrecision ) ).trigger( 'change.JetEngine' );

				}

			});

		},

		initRangeFields: function( $scope ) {
			var $rangeFields = $scope.find( '.jet-form__field.range-field' );

			if ( ! $rangeFields.length ) {
				return;
			}

			$rangeFields.each( function() {
				JetEngineForms.updateRangeField( { target: $( this ), firstInit: true } );
			} );
		},

		updateRangeField: function( event ) {
			var $target = $( event.target ),
				$wrap   = $target.closest( '.jet-form__field-wrap' ),
				$number = $wrap.find( '.jet-form__field-value-number' ),
				max     = $target.attr( 'max' ) || 100,
				val     = $target.val();

			if ( event.firstInit && ! window.elementorFrontend.isEditMode() ) {
				$number.text( max ).css( 'min-width', $number.width() );
			}

			$number.text( val );
		},

		reloadSubmitForm: function( event ) {
			$( this ).find( '.jet-form__submit' ).attr( 'disabled', true );
		},

		ajaxSubmitForm: function() {

			var $this  = $( this ),
				$form  = $this.closest( '.jet-form' ),
				formID = $form.data( 'form-id' ),
				data   = {
					action: 'jet_engine_form_booking_submit',
				};

			if ( window.tinyMCE ) {
				window.tinyMCE.triggerSave();
			}

			data.values = $form.serializeArray();

			$form.addClass( 'is-loading' );
			$this.attr( 'disabled', true );

			$( '.jet-form-messages-wrap[data-form-id="' + formID + '"]' ).html( '' );
			$form.find( '.jet-form__field-error' ).remove();

			$.ajax({
				url: JetEngineSettings.ajaxurl,
				type: 'POST',
				dataType: 'json',
				data: data,
			}).done( function( response ) {

				$form.removeClass( 'is-loading' );
				$this.attr( 'disabled', false );

				switch ( response.status ) {

					case 'validation_failed':

						$.each( response.fields, function( index, fieldName ) {
							var $field = $form.find( '.jet-form__field[name="' + fieldName + '"]:last' );

							if ( $field.hasClass( 'checkradio-field' ) ) {
								$field.closest( '.jet-form__field-wrap' ).after( response.field_message );
							} else {
								$field.after( response.field_message );
							}

						});

						break;

					case 'success':

						if ( response.redirect ) {
							window.location = response.redirect;
						} else if ( response.reload ) {
							window.location.reload();
						}

						break;

				}

				$( '.jet-form-messages-wrap[data-form-id="' + formID + '"]' ).html( response.message );

			} );

		},

		clearFieldErrors: function() {

			var $this = $( this );
			$this.closest( '.jet-form-col' ).find( '.jet-form__field-error' ).remove();

		},

	};

	$( window ).on( 'elementor/frontend/init', JetEngineForms.init );

	window.JetEngineForms = JetEngineForms;

}( jQuery ) );
