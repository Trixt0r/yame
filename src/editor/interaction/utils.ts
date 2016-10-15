import { Layer } from './../../core/scene/layer';
import * as EDITOR from '../globals';
import * as Selection from './selection';

var Pubsub = require('backbone').Events;

/**
 * Utility functions for interacting with the current selection.
 */

let copied = [];
let nextPasteIsCut = false;

/**
 * Removes the given objects from their layer and clears the them from the
 * current selection.
 * @param {any[]} [toRemove=Selection.get()]
 * @param {boolean} [clearCopy=true] Whether to clear the provided objects from
 * the previously copied object store.
 */
export function remove(toRemove: any[] = Selection.get(), clearCopy: boolean = true) {
    let selection = Selection.getSelectionContainer().selection;
    toRemove = toRemove.slice();
    Selection.clear();
    toRemove.forEach(obj => {
        EDITOR.map.layerById(obj.layer).deleteChild(obj);
        if (clearCopy) {
            let idx = copied.indexOf(obj);
            if (idx >= 0) copied.splice(idx, 1);
        }
        let idx = selection.indexOf(obj);
        if (idx >= 0) selection.splice(idx, 1);
    });
    Selection.select(selection);
    Pubsub.trigger('editor:interaction:remove', toRemove);
}

/**
 * Copies the given objects.
 * @param {any[]} [toCopy=Selection.get()]
 */
export function copy(toCopy: any[] = Selection.get()) {
    let prev = Selection.get();
    Selection.clear(true);
    copied = EDITOR.map.copyChildren(toCopy);
    Selection.select(prev, true);
    nextPasteIsCut = false;
    Pubsub.trigger('editor:interaction:copy', copied);
}

/**
 * Cuts the given objects, i.e. stores them and removes them from the their
 * parents.
 *
 * @param {any[]} [toCut=Selection.get()]
 */
export function cut(toCut: any[] = Selection.get()) {
    let prev = Selection.get();
    Selection.clear(true);
    copied =  toCut;
    Selection.select(prev, true);
    remove(toCut, false);
    nextPasteIsCut = true;
    Pubsub.trigger('editor:interaction:cut', copied);
}

/**
 * Pastes the previously copied or cut objects to the given layer.
 * @param {Layer} [target=EDITOR.map.currentLayer]
 * @param {boolean} [cut=nextPasteIsCut] Whether the previous operation was a
 * cut or not, means that after a pasted cut, the copy will be cleared.
 * @returns
 */
export function paste(target: Layer = EDITOR.map.currentLayer, cut: boolean = nextPasteIsCut) {
    if (!canPaste()) return;
    let selection = Selection.get();
    Selection.clear();
    let pasted;
    if (cut) {
        pasted = copied;
        copied = [];
    } else
        pasted = EDITOR.map.copyChildren(copied);
    target.pasteChildren(pasted);
    Selection.select(selection);
    Pubsub.trigger('editor:interaction:paste', pasted, target);
}

/**
 * Copies the given objects to the given layer.
 *
 * @param {Layer} target
 * @param {any[]} [objects=Selection.get()]
 * @returns
 */
export function copyTo(target: Layer, objects: any[] = Selection.get()) {
    if (!target || !objects.length) return;
    copy(objects);
    paste(target);
    Pubsub.trigger('editor:interaction:copyTo', target, objects);
}

/**
 * Moves the given objects to the given layer.
 * @param {Layer} target
 * @param {any[]} [objects=Selection.get()]
 * @returns
 */
export function moveTo(target: Layer, objects: any[] = Selection.get()) {
    if (!target || !objects.length) return;
    cut(objects);
    paste(target);
    Pubsub.trigger('editor:interaction:moveTo', target, objects);
}

/** @returns {boolean} Whether something can be pasted or not. */
export function canPaste(): boolean {
    return copied.length > 0;
}