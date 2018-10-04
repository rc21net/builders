'use strict';

// lib
String = require('../String.Extension');

var AssemblerMapper = {};

AssemblerMapper.map = function(bundleType, callback) {
	var assembler;
	var bundleType = bundleType || 'default';
	var assemblerPath = '../Assemblers/' + bundleType.toLowerCase().capitalize() + 'Assembler';
	try{
		assembler = require(assemblerPath);
	}
	catch(err) {
		assembler = require('../Assemblers/DefaultAssembler');
	}
	callback(assembler);
};

module.exports = AssemblerMapper;