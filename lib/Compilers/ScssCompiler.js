'use strict';

var	sass = require('node-sass');
var path = require('path');
var CssCompiler = require('./CssCompiler');

var ScssCompiler = {};

ScssCompiler.compile = function(rawText, rawPath, options, callback) {
	var includePaths = [path.resolve(path.dirname(rawPath))];

	sass.render({
			data: rawText,
			outputStyle: 'compressed',
			includePaths: includePaths,
			sourceMap: 'true',
			omitSourceMapUrl: true
		},
		function(err, result) {
			if (err) {
				throw err;
			}
			callback(result.css, result.map);
		});
};

module.exports = ScssCompiler;