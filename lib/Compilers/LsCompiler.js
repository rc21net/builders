'use strict';

var	livescript = require('livescript');
var JsCompiler = require('./JsCompiler');

var LsCompiler = {};

LsCompiler.compile = function(rawText, rawPath, options, callback) {
	var js = livescript.compile(rawText);
	JsCompiler.compile(js, rawPath, options, callback);
};

module.exports = LsCompiler;