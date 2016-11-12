import { EventBus } from './eventbus';
import * as fs from 'fs';
import * as path from 'path';

const isValid = require('is-valid-path');

/**
 * @param {string} str
 * @returns {boolean} Whether the given string is an url or not.
 */
export function isURL(str: string): boolean {
    let pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
    '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.?)+[a-z]{2,}|'+ // domain name
    '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
    '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
    '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
    '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    return pattern.test(str);
}

/**
 * @param {string} str
 * @returns {boolean} Whether the given string is a path or not.
 */
export function isPath(str: string): boolean {
    return isValid(str);
}

/**
 * @export
 * @param {string} str
 * @returns {boolean} Whether the given string is an url or path.
 */
export function isPathOrUrl(str: string): boolean {
    return isPath(str) || isURL(str);
}


/**
 * Calculates the distance between the two points.
 *
 * @export
 * @param {PIXI.Point} p1
 * @param {PIXI.Point} p2
 * @returns {number}
 */
export function distance(p1: PIXI.Point, p2: PIXI.Point): number {
    let diff = new PIXI.Point(p2.x - p1.x, p2.y - p1.y);
    return Math.sqrt(diff.x * diff.x + diff.y * diff.y);
}

/**
 * Calculates the interpolated value between `a` and `b` based on `f`, i.e. the
 * lerp function.
 *
 * @param {number} a Start value.
 * @param {number} b End value.
 * @param {number} f The step between 0 and 1.
 * @returns {number} The interpolated value
 */
function lerp(a: number, b: number, f: number): number {
    return (a * (1 - f)) + (b * f);
}