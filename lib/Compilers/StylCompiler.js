'use strict';

var	stylus = require('stylus');
var	nib = require('nib');
var CssCompiler = require('./CssCompiler');

var StylusCompiler = {};

StylusCompiler.compile = function(rawText, rawPath, options, callback) {
	stylus(rawText)
		.set('filename', rawPath)
		.use(nib())
		.render(function (err, css) {
			if(err) {
				throw err;
			}
			CssCompiler.compile(css, rawPath, options, callback);
		});
};

module.exports = StylusCompiler;