'use strict';

var	less = require('less');
var path = require('path');
var CssCompiler = require('./CssCompiler');

var LessCompiler = {};

LessCompiler.compile = function(rawText, rawPath, options, callback) {
	var lessDir = path.dirname(rawPath);
	var fileName = path.basename(rawPath);
	var options = {
			paths: ['.', lessDir],
			filename: fileName
		};

	less.render(rawText, options, function (err, css) {
		if (err) {
			throw err;
		}
		CssCompiler.compile(css, rawPath, options, callback);
	});
};

module.exports = LessCompiler;