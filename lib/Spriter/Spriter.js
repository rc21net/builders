'use strict';

// Lib
String = require('../String.Extension');
var SpriteSassMap = require('./SpriteSassMap');

// vendors
var fs = require("fs");
var path = require("path");
var spritesmith = require('spritesmith');
var SvgSpriter = require('svg-sprite');
var async = require('async');

/**
 * Spriter:
 * make sprites from images
 * @constructor
 */
function Spriter() {
    this.STARTED_AT = Date.now();
    this.CONFIG_PATH_DEFAULT = 'config/spriter.config.json';
    this.SUPPORTED_IMAGE_FORMATS = ['.png', '.jpg', '.gif', '.svg'];
    this.SUPPORTED_OUTPUT_FORMATS = ['.png', '.svg'];
    this.outputDir;
    this.outputDirForCss;
    this.inputPath;
    this.sassPath;
    this.padding;
    this.algorithm;
    this.svgMode;
    this.svgDimensionAttributes;
    this.svgLayout;
    this.dirModificationDate = {};

    this.sprites = {};
}

/**
 * Run spriter
 * @public
 */
Spriter.prototype.Run = function () {
    console.log('Spriter is starting...');

    var spriter = this;

    async.series([
            spriter.loadConfig.bind(spriter),
            spriter.readInputPath.bind(spriter),
            spriter.makeSassMap.bind(spriter)
        ],
        function (err) {
            if (err) {
                throw err;
            }
            console.log("Done. " + (Date.now() - spriter.STARTED_AT) + "ms");
        }
    );
};

/**
 * Load config and validate it
 * @param {function} callback - Callback function
 * @private
 */
Spriter.prototype.loadConfig = function (callback) {
    var spriter = this;

    fs.readFile(spriter.CONFIG_PATH_DEFAULT, function (err, data) {
        if (err) {
            throw err;
        }
        var options = JSON.parse(data);

        if (!options) {
            throw 'Error in config/spriter.confog.json';
        }
        if (!options.outputDir) {
            throw 'outputDir does not defined in config/spriter.confog.json'
        }
        if (!options.outputDirForCss) {
            throw 'outputDirForCss does not defined in config/spriter.confog.json'
        }
        if (!options.inputPath) {
            throw 'inputPath does not defined in config/spriter.confog.json'
        }
        if (!options.sassPath) {
            throw 'sassPath does not defined in config/spriter.confog.json'
        }

        // required
        spriter.outputDir = options.outputDir;
        spriter.outputDirForCss = options.outputDirForCss;
        spriter.inputPath = options.inputPath;
        spriter.sassPath = options.sassPath;

        // optional
        spriter.padding = options.padding;
        spriter.algorithm = options.algorithm;
        spriter.svgMode = options.svgMode || 'css';
        spriter.svgDimensionAttributes = options.svgDimensionAttributes;
        spriter.svgLayout = options.svgLayout;

        callback();
    });
};

/**
 * Scan input root directory
 * @param {function} readInputPathCallback - Callback function
 * @private
 */
Spriter.prototype.readInputPath = function (readInputPathCallback) {
    var spriter = this;

    console.log('reading input directory: ' + spriter.inputPath + '...');

    fs.readdir(spriter.inputPath, function (error, dirs) {
        if (error) {
            throw error;
        }
        // each dir in root input dir is one sprite
        async.each(dirs,
            function (dir, nextDir) {
                async.series([
                        function (next) {
                            spriter.checkInput(dir, next);
                        }],
                    function (isNeedToMake) {
                        if (isNeedToMake) {
                            spriter.readSpritePath(dir, nextDir);
                        }
                        else {
                            console.log('skip sprite directory: ' + dir);
                            nextDir();
                        }
                    }
                );
            },

            // callback: after all dir processed
            readInputPathCallback
        );
    });
};

/**
 * Scan single sprite directory
 * @param {string} dir - Scanned sprite directory
 * @param {function} callback - Callback function
 */
Spriter.prototype.readSpritePath = function (dir, callback) {
    var spriter = this;

    console.log('reading sprite directory: ' + dir + '...');

    var dirPath = spriter.inputPath + dir;

    fs.readdir(dirPath, function (err, files) {
        if (err) {
            throw err;
        }

        var src = [];
        var svgSrc = [];
        files.forEach(function (file) {
            var filePath = dirPath + '/' + file;
            if (file && fs.lstatSync(filePath).isFile() && file.endsWithAny(spriter.SUPPORTED_IMAGE_FORMATS)) {
                if (file.endsWith('.svg')) {
                    svgSrc.push(filePath);
                }
                else {
                    src.push(filePath);
                }
            }
        });

        if (src.length > 0) {
            spriter.makeSprite(src, dir, callback);
        }

        if (svgSrc.length > 0) {
            spriter.makeSvgSprite(svgSrc, dir, callback);
        }
    });
};

