declare var process;

import _ = require('underscore');
import fs = require('fs');
import os = require('os');
import path = require('path');
import cheerio = require('cheerio');
var randomstring = require("randomstring");

/**
 * A class which represents a template.
 * A template can currently only be exported.
 */
export class Template {

    /** @type {Function} Function for replacing placeholders in this template. */
    private generate: Function;
    /** @type {string}  The raw template string with its original placeholders. */
    private templateString: string;
    /** @type {any} Flag for tracking whether the template has to be compiled again or not. */
    private compiled: any;
    private baseDir: string;

    constructor(public filePath: string, private _values?: Object) {
        if (process.type == 'browser') {
            this.baseDir = require('../backend').baseDir;
        } else {
            var metas = document.getElementsByTagName('meta');
            for (var i = 0;  i < metas.length; i++)
                if (metas[i].getAttribute('baseDir'))
                    this.baseDir = metas[i].getAttribute('baseDir');
        }
        this.reset();
    }

    reset() {
        try {
            this.templateString = fs.readFileSync(this.filePath).toString();
        } catch (e) {
            this.templateString = fs.readFileSync(path.resolve(this.baseDir, this.filePath)).toString();
        }
        this.generate = _.template(this.templateString);
        this.values = this._values;
        this.uncompile();
    }

    /**
     * Sets the values for this template.
     * @param  {Object} values Values to set for this template.
     * @returns {void}
     */
    set values(values: Object) {
        this.compiled = false;

        // Add default functions to a template
        var defaultValues = {
            require: require,
            url: filePath => path.resolve(this.baseDir, filePath),
            app_path: '',
            baseDir: this.baseDir,
            tpl: function(templatePath: string, values?: Object) {
                var template = new Template(path.resolve(this.baseDir, 'templates', templatePath), values);
                return template.compile();
            },
            data: {}
        };

        this._values = _.extend(defaultValues, values);
    }

    get values(): Object {
        return this._values;
    }

    /**
     * Compiles the template.
     * This means all underscore template placeholders are replaced with
     * the template's set values.
     * @returns {String} Compiled template string.
     */
    compile() {
        // Compile the template only once
        if (!this.compiled)
            this.compiled = this.generate(this.values);
        return this.compiled;
    }

    /**
     * Removes the compiled state of this template.
     * @returns {void}
     */
    uncompile() {
        this.compiled = false;
    }

    /**
     * Saves this template to disc.
     * @returns {String} The file path of the template file.
     */
    save() {
        var tmpDir = os.tmpdir();
        var tmpFile = randomstring.generate(16) + '.html';
        var tmpPath = path.resolve(tmpDir, tmpFile);
        fs.writeFileSync(tmpPath, this.compile());
        return 'file:///' + tmpPath;
    }

    /**
     * jQuery function for the DOM of this template.
     * @returns {jQuery}
     */
    $(...args): CheerioStatic {
        return cheerio.load(this.compile()).apply(cheerio, arguments);
    }
}
