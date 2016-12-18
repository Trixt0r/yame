import Directory from '../../../../core/renderer/view/directory';
import { default as Accordion, Group } from '../../../../core/renderer/view/accordion';
import View from '../../../../core/renderer/view/abstract';
import Button from '../../../../core/renderer/view/button';
import { Content } from '../../../../core/renderer/view/tabs';
import { ResourcesView } from './library/resources';

import { Resource } from '../../entity/resource';
import { Resources } from '../../entity/resources';

import {ipcRenderer} from 'electron';

import * as _ from 'underscore';

const Pubsub = require('backbone').Events;

/**
 * A view for exploring the project directory.
 */
export class Library extends Accordion {

    private _properties: Accordion;
    private _directory: Directory;
    private propertiesGroup: Group;

    constructor(options: any = {}) {
        super(_.extend({ className: 'ui styled accordion' }, options));
        this._directory = new Directory();
        this._properties = new Accordion({ className: 'ui styled accordion' });

        this.propertiesGroup = this._properties.create('Properties');
        this.propertiesGroup.active = true;
        this.propertiesGroup.setTitle('Properties');

        var grid = new View({className: 'ui grid'});
        var left = new View({ className: 'eight wide column' });
        var right = new View({ className: 'eight wide column' });
        grid.add([left, right]);
        left.add(this._directory);
        right.add(this._properties);

        let group = this.create('Explorer');
        group.active = true;
        group.setTitle('Explorer');
        group.setContent(grid);

        let btn = new Button({className: 'ui button fluid'});
        btn.add(new View({el: '<p>Open folder</p>'}))
        group.addContent(btn);
        this._directory.on('scan:done', () => group.content.delete(btn));
        btn.on('click', () => {
            let id = _.uniqueId('opendir');
            ipcRenderer.send('showOpenDialog', { properties: ['openDirectory']}, id );
            ipcRenderer.on(`showOpenDialog:${id}`, (event, files: string[]) => {
                if (files)
                    this._directory.load(files[0]);
            });
        });

        Pubsub.on('map:parsing', (json, options) => this._directory.load(options.parentPath));

        this._directory.on('select:file', payload => {
            Resource.fromPayload(payload)
                .then(resource => this.updateProperties(resource));
        });
        this.on('addedTo', () => this.updateSize());
        $(window).resize(() => this.updateSize());
        this._properties.hide();
    }

    updateSize() {
        // +48 because of segment padding & segment top margin
        // let anchorSize = (this.anchor.$el.outerHeight(true) + 48) / window.innerHeight;
        // let leftSize = 1 - anchorSize;
        // let halfSize = (leftSize * .5) * 100;
        // this.accordion.css = `max-height: ${halfSize}%;`;
        // this._properties.css = `max-height: ${halfSize}%;`;
    }

    updateProperties(resource: Resource) {
        this.propertiesGroup.content.empty();
        if (resource) {
            this._properties.show();
            this.propertiesGroup.setContent(resource.properties);
        } else {
            this._properties.hide();
            this.propertiesGroup.content.empty();
        }
    }

    /** @returns {View} The properties container for a resource. */
    get properties(): Accordion {
        return this._properties;
    }

    /**
     * @readonly
     * @type {Directory} The directory view of the library.
     */
    get directory(): Directory {
        return this._directory;
    }
}

export default Library;