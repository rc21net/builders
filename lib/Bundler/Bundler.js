'use strict';

// Lib
String = require('../String.Extension');
var Bundle = require('./Bundle');

// vendors
var fs = require('fs');
var path = require('path');
var async = require('async');
var _ = require('underscore');

/**
 * Bundler
 * @constructor
 */
function Bundler() {
	//console.log('bundler');
	this.config = {};
	this.CONFIG_PATH = 'config/bundler.config.json';
	this.STARTED_AT = Date.now();
	this.needScan = false;
	this.allFilesList = [];
	this.bundleFileList = [];
}

/**
 * Static method for easy bundler running
 * @static
 */
Bundler.run = function () {
	//console.log('run');
	var bundler = new Bundler();

	async.series([
		function (callback) {
			bundler.loadConfig(callback);
		},
		function (callback) {
			if (bundler.needScan) {
				bundler.scanRootDirectories(callback);
			}
			else {
				callback();
			}
		},
		function(callback) {
			bundler.makeBundles(callback);
		}],
		function (err) {
			if(err) {
				throw err;
			}
			console.log("Done. " + (Date.now() - bundler.STARTED_AT) + "ms");
		}
	);
};

/**
 * Load (async) configuration from config.json file and command line arguments
 * @public
 * @param callbackLoadConfig
 */
Bundler.prototype.loadConfig = function (callbackLoadConfig) {
	//console.log('loadconfig');
	var bundler = this;

	async.series([
			function (callback) {
				bundler.loadConfigFromJson(callback);
			},
			function (callback) {
				bundler.loadConfigFromCommandLineArguments(callback);
			},
			function (callback) {
				bundler.validateConfig(callback);
			}
		],
		callbackLoadConfig);
};

/**
 * Load configuration from config.json file
 * @private
 * @param callbackLoadConfigFromJson
 */
Bundler.prototype.loadConfigFromJson = function (callbackLoadConfigFromJson) {
	var bundler = this;

	var configFileDate;

	async.parallel([
		function(next) {
			fs.readFile(bundler.CONFIG_PATH, function (err, data) {
				if (err) {
					throw err;
				}

				bundler.config = JSON.parse(data);

				next();
			});
		},
		function(next) {
			fs.stat(bundler.CONFIG_PATH, function(err, stat) {
				if(err) {
					throw err;
				}

				configFileDate = stat.mtime.getTime();

				next();
			});
		}
	],
	function() {
		bundler.config.defaultOptions = bundler.config.defaultOptions || {};
		bundler.config.defaultOptions.configFileDate = configFileDate;

		callbackLoadConfigFromJson();
	});


};

/**
 * Load configuration from command line arguments
 * @private
 * @param callbackLoadConfigFromCommandLineArguments
 */
Bundler.prototype.loadConfigFromCommandLineArguments = function (callbackLoadConfigFromCommandLineArguments) {
	var bundler = this;

	bundler.config.scannedRootDirectories = bundler.config.scannedRootDirectories || [];

	// Command line arguments from third (see: https://nodejs.org/api/process.html#process_process_argv)
	var commandLineArguments = process.argv.splice(2);

	commandLineArguments.forEach(function (argument) {
		// All command line options excepting scannedRootDirectories must start with '#' symbol
		if (argument.startsWith('#')) {
			var option = argument.substring(1);
			var parts = option.split(':');
			bundler.config[parts[0].toLowerCase()] = parts.length > 1 ? parts[1].toBoolOrString() : true;
		}
		// scannedRootDirectories
		else {
			if(!_.contains(bundler.config.scannedRootDirectories, argument)) {
				bundler.config.scannedRootDirectories.push(argument);
			}
		}
	});

	callbackLoadConfigFromCommandLineArguments();
};

/**
 * Validate loaded config before run bundler
 * @private
 * @param callbackValidateConfig
 */
Bundler.prototype.validateConfig = function (callbackValidateConfig) {
	var bundler = this;

	if (bundler.config.scannedRootDirectories.length) {
		this.needScan = true;
	}
	callbackValidateConfig();
};

/**
 * Scan root directories, specified in config
 * @public
 */
Bundler.prototype.scanRootDirectories = function (callbackScanRootDirectories) {
	//console.log('scanRootDirs');
	var bundler = this;

	async.each(bundler.config.scannedRootDirectories,
		function (rootDir, callback) {
			async.series([
				// Check that rootDir exists and is a directory
				function (callback) {
					fs.stat(rootDir, function(err, stats) {
						if(err) {
							callback(err)
						}
						else if(!stats.isDirectory()) {
							callback('Specified directory "' + rootDir + '" is not directory.')
						}
						else {
							callback();
						}
					});
				},
				// Scan rootDir
				function (callback) {
					bundler.getDirectoryFilesListRecursively(rootDir, callback);
				}],
				// Errors and callback
				function (err) {
					if(err) {
						throw err;
					}
					callback();
				}
			);
		},
		function() {
			// Load results
			bundler.loadBundlesConfig(callbackScanRootDirectories);
		});
};

