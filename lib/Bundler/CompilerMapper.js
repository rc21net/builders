'use strict';

// lib
String = require('../String.Extension');

var CompilerMapper = {};

CompilerMapper.map = function(fileExtension, callback) {
	var compilerPath = '../Compilers/' + fileExtension.toLowerCase().capitalize() + 'Compiler';
	var compiler = require(compilerPath);
	callback(compiler);
};

module.exports = CompilerMapper;