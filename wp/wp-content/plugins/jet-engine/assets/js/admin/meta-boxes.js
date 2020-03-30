(function( $ ) {

	'use strict';

	var JetEngineMetaBoxes = {

		init: function() {

			var self = this;

			self.initDateFields( $( '.cx-control' ) );

			$( document ).on( 'cx-control-init', function( event, data ) {
				self.initDateFields( $( data.target ) );
			} );


		},

		/**
		 * Initialize date and time pickers
		 *
		 * @return {[type]} [description]
		 */
		initDateFields: function( $scope ) {

			$( 'input[type="date"]:not(.hasDatepicker)', $scope ).each( function() {

				var $this = $( this );

				$this.attr( 'type', 'text' );
				$this.datepicker({
					dateFormat: 'yy-mm-dd',
					nextText: '>>',
					prevText: '<<',
					beforeShow: function( input, datepicker ) {
						datepicker.dpDiv.addClass( 'jet-engine-datepicker' );
					},
				});

			} );

			$( 'input[type="time"]:not(.hasDatepicker)', $scope ).each( function() {

				var $this = $( this );

				$this.attr( 'type', 'text' );
				$this.timepicker({
					beforeShow: function( input, datepicker ) {
						datepicker.dpDiv.addClass( 'jet-engine-datepicker' );
					},
				});

			} );

		},

	};

	JetEngineMetaBoxes.init();

})( jQuery );
