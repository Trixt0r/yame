import Directory from '../../../../core/renderer/view/directory';
import Accordion from '../../../../core/renderer/view/accordion';
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
export class Library extends Content {

    private _properties: View;
    private _accordion: Accordion;
    private _directory: Directory;

    constructor(options: any = {}) {
        super(options);
        this._directory = new Directory();
        this._accordion = new Accordion({ className: 'ui styled accordion' });
        this.add(this._accordion);

        this._properties = new View({ className: 'ui segment' });
        this._properties.css = 'overflow-y: auto;';
        this._properties.hide();
        this.add(this._properties);

        let group = this._accordion.create('Explorer');
        group.active = true;
        group.setTitle('Explorer');
        group.setContent(this._directory);

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

        Pubsub.on('map:parsing', (json, filePath) => this._directory.load(filePath));

        this._directory.on('select:file', payload => {
            Resource.fromPayload(payload)
                .then(resource => this.updateProperties(resource));
        });
        this.on('addedTo', () => this.updateSize());
        $(window).resize(() => this.updateSize());
    }

    updateSize() {
        // +48 because of segment padding & segment top margin
        let anchorSize = (this.anchor.$el.outerHeight(true) + 48) / window.innerHeight;
        let leftSize = 1 - anchorSize;
        let halfSize = (leftSize * .5) * 100;
        this.accordion.css = `max-height: ${halfSize}%;`;
        this._properties.css = `max-height: ${halfSize}%;`;
    }

    updateProperties(resource: Resource) {
        this._properties.empty();
        if (resource) {
            this._properties.show();
            this._properties.add(new View( {el: '<div class="ui small header">Properties</div>'}));
            this._properties.add(resource.properties);
        } else
            this._properties.hide();
    }

    /** @returns {View} The properties container for a resource. */
    get properties(): View {
        return this._properties;
    }

    /** @returns {Accordion} The accordion to append resource views. */
    get accordion(): Accordion {
        return this._accordion;
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