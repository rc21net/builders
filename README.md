# Builders

## Bundler

### bundler.config.json

    {
        "scannedRootDirectories": [
            "../css",
            "../js"
        ],
        "defaultOptions": {
            "folder": "recursive",
            "force": true,
            "forceCss": true
        },
        "bundles": [{
            "name": "main.css",
            "path": "../css",
            "options": {
                "folder": "recursive",
                "force": true
            },
            "files": [
                "/raw/jquery-1.11.1.min.js"
                "/raw/jquery-migrate-1.2.1.min.js"
                "/raw/jquery.validate.js"
                "/raw/layout.init.js"
            ]
        }]
    }

### .bundle file

    #options folder:recursive,force
    /raw/jquery-1.11.1.min.js
    /raw/jquery-migrate-1.2.1.min.js
    /raw/jquery.validate.js
    /raw/layout.init.js

The currently available options are:

  - **folder** - Used as a trigger to transform all files in the folder with this bundle file. If the `recursive` value
    is used, a seek will search recursively from this root transforming all files in all folders searched.
    When the `folder` option is used, the `nobundle` option is automatically set. When the `folder` option is used,
    listing files in the bundle file does nothing.
  - **force** - `true|false` Turn on force compilation of assets even if assets have not been modified. Default `false`.
  - **forceCss** - `true|false` Turn on force mode for css bundles. Default `false`.
    It may be useful to turn on this option because css assets (css, sass, less etc.) may include other aseets
    by `@import` rule and bundler can not watch this imported assets. May be used only as `defaultOptions`.

## Spriter

### spriter.config.json

    {
        "outputDir": 		"../images/sprites/ (required)",
        "outputDirForCss":	"/images/sprites/ (required)",
        "inputPath": 		"../images/sprites/raw/ (required)",
        "sassPath": 		"../css/raw/vars-n-mixins/_sprites.scss (required)",
        "padding":			"int (optional, default - 2)",
        "algorithm":		"binary-tree (default) | top-down | left-right | diagonal | alt-diagonal (see https://github.com/Ensighten/spritesmith#algorithms)"
    }