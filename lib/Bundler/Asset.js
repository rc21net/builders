'use strict';

// lib
String = require('../String.Extension');
var CompilerMapper = require('./CompilerMapper');

// vendors
var fs = require('fs');
var path = require("path");
var async = require('async');

/**
 * Asset
 * @param filePath
 * @constructor
 */
function Asset(filePath, bundleName) { // TODO: bundleName needs only for error reporting, catch error on Bundle.js
	this.rawFilePath = filePath;
	this.bundleName = bundleName;
	this.rawFileText;
	this.compiler;
	this.compiledText;
	this.sourceMap;
}

/**
 * Compile asset
 * @param callback
 */
Asset.prototype.compile = function(callback) {
	var asset = this;

	async.series([
		function(next) {
			asset.readRawFile(next)
		},
		function(next) {
			asset.getCompiler(next);
		},
		function(next) {
			asset.applyCompiler(next);
		}
	],
		callback
	);
};

/**
 * Read asset file
 * @param callback
 */
Asset.prototype.readRawFile = function(callback) {
	var asset = this;
	fs.readFile(asset.rawFilePath, 'utf8', function(err, data) {
		if (err) {
			throw 'ERROR when reading file ' + asset.rawFilePath + ' from bundle ' + asset.bundleName + ':\n' + err;
		}
		if (!data) {
			throw 'There is no content in the asset file ' + asset.rawFilePath;
		}

		asset.rawFileText = data.toString().stripUtfBom();
		callback();
	});
};

/**
 * Get compiler for current asset by extension
 * @param callback
 */
Asset.prototype.getCompiler = function(callback) {
	var asset = this;
	var fileExtension = path.extname(asset.rawFilePath).slice(1);
	CompilerMapper.map(fileExtension, function(compiler) {
		asset.compiler = compiler;
		callback();
	});
};

/**
 * Call compiler compile()
 * @param callback
 */
Asset.prototype.applyCompiler = function(callback) {
	var asset = this;
	if(asset.compiler) {
		asset.compiler.compile(asset.rawFileText, asset.rawFilePath, null, function(compiledText, sourceMap) {
			asset.compiledText = compiledText;
			asset.sourceMap = sourceMap;
			callback();
		});
	}
	else {
		throw 'Unsupported file format';
	}
};

module.exports = Asset;