/**
 * Check if sprite has been modified
 * @param dir
 * @param checkInputCallback
 */
Spriter.prototype.checkInput = function (dir, checkInputCallback) {
    var spriter = this;

    async.parallel({

            // check input dir
            input: function (next) {
                var dirPath = spriter.inputPath + dir;
                fs.stat(dirPath, function (error, stat) {
                    if (error) {
                        throw error;
                    }

                    if (stat.isDirectory()) {
                        // if input dir is a directory => compare it date with output
                        spriter.dirModificationDate[dir] = stat.mtime.getTime();
                        next(null, stat.mtime.getTime());
                    }
                    else {
                        // if input isn't a directory => don't make sprite
                        next('skip');
                    }
                });
            },

            // check output file
            // TODO: skipping goes to wrong sass map
            /*output: function(next){

             // check every possible output sprite name
             async.each(spriter.SUPPORTED_OUTPUT_FORMATS,
             function(format, nextFormatOrSkip){
             var output = spriter.outputDir + dir + format;

             fs.stat(output, function(error, stat){
             if(error) {
             // output file doesn't exist => check next format
             nextFormatOrSkip();
             }
             else {
             // if output file exists we don't need check other formats
             nextFormatOrSkip(stat.mtime.getTime());
             }
             });
             },

             // after checking SUPPORTED_OUTPUT_FORMATS
             function(outputMTime) {
             next(null, outputMTime);
             }
             );
             }*/
        },

        // decide to make sprite or not
        function (skip, results) {

            // if previous step have said skip
            // or
            // output exists and it older than input
            // => don't make sprite
            if (skip /*|| (results.output && results.output > results.input)*/) {
                checkInputCallback(false);
            }
            // in other cases => make sprite
            else {
                checkInputCallback(true);
            }
        }
    );
};

/**
 * Make sprite from source files (png, jpg, gif)
 * @param {string[]} src - Array of source files paths
 * @param {string} dir - Directory name
 * @param {function} callback - Callback function
 */
Spriter.prototype.makeSprite = function (src, dir, callback) {
    var spriter = this;

    spritesmith.run(
        {
            src: src,
            padding: typeof(spriter.padding) != 'undefined' ? spriter.padding : 2,
            algorithm: spriter.algorithm || 'binary-tree',
            sort: false
        },
        function (err, result) {
            if (err) {
                throw err;
            }

            var output = spriter.outputDir + dir + '.png';
            fs.writeFile(output, result.image, 'binary', function (err) {
                if (err) {
                    throw err;
                }
                console.log('File ' + output + ' has been successfully written.');
            });

            spriter.sprites[dir] = {
                path: spriter.outputDirForCss + dir + '.png',
                hash: spriter.dirModificationDate[dir],
                width: result.properties.width,
                height: result.properties.height,
                items: {}
            };

            //console.log(result);

            for (var key in result.coordinates) {
                var newKey = path.parse(key).name;
                if (!newKey) {
                    throw 'Can not get file name for path ' + key;
                }
                spriter.sprites[dir].items[newKey] = result.coordinates[key];
            }
            callback();
        }
    );
};

/**
 * Make sprite from source files (svg)
 * @param {string[]} svgSrc - Array of source files paths
 * @param {string} dir - Directory name
 * @param {function} callback - Callback function
 */
