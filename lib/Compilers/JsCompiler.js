'use strict';

var UglifyJS = require("uglify-js");

var JsCompiler = {};

JsCompiler.compile = function(rawText, rawPath, options, callback) {
	var result = UglifyJS.minify(rawText, {fromString: true});
	callback(result.code);
};

module.exports = JsCompiler;