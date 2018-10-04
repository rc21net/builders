'use strict';

var	CleanCss = require('clean-css');
var path = require("path");

var CssCompiler = {};

CssCompiler.compile = function(rawText, rawPath, options, callback) {

	var cleanCssOptions = options || {};

	//cleanCssOptions.target = path.resolve(rawPath);
	cleanCssOptions.relativeTo = path.resolve(path.dirname(rawPath));
	cleanCssOptions.advanced = cleanCssOptions.advanced || false;
	cleanCssOptions.aggressiveMerging = cleanCssOptions.aggressiveMerging || false;
	cleanCssOptions.restructuring = cleanCssOptions.restructuring || false;
	cleanCssOptions.keepSpecialComments = cleanCssOptions.keepSpecialComments || 0;

	callback(new CleanCss(cleanCssOptions).minify(rawText).styles);
};

module.exports = CssCompiler;