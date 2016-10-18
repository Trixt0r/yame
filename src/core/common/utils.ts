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