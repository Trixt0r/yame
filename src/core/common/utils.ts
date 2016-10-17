import * as fs from 'fs';

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
    let res = pattern.test(str);
    if (res)
        return res;
    else
        try {
            fs.accessSync(str);
            return true;
        } catch (e) {
            return false;
        }
}