'use strict';

// lib
var Asset = require('./Asset');
var AssemblerMapper = require('./AssemblerMapper');

// vendors
var async = require('async');
var path = require('path');
var fs = require('fs');

/**
 * Abstract bundle
 * @param bundleConfig
 * @param defaultOptions
 * @constructor
 */
function Bundle(bundleConfig, defaultOptions) {
		for (var property in bundleConfig) {
		if (bundleConfig.hasOwnProperty(property)) {
			this[property] = bundleConfig[property];
		}
	}
	this.defaultOptions = defaultOptions;

	this.assets = [];
	this.content;
	this.outputFileName;
	this.outputFileDate;
	this.isModified;

	this.assembler;
}

/**
 * Make outputs from bundle
 * @param callbackMake
 */
Bundle.prototype.make = function(callbackMake) {
	var bundle = this;

	async.series([
			function(next) {
				bundle.checkBundleModification(next);
			},
			function(next) {
				bundle.compileAssets(next);
			},
			function(next) {
				bundle.getAssembler(next);
			},
			function(next) {
				bundle.assemble(next);
			},
			function(next) {
				bundle.save(next);
			}
		],
		function(err) {
			if(err && err != 'skip') {
				throw err;
			}
			callbackMake();
		});
};

/**
 * Check has bundle modified or not
 * @param calllbackCheckBundleModification
 */
Bundle.prototype.checkBundleModification = function(calllbackCheckBundleModification) {
	var bundle = this;
	bundle.getBundleFileName();

	async.series([
		function(next) {
			var forceMode = bundle.defaultOptions.force ||
				(bundle.type == 'css' && bundle.defaultOptions.forceCss) ||
				bundle.options.force;

			if(forceMode) {
				next('compile');
			}
			else {
				next();
			}
		},
		// check does output file exist and its modification date
		function(next) {
			fs.stat(bundle.outputFileName, function(err, stat) {
				if(err) {
					// output file doesn't exist, so skip next ckecking steps and go to compilation
					next(err);
				}
				else {
					bundle.outputFileDate = stat.mtime.getTime();
					// config file or bundle file has been modified after output file has been done, so go to compilation
					if(	bundle.outputFileDate < bundle.defaultOptions.configFileDate ||
						bundle.outputFileDate < bundle.bundleFileDate)
					{
						next('compile');
					}
					else {
						next();
					}
				}
			});
		},
		// check has raw file modified after output file has done
		function(next) {
			async.each(bundle.files,
				function(relativeFilePath, callback) {
					var filePath = path.join(bundle.path, relativeFilePath);
					fs.stat(filePath, function(err, stat) {
						if(err) {
							// it's really error, files in the bundle must exist
							throw err;
						}
						var rawFileMtime = stat.mtime.getTime();
						if( rawFileMtime > bundle.outputFileDate) {
							// raw file has been modified after output file has been done,
							// so skip other raw files checking and go to compilation
							callback('compile');
						}
						else {
							callback();
						}
					});
			},
			function(err) {
				if(err) {
					next(err);
				}
				else {
					next();
				}
			});
		}
	],
	function(err) {
		if(err) {
			// if err is passed bundle has modified or is a new one, so compile
			bundle.isModified = true;
			calllbackCheckBundleModification();
		}
		else {
			// bundle hasn't mofified, so skip compilation
			bundle.isModified = false;
			calllbackCheckBundleModification('skip');
		}
	});
};

Bundle.prototype.compileAssets = function(callbackCompileAssets) {
	var bundle = this;

	// TODO: async.each runs in parallel so break bundle.files order, check perfomance for eachSeries and replace for array sort
	async.eachSeries(bundle.files,
		function(relativeFilePath, callback) {
			var filePath = path.join(bundle.path, relativeFilePath);

			var asset = new Asset(filePath, bundle.name);
			asset.compile(function() {
				bundle.assets.push(asset);
				callback();
			});
		},
		callbackCompileAssets
	);
};

Bundle.prototype.getAssembler = function(callbackGetAssembler) {
	var bundle = this;

	AssemblerMapper.map(bundle.type, function(assembler) {
		bundle.assembler = assembler;
		callbackGetAssembler();
	});
};

Bundle.prototype.assemble = function(callbackAssemble) {
	var bundle = this;

	var assembler = bundle.assembler;
	bundle.assembly = assembler.assemble(bundle.assets);
	callbackAssemble();
};

Bundle.prototype.save = function(callbackSave) {
	var bundle = this;

	fs.writeFile(bundle.outputFileName, bundle.assembly.code, function(err) {
		if(err) {
			throw err;
		}
		console.log(bundle.outputFileName + ' has been written successfully.')
		callbackSave();
	});
};

Bundle.prototype.getBundleFileName = function() {
	var bundle = this;

	var minSufix = '.min';
	var name = bundle.name + minSufix + '.' + bundle.type;
	bundle.outputFileName = path.join(bundle.path, name);
};



function scanFolder() {
	if (options.folder) {
		// options.nobundle = true; // TODO: why?
		var recursive = options.folder === 'recursive';
		var lines = allFiles.map(function jsMatches(fileName) {
			if (!fileName.startsWith(bundleDir)) return '#'; // skip files from another folder
			if (!fileName.endsWithAny(['.js', '.coffee', '.ls', '.ts'])) return '#'; // skip not js files
			if (fileName.endsWithAny(['.min.js'])) return '#'; // skip min files // TODO: why?
			if (!recursive && (path.dirname(fileName) !== bundleDir)) return '#'; //skip subfolder if recursive = false

			if (!fileName.endsWithAny(['.css', '.less', '.sass', '.scss', '.styl'])) return '#';
			if (fileName.endsWithAny(['.min.css'])) return '#';
			if (fileName.match(/_[^/]+\.s[ca]ss$/)) return '#';

			return fileName.substring(bundleDir.length + 1);
		});
	}
	processJsBundle(options, jsBundle, bundleDir, lines, bundleName, nextBundle);
	//processCssBundle(options, cssBundle, bundleDir, cssFiles, bundleName, nextBundle);
}


module.exports = Bundle;