import { View } from '../../../core/view/abstract';
import { Input } from '../../../core/view/input';
import { Icon } from '../../../core/view/icon';
import { Accordion, Group } from '../../../core/view/accordion';
import Resources = require('../../resources');
import Tabs = require('../../../core/view/tabs');

import { Sprite } from './library/sprite';
import { Shape } from './library/shape';

import fs = require('fs');
import path = require('path');

const ipcRenderer = require('electron').ipcRenderer;

export class Library {

    public imageDropHandler: Resources.ImageDropHandler;
    public props: View;
    public accordion: Accordion;
    public sprite: Sprite;
    public shape: Shape;

    constructor(private tabMenu: Tabs.Menu) {

        var libs = new Tabs.Content(libTab);
        var libTab = tabMenu.tab('library', libs);
        libTab.$el.text('Library');

        this.accordion = new Accordion();
        this.accordion.$el.addClass('styled');
        libs.add(this.accordion);

        this.props = new View({
            className: 'ui padded grid'
        });

        libs.add(this.props);

        this.sprite = new Sprite(this);
        this.shape = new Shape(this);
    }
}