/**
 * Get files list of directory recursively
 * @private
 * @param dir
 * @param callbackGetDirectoryFilesListRecursively
 */
Bundler.prototype.getDirectoryFilesListRecursively = function (dir, callbackGetDirectoryFilesListRecursively) {
	//console.log('getDirectoryFilesListRecursively');
	var bundler = this;

	fs.readdir(dir, function (err, list) {
		if (err) {
			throw err;
		}

		async.each(list,
			function (item, callbackEach) {
				item = dir + '/' + item;
				fs.stat(item, function (err, stats) {
					if (stats && stats.isDirectory()) {
						bundler.getDirectoryFilesListRecursively(item, function (err, subdirFilesList) {
							bundler.allFilesList = bundler.allFilesList.concat(subdirFilesList);
							callbackEach();
						});
					}
					else if(item.endsWith('.bundle')) {
						bundler.bundleFileList.push(item);
						callbackEach();
					}
					else {
						bundler.allFilesList.push(item);
						callbackEach();
					}
				});
			},
			callbackGetDirectoryFilesListRecursively
		);
	});
};

/**
 * Load data from bundle files to the bundler
 * @param callback
 */
Bundler.prototype.loadBundlesConfig = function(callback) {
	var bundler = this;

	async.each(bundler.bundleFileList,
		function(bundleFileName, callback) {
			bundler.loadBundleConfig(bundleFileName, callback)
		},
		callback
	);
};

/**
 * Load data from a bundle file to the bundler
 * @param bundleFileName
 * @param callbackLoadBundleConfig
 */
Bundler.prototype.loadBundleConfig = function (bundleFileName, callbackLoadBundleConfig) {
	//console.log('loadBundleConfig');
	var bundler = this;

	var bundleConfig = {};
	var cutBundle = path.basename(bundleFileName, '.bundle');
	var ext = path.extname(cutBundle);
	bundleConfig.name = path.basename(cutBundle, ext);
	bundleConfig.type = ext.slice(1);
	bundleConfig.path = path.dirname(bundleFileName);
	bundleConfig.options = {};

	async.parallel([
		function(next) {
			fs.readFile(bundleFileName, 'utf8', function (err, data) {
				if(err) {
					throw err;
				}
				if(!data) {
					throw 'There is no content in the bundle file ' + bundleFileName;
				}

				var lines = data.toString().stripUtfBom().replace(/\r/g, '').split('\n');

				// slice options line
				if(lines[0].startsWith('#options ')) {
					bundleConfig.options = getOptions(lines[0]);
					lines = lines.slice(1);
				}

				bundleConfig.files = [];

				// trim files and skip empty lines and comments
				lines.forEach(function(line) {
					var file = line.trim();
					if(file && !file.startsWith('#') && !file.startsWith('//')) {
						bundleConfig.files.push(file);
					}
				});

				next();
			});
		},
		function(next) {
			fs.stat(bundleFileName, function(err, stat) {
				if(err) {
					throw err;
				}

				bundleConfig.bundleFileDate = stat.mtime.getTime();

				next();
			});
		}
	],
	function() {
		bundler.config.bundles = bundler.config.bundles || [];
		bundler.config.bundles.push(bundleConfig);

		callbackLoadBundleConfig();
	});



	function getOptions(optionsLine) {
		var options = {};
		optionsLine.substring(9).split(',').forEach(function (option) {
			var parts = option.split(':');
			options[parts[0].toLowerCase()] = parts.length > 1 ? parts[1].toBoolOrString() : true;
		});
		return options;
	}
};

/**
 * Make bundles
 * @param callback
 */
Bundler.prototype.makeBundles = function(callback) {
	var bundler = this;

	async.each(bundler.config.bundles,
		function(bundleConfig, callback) {
			bundler.makeBundle(bundleConfig, callback);
		},
		callback
	);
};

/**
 * Make bundle
 * @param bundleConfig
 * @param callback
 */
Bundler.prototype.makeBundle = function(bundleConfig, callback) {
	var bundler = this;

	var bundle = new Bundle(bundleConfig, bundler.config.defaultOptions);
	bundle.make(callback);
};

module.exports = Bundler;