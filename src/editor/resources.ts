import { View } from '../core/view/abstract';
import { Factory, FactoryCollection } from '../core/factory';

import _ = require('underscore');
import path = require('path');

/**
 * Interface for dropping a file into an area of the editor.
 */
export interface DropHandler {
    /**
     * File types this handler supports.
     * Example: ['file:txt', 'file:json', 'object:shape'];
     * @returns {string[]}
     */
    types(): string[];

    /**
     * Method which gets executed on a file drop.
     * @param  {Payload} payload
     * @param  {Event} e
     * @returns {any}
     */
    process(payload: Payload, e: Event): any;

    /**
     * Method which gets executed on a entered file drag.
     * @param  {Payload} payload
     * @param  {Event} e
     * @returns {any}
     */
    enter(payload: Payload, e: Event): any;


    /**
     * Method which gets executed on if a file drag ended.
     * @param  {Payload} payload
     * @param  {Event} e
     * @returns {any}
     */
    leave(payload: Payload, e: Event): any;
}

/**
 * Dropable payload interface.
 */
export interface Payload {
    /**
     * @type {string} The type of this payload.
     */
    type: string;

    /**
     * @type {any} The content of the payload.
     */
    content: any;
}

export class SimpleDropHandler {

    handlers: Function[];
    enterers: Function[];
    leavers: Function[];
    private _types: string[] = [];

    constructor() {
        this.handlers = [];
        this.enterers = [];
        this.leavers = [];
    }

    setTypes(types: string[]) {
        this._types = types;
    }

    types() {
        return this._types;
    }

    process(payload: Payload, e) {
        _.each(this.handlers, handle => handle.call(null, payload, e));
    }

    enter(payload: Payload, e) {
        this.enterers.forEach(handle => handle.call(null, payload, e));
    }

    leave(payload: Payload, e) {
        this.leavers.forEach(handle => handle.call(null, payload, e));
    }

    registerHandler(handler: Function) {
        this.handlers.push(handler);
    }

    registerEnter(handler: Function) {
        this.enterers.push(handler);
    }

    registerLeave(handler: Function) {
        this.leavers.push(handler);
    }

    clearHandler(): void {
        this.handlers = [];
    }

    clearEnter(): void {
        this.enterers = [];
    }

    clearLeave(): void {
        this.leavers = [];
    }
}

/**
 * Default Drophandler for images.
 */
export class ImageDropHandler extends SimpleDropHandler {
    constructor() {
        super();
        this.setTypes(['file:png', 'file:']);
    }
}

/**
 * Defines a file.
 */
export class File {
    lastModified: number;
    name: string;
    path: string;
    size: number;
    type: string;
}

/**
 * Helper function for getting an array of files from an event.
 * @param  {Event} e
 * @returns {any[]}
 */
function payloadsFromEvent(e): any[] {
    var re = [];
    var payloadJSON = e.originalEvent.dataTransfer.getData('payload');
    if (payloadJSON) {
        try {
            var payload = JSON.parse(payloadJSON);
            re.push(payload);
        } catch (e) { }
    } else {
        var files = e.originalEvent.dataTransfer.files;
        _.each(files, (file: any) => re.push({
            type: 'file:' + path.extname(file.path).replace('.', ''),
            content: file.path
        }));
    }
    return re;
}

/**
 * Sets the payload in the given event.
 * @param  {Event} event
 * @param  {string} type
 * @param  {any}    content
 * @returns {void}
 */
export function setPayload(event, type: string, content: any) {
    if (event.originalEvent)
        event = event.originalEvent;
    var payload = {
        type: type,
        content: content
    };
    var json = JSON.stringify(payload);
    event.dataTransfer.setData('payload', json);
}

/**
 * Register a DropHandler on the given element.
 * @param  {JQuery}          $el
 * @param  {DropHandler} handler
 * @returns {void}
 */
export function registerFileDrop($el: JQuery, handler: DropHandler): void {

    function supported(payload: Payload) {
        if (_.find(handler.types(), type => type == payload.type))
            return true;
        else
            return false;
    }
    function delegate(payload: Payload, e, fnName: string) {
        if (supported(payload))
            handler[fnName].call(handler, payload, e);
    }

    $el.bind('dragover', e => e.preventDefault());
    $el.bind('dragenter', e => {
        payloadsFromEvent(e).forEach(payload => delegate(payload, e, 'enter'));
        e.preventDefault();
    });

    $el.bind('dragleave', e => payloadsFromEvent(e).forEach(payload => delegate(payload, e, 'leave')));

    $el.bind('drop', e => payloadsFromEvent(e).forEach(payload => delegate(payload, e, 'process')));
}

/**
 * Register a DropHandler on the given view.
 * @param  {View} view
 * @param  {DropHandler} handler
 * @returns {void}
 */
export function registerFileDropView(view: View, handler: DropHandler): void {
    view.once('done:render', () => registerFileDrop(view.$el, handler));
}

var typeFactories = new FactoryCollection();

export function setFactoryForType<T>(typeName: string, factory: Factory<T>) {
    typeFactories.add(typeName, factory);
}

/**
 * Creates an instance for the given type with the given arguments.
 * @type {string}
 */
export function createFromType<T>(typeName: string, ...args): T {
    var factory = typeFactories.get(typeName);
    if (factory)
        return <T>factory.getInstance(args);
    else
        throw new Error(`No factory defined for "${typeName}"`);
}
