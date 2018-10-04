'use strict';

var	coffee = require('coffee-script');
var JsCompiler = require('./JsCompiler');

var CoffeeCompiler = {};

CoffeeCompiler.compile = function(rawText, rawPath, options, callback) {
	var js = coffee.compile(rawText);
	JsCompiler.compile(js, rawPath, options, callback);
};

module.exports = CoffeeCompiler;