Spriter.prototype.makeSvgSprite = function (svgSrc, dir, callback) {
    var spriter = this;

    var modeConfig = {};

    // общие настройки для всех режимов
    modeConfig[spriter.svgMode] = {
        dest: spriter.outputDir, // output directory
        sprite: dir + '.svg', // sprite file name
        bust: false, // include/exclude cache string in file name
        render: {
            scss: false
        }
    };

    switch (spriter.svgMode) {
        case 'css':
        case 'view':
            modeConfig[spriter.svgMode].layout = spriter.svgLayout || 'packed'; // TODO: попробовать diagonal вместо отступов
    }

    /*
     При позиционированиии с помощью css свойства background-position, если у SVG-спрайта для корневого элемента
     заданы аттрибуты width и height браузер считает размеры спрайта равными
     значениям этих атрибутов, background-size в этом случае можно не указывать (как в случае с png спрайтом). Если эти
     аттрибуты не заданы, браузер не может корректно определить размеры спрайта. При использовании такого спрайта в
     качестве background его размеры высчитываются исходя из значения параметра background-size; если параметр не задан
     в явном виде, размер высчитывается так, как если бы он был установлен в contain, т.е. спрайт масштабируется под
     меньшую из сторон.
     НО:
     При позиционировании с помощью view, если у корневого svg-элемента заданы аттрибуты width и height FF и IE искажают изображение.
     */
    var dimensionAttributes = typeof(spriter.svgDimensionAttributes) != 'undefined'
        ? spriter.svgDimensionAttributes : spriter.svgMode == 'css';

    var settings = {
        shape: {
            transform: [ // svg optimisation options
                {
                    // https://github.com/jkphl/svg-sprite/blob/master/docs/configuration.md#shape-transformations
                    // https://github.com/svg/svgo/blob/master/README.ru.md
                    svgo: {
                        multipass: true,
                        plugins: [
                            {removeTitle: true},
                            {removeDimensions: true},
                            {removeAttrs:
                                {attrs: ['data-name', 'g:id', 'path:id']}
                            },
                            //{removeStyleElement: true}
                            //{removeXMLNS: true} // почему-то неправильно именует классы
                        ]
                    }
                }
            ],
            // со спейсингом размеры вычислять сложнее
            spacing: {
                padding: typeof(spriter.padding) != 'undefined' ? spriter.padding : 0, // padding around item
            }
        },
        // output svg
        // https://github.com/jkphl/svg-sprite/blob/master/docs/configuration.md#sprite-svg-options
        svg: {
            xmlDeclaration: false, // TODO: проверить фрагмент в iPhone с декларациями
            doctypeDeclaration: false, // TODO: проверить фрагмент в iPhone с декларациями
            //namespaceIDs: false, // по умолчанию добавляет уникальные неймспейсы ко всем id, чтоб они остались уникальными
            //namespaceClassnames: false, //тоже самое для классов, если в исходниках есть стили для классов - с false отваливаются
            dimensionAttributes: dimensionAttributes // remove width/height attr of root svg
        },
        mode: modeConfig
    };

    var svgSpriter = new SvgSpriter(settings);

    svgSrc.forEach(function (file) {
        var name = path.parse(file).base;
        var absolutePath = path.resolve(file);
        svgSpriter.add(absolutePath, name, fs.readFileSync(file, {encoding: 'utf-8'}));
    });

    svgSpriter.compile(function (error, result, data) {
        if (error) {
            throw error;
        }

        //console.log(result);
        //console.log(data[MODE]);

        var sprite = result[spriter.svgMode].sprite;

        // write sprite file
        fs.writeFile(sprite.path, sprite.contents, 'binary', function (err) {
            if (err) {
                throw err;
            }
            console.log('File ' + sprite.path + ' has been successfully written.');
        });

        spriter.sprites[dir] = {
            path: spriter.outputDirForCss + dir + '.svg',
            hash: spriter.dirModificationDate[dir],
            width: data[spriter.svgMode].spriteWidth,
            height: data[spriter.svgMode].spriteHeight,
            items: {}
        };


        data[spriter.svgMode].shapes.forEach(function (shape) {
            if (!shape.name) {
                throw 'SVG shape does not contain name';
            }
            spriter.sprites[dir].items[shape.name] = {
                // в некоторых режимах position может не быть
                x: shape.position ? shape.position.absolute.x * (-1) : 0, // invert sighn for backward compatibility with png mode
                y: shape.position ? shape.position.absolute.y * (-1): 0, // invert sighn for backward compatibility with png mode
                width: shape.width.outer,
                height: shape.height.outer
            };
        });

        callback();
    });
};

/**
 * Make Sass map for sprites
 * @param {function} callback - Callback function
 */
Spriter.prototype.makeSassMap = function (callback) {
    var spriter = this;

    console.log('Making sass map...');

    var sassMap = new SpriteSassMap(spriter.sprites, 'sprites').toString();
    fs.writeFile(spriter.sassPath, sassMap, function (err) {
        if (err) {
            throw err;
        }
        console.log('File ' + spriter.sassPath + ' has been successfully written.');
        console.log('Spriter has finished!');
        callback();
    });
};

module.exports = Spriter;