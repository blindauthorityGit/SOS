this.wc=this.wc||{},this.wc.wcBlocksRegistry=function(t){var n={};function e(o){if(n[o])return n[o].exports;var r=n[o]={i:o,l:!1,exports:{}};return t[o].call(r.exports,r,r.exports,e),r.l=!0,r.exports}return e.m=t,e.c=n,e.d=function(t,n,o){e.o(t,n)||Object.defineProperty(t,n,{enumerable:!0,get:o})},e.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},e.t=function(t,n){if(1&n&&(t=e(t)),8&n)return t;if(4&n&&"object"==typeof t&&t&&t.__esModule)return t;var o=Object.create(null);if(e.r(o),Object.defineProperty(o,"default",{enumerable:!0,value:t}),2&n&&"string"!=typeof t)for(var r in t)e.d(o,r,function(n){return t[n]}.bind(null,r));return o},e.n=function(t){var n=t&&t.__esModule?function(){return t.default}:function(){return t};return e.d(n,"a",n),n},e.o=function(t,n){return Object.prototype.hasOwnProperty.call(t,n)},e.p="",e(e.s=21)}({21:function(t,n,e){"use strict";e.r(n);var o=e(4),r=e.n(o),u={};function c(t){return"object"===r()(u[t])&&Object.keys(u[t]).length>0?u[t]:{}}var i=function(t,n,e){if(r()(t[n])!==e)throw new Error("Incorrect value for the ".concat(n," argument when registering an inner block. It must be a ").concat(e,"."))};function f(t){i(t,"main","string"),i(t,"blockName","string"),i(t,"component","function");var n=t.main,e=t.blockName,o=t.component;u[n]||(u[n]={}),u[n][e]=o}e.d(n,"getRegisteredInnerBlocks",(function(){return c})),e.d(n,"registerInnerBlock",(function(){return f}))},4:function(t,n){function e(t){return(e="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function o(n){return"function"==typeof Symbol&&"symbol"===e(Symbol.iterator)?t.exports=o=function(t){return e(t)}:t.exports=o=function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":e(t)},o(n)}t.exports=o}});
