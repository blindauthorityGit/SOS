'use strict';

(function ($) {

  if ('undefined' !== typeof acf) {
    acf.addAction('ready', function () {
      var helpLinkHTML = '<a href="https://help.artbees.net/page-options/overriding-theme-customizations-inside-the-pages" class="jupiterx-help-link jupiterx-help-link-light jupiterx-icon-question" target="_blank"></a>';
      $('.acf-fields .acf-tab-wrap').append(helpLinkHTML);
    });
  }
})(jQuery);