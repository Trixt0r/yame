import * as path from 'path';
import * as _ from 'underscore';
import * as Backbone from 'backbone';

import { BrowserWindow } from 'electron';

import EventBus from '../common/eventbus';
import Template from '../common/template';

/**
 * A class which wraps a default electron BrowserWindow into a class.
 */
export abstract class Window extends EventBus {

    /** @type {BrowserWindow} Reference to the electron window.*/
    protected window: Electron.BrowserWindow;
    /** @type {boolean} Flag for deciding whether to reopen dev tools or not.*/
    private devToolsClosedByMe: boolean;
    private devToolsOpenedByMe: boolean;
    private devToolsAreOpen: boolean;

    constructor(protected options?: any) {
        super();
        this.options = _.extend(this.defaultOptions(), options);
        this.window = new BrowserWindow(this.options);

        this.devToolsAreOpen = false;
        this.devToolsClosedByMe = false;
        this.devToolsOpenedByMe = false

        this.getWebContents().on('will-navigate', event =>  event.preventDefault());
        this.getWebContents().on('devtools-opened', () => {
            if (!this.devToolsOpenedByMe)
                this.devToolsAreOpen = true;
            this.devToolsOpenedByMe = false;
        });
        this.getWebContents().on('devtools-closed', () => {
            if (!this.devToolsClosedByMe)
                this.devToolsAreOpen = false;
            this.devToolsClosedByMe = false;
        });
        this.getWebContents().on('did-frame-finish-load', () => {
            if (this.devToolsAreOpen) {
                this.devToolsOpenedByMe = true;
                this.devToolsClosedByMe = false;
                this.getWebContents().openDevTools();
            }
        });

        this.getWebContents().on('did-finish-load', () => this.trigger('webcontents:finish-load'));
    }

    /**
     * @readonly
     * @type {Electron.BrowserWindow} The electron browser window.
     */
    get browserWindow(): Electron.BrowserWindow {
        return this.window;
    }

    /**
     * Loads the given HTML path into this window object.
     * @param  {string | Template} arg
     * @returns {void}
     */
    load(arg: string | Template) {
        if (arg instanceof Template)
            this.window.loadURL(arg.save());
        else
            this.window.loadURL('file:///' + arg);
    }

    /**
     * @returns {Backend.Template} The template instance of this window.
     */
    abstract getTemplate(): Template;

    /**
     * Default options for creating an electron window object.
     * @returns {any}
     */
    protected abstract defaultOptions();

    /**
     * @returns {WebContents} Electron WebContents.
     */
    public getWebContents() {
        return this.window.webContents;
    }

    /**
     * Reloads this window.
     * The template gets compiled completely new.
     * @returns {void}
     */
    reload() {
        this.trigger('pre-reload');
        if (this.devToolsAreOpen) {
            this.devToolsClosedByMe = true;
            this.getWebContents().closeDevTools();
        }
        this.getTemplate().reset();
        this.load(this.getTemplate());
        this.window.focus();
        this.trigger('post-reload');
    }

}

export default Window;