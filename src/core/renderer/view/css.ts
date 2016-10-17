import * as _ from 'underscore';

import EventBus from '../../common/eventbus';


/** Taken from http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element?answertab=votes#tab-top */
function css2json(css): any {
    var s = {};
    if (!css) return s;
    if (css instanceof CSSStyleDeclaration) {
        for (var i in css) {
            if ((css[i]).toLowerCase)
                s[(css[i]).toLowerCase()] = (css[css[i]]);
        }
    } else if (typeof css == 'string') {
        css = css.split('; ');
        for (var i in css) {
            var l = css[i].split(': ');
            s[l[0].toLowerCase()] = (l[1]).replace(';', '');
        }
    }
    return s;
}

/** Taken from http://stackoverflow.com/questions/754607/can-jquery-get-all-css-styles-associated-with-an-element?answertab=votes#tab-top */
function css(a): any {
    var sheets = document.styleSheets, o = {};
    for (var i in sheets) {
        var rules = (<any>sheets[i]).rules || (<any>sheets[i]).cssRules;
        for (var r in rules) {
            if (a.is(rules[r].selectorText)) {
                o = $.extend(o, css2json(rules[r].style), css2json(a.attr('style')));
            }
        }
    }
    return o;
}

/**
 * Represents the css rules of a DOM element.
 * This class enables the possibility to listen for css property changes.
 * See Css#set for more information.
 */
export class Css extends EventBus {

    private _css: any;

    constructor(initial?: string | Object) {
        super();
        this._css = {};
        if (initial)
            this.set(initial);
    }

    /**
     * Sets the internal hash of this css.
     * The `change:*` event is triggered if a property changes. The property
     * name, the new and previous values are passed as arguments to the handler.
     * In addition the `change:${propertyName}` event is triggered if the
     * respective css property changes it's value. The new and previous value
     * are passed as arguments to the handler.
     * Change events are only triggered if the style changed.
     * @param  {string | Object} css Style string or hash supported by jQuery.
     * @returns {void}
     */
    set(style: string | Object) {
        let obj;
        // If a string is passed, convert it to an object
        if (typeof style == 'string') obj = css2json(style);
        else obj = style;

        let before = _.extend({}, this._css);
        // Checks whether the given property was already in our css hash
        function wasBefore(propName: string): boolean {
            return before.hasOwnProperty(propName);
        }

        _.extend(this._css, obj);
        // Setup the event triggering for single properties
        let self = this, css = this._css;
        for (let x in css) {
            (function(propName: string) {
                let value = css[propName];
                if (!wasBefore(propName)) {
                    self.trigger('change:*', propName, value);
                    self.trigger(`change:${propName}`, value);
                }
                Object.defineProperty(css, propName, {
                    set: function(val) {
                        let prev = value;
                        if (val != prev) {
                            value = val;
                            self.trigger('change:*', propName, value, prev);
                            self.trigger(`change:${propName}`, value, prev);
                        }
                    },
                    get: function() { return value; }
                });
            }(x));
        }
    }

    /**
     * Use this property to change properties which are defined in the internal
     * css hash.
     * @returns {any} The internal css hash.
     */
    get(): any {
        return this._css;
    }
}

export default Css;