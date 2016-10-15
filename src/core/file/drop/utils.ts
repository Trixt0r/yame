/**
 * Module with drag&drop utility functions.
 */

import { DropHandler } from './handler';
import { Payload } from './payload';

import * as fs from 'fs';
import * as path from 'path';
import * as _ from 'underscore';

let currentPayload: any;

function payloadsFromFilePaths(files: string[]) {
    let re = [];
    files.forEach(filePath => {
        if (fs.lstatSync(filePath).isFile())
            re.push({
                type: 'file:' + path.extname(filePath).replace('.', ''),
                content: filePath
            });
    });
    return re;
}

function filesFromDir(dirPath) {
    let tmp = fs.readdirSync(dirPath);
    let re = []
    tmp.forEach(filePath => re.push(path.resolve(dirPath, filePath)));
    return re;
}

/**
 * Helper function for getting an array of payloads from an event.
 * For the case of a file drop, the files are converted into file compatible
 * payloads, i.e. the type is the extension name prefixed with `file:`.
 * The content of a file is the absoulte path to the file.
 * @param  {Event} e
 * @returns {any[]}
 */
export function payloadsFromEvent(e): any[] {
    let re = [];
    if (currentPayload)
        re.push(currentPayload);
    else {
        // In case files have been dropped, we create file payloads
        let files = e.originalEvent.dataTransfer.files;
        let filePaths = [];
        _.each(files, (file: any) => {
            if (fs.lstatSync(file.path).isDirectory())
                filePaths = filePaths.concat(filesFromDir(file.path));
            else
                filePaths.push(file.path);
        });
        re = payloadsFromFilePaths(filePaths);
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
    currentPayload = payload;
    event.dataTransfer.setDragImage(getDragImage(), 0,0);
}

/**
 * @export Clears the current d&d payload.
 */
export function clearPayload() {
    currentPayload = void 0;
}

/**
 * Returns whether the given payload can be handled by the given drop handler.
 * @param  {DropHandler} drophandler
 * @param  {Payload} payload
 * @returns {boolean}
 */
export function supported(handler: DropHandler, payload: Payload): boolean {
    return _.find(handler.types(), type => type == payload.type) != void 0 ;
}


let defaultDragImage: Element;
let dragImage: Element;

/**
 * @export Sets the drag image. This image will be displayed as soon as the user
 * drags something around.
 * @param {Element} element
 */
export function setDragImage(element: Element) {
    if (dragImage) // Detach the current drag image
        document.body.removeChild(dragImage);
    dragImage = element;
    document.body.appendChild(dragImage);
}

/**
 * @export
 * @returns {Element} The currently set drag image.
 * Default drag image will display nothing, while dragging.
 */
export function getDragImage(): Element {
    if (!dragImage) {
        // Create a default drag image as soon as we need one.
        if (!defaultDragImage) {
            let img = $('<img></img>');
            // Make sure the image has a dimension, otherwise the browser's
            // default image will be displayed
            img.css('width', '1px').attr('src', '');
            $('body').append(img);
            defaultDragImage = img.get(0);
        }
        dragImage = defaultDragImage;
    }
    return dragImage;
}
