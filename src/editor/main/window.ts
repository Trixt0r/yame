import * as _ from 'underscore';
import * as fs from 'fs';
import * as path from 'path';
import * as Promise from 'bluebird';
import * as Backbone from 'backbone';

import { Window as CoreWindow } from '../../core/main/window';
import Template from '../../core/common/template';

import Env from '../../core/common/environment';

import PluginManager from '../pluginManager';

export class Window extends CoreWindow {

    /** @type {Backend.Template} */
    private template: Template;

    /** @type {Backend.Template[]}  List of all sub templates */
    private subTemplates: Template[];

    /** @type {Object[]} Internal list of script tags. */
    private scripts: Object[];

    /** @type {Object[]} Internal list of styles. */
    private styles: Object[];

    constructor(private app?: string, public options?: any) {
        super(options);
        options = _.extend({}, options);

        this.app = app;
        if (!this.app) this.app = '';
        else this.app = this.app.replace('.js', '') + '.js';

        this.subTemplates = [];
        this.scripts = [];
        this.styles = [];

        this.template = new Template(path.resolve(Env.templateDir, 'editor', 'base.html'), this.templateValues());

        // Add all templates
        this.addTemplate(new Template(path.resolve(Env.templateDir, 'editor', 'side-bar.html')));
        this.addTemplate(new Template(path.resolve(Env.templateDir, 'editor', 'tools.html')));

        // Add all styles
        // Semantic ui
        this.addStyle(path.resolve(Env.nodeDir, 'semantic-ui', 'dist', 'semantic.css'));
        this.addStyle(path.resolve(Env.nodeDir, 'spectrum-colorpicker', 'spectrum.css'));
        this.addStyle(path.resolve(Env.nodeDir, 'jstree', 'dist', 'themes', 'default', 'style.css'));

        this.addScript({ body: 'require("backbone").$ = window.jQuery = window.$ = require("jquery");' });
        this.addScript({ attributes: {src: path.resolve(Env.nodeDir, 'pixi.js', 'bin', 'pixi.js')}});
        this.addScript({ attributes: {src: path.resolve(Env.nodeDir, 'semantic-ui', 'dist', 'semantic.js')}});
        this.addScript({ attributes: {src: path.resolve(Env.nodeDir, 'spectrum-colorpicker', 'spectrum.js')}});
        this.addScript({ attributes: {src: path.resolve(Env.baseDir, 'lib', 'range.js')}});

        // Custom
        let promise = this.loadCssFolder(Env.cssDir);

        if (options.load === true)
            promise.then( () => this.load(this.template));

        PluginManager.load()
            .then(() => PluginManager.run(null, this, Env, Backbone.Events));
    }

    /**
     * Loads the given css folder asynchronously and adds all css files to the
     * web contents of this window.
     *
     * @param {string} folder
     * @returns {Promise<any>}
     */
    loadCssFolder(folder: string): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            let stats = fs.lstatSync(folder);
            if (stats.isDirectory())
                fs.readdir(folder, (err, files) => {
                    if (err) return reject(err);
                    let promises = [];
                    files.forEach(file => {
                        let fileName = path.resolve(folder, file);
                        promises.push(this.loadCssFolder(fileName));
                    });
                    Promise.all(promises).then(resolve, reject);
                });
            else if (stats.isFile() && path.extname(folder) == '.css') {
                this.addStyle(folder);
                resolve();
            }
            else
                reject(new Error(`${folder} is neither a file nor a directory`));
        });
    }

    private templateValues(): any {
        return {
            app_path: this.app,
            templates: this.subTemplates,
            scripts: this.scripts,
            styles: this.styles
        };
    }

    /**
     * Default options for creating an electron window object.
     * @returns {any}
     */
    protected defaultOptions() {
        return {
            width: 1280,
            height: 720,
            autoHideMenuBar: true,
            useContentSize: true,
            webPreferences : {
                preload: path.resolve(Env.baseDir, 'app', 'editor', 'renderer', 'preload.js'),
                nodeIntegration: true
            },
            minWidth: 800,
            minHeight: 600
        }
    }

    /**
     * @inheritdoc
     */
    getTemplate(): Template {
        return this.template;
    }

    /**
     * Adds the given template to this template as a sub template.
     * @param  {Template} template
     * @returns {void}
     */
    addTemplate(template: Template) {
        this.subTemplates.push(template);
    }

    /**
     * Removes the given sub template from this template.
     * @param  {Template} template
     * @returns {Boolean} Whether the template got deleted or not.
     */
    removeTemplate(template: Template) {
        var index = this.subTemplates.indexOf(template);
        if (index >= 0) {
            this.subTemplates = this.subTemplates.slice(index, 1);
            this.template.values = this.templateValues();
            return true;
        } else return false;
    }

    /**
     * Adds a script tag to the template of this window.
     * @param  {Object} script
     * @returns {void}
     */
    addScript(script: Object) {
        this.scripts.push(script);
    }

    /**
     * Adds a style to the template of this window.
     * @param  {Object} style
     * @returns {void}
     */
    addStyle(style: Object) {
        this.styles.push(style);
    }

    reload() {
        this.subTemplates.forEach( template => template.reset());
        super.reload();
    }
}

export default Window;