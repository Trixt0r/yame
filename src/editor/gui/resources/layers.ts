import { Dropdown } from './../../../core/view/dropdown';
import { Icon } from './../../../core/view/icon';
import EDITOR from './../../globals';
import { Button } from '../../../core/view/button';
import { Tree } from './../../../core/view/tree';
import { View } from '../../../core/view/abstract';
import { Accordion, SubAccordion } from '../../../core/view/accordion';
import { Input } from '../../../core/view/input';
import { Editable } from '../../../core/editable';
import { Map } from '../../../core/scene/map';
import { Layer } from '../../../core/scene/layer';


import { LayerControl } from './layers/layer';
import { Properties } from './layers/properties';

import Selection = require('../../interaction/selection');
import Utils = require('../../interaction/utils');
import Tabs = require('../../../core/view/tabs');

import * as path from 'path';
import * as _ from 'underscore';

var keyboardjs = require('keyboardjs');

var multiSelect = false;

keyboardjs.on('ctrl', () => multiSelect = true, () => multiSelect = false);

const Pubsub = require('backbone').Events;

export class Layers {

    private tree: Tree;
    private layers: Tabs.Content;
    private accordion: Accordion;
    private treeData: any[];
    private properties: View;
    private selecting: boolean;

    constructor(tabMenu: Tabs.Menu) {
        var layers = this.layers = new Tabs.Content();
        var layersTab = tabMenu.tab('layers', layers);
        layersTab.$el.text('Scene');
        layers.active = true;

        let layersCount = EDITOR.map.layers.length;

        this.tree = new Tree({
            jstree: {
                core : {
                    animation : 100,
                    check_callback : true,
                    themes : {  },
                    data : [],
                    multiple: true
                },
                types: {
                    "#": {
                        valid_children: ["layer"],
                    },
                    layer: {
                        valid_children: ["object"],
                        icon: "icon folder outline medium large"
                    },
                    object: {
                        icon: "icon file outline medium large",
                        valid_children: [],
                    }
                }
            }
        });
        this.treeData = [];
        (<any>this.tree.$el.jstree(true)).settings.core.data = this.treeData;

        Pubsub.on('editor:interaction:tools:selection:context', (e, id) => {
            let selection = Selection.get();
            this.tree.once('dropdown:show:object', (e: JQueryEventObject, dropdown: Dropdown, node, $node: JQuery) => {
                if (select.length > 1)
                    dropdown.$('.item[data-value="rename"]').addClass('disabled');
            });
            this.tree.showContextMenu(e, id);
        });

        let copiedChildren: any[] = [];

        this.tree.on('dropdown:show:layer', (e: JQueryEventObject, dropdown: Dropdown, node, $node: JQuery) => {
            let clickedLayer = EDITOR.map.layerById(node.id);
            let layers = EDITOR.map.layers;
            if (!Utils.canPaste())
                dropdown.$('.item[data-value="paste"]').addClass('disabled');
            if (layers.length <= 1) {
                dropdown.$('.item[data-value="delete"]').addClass('disabled');
                dropdown.$('.item[data-value^="move-"]').addClass('disabled');
            }
            if (layers.indexOf(clickedLayer) === 0)
                dropdown.$('.item[data-value="move-up"], .item[data-value="move-top"]').addClass('disabled');
            if (layers.indexOf(clickedLayer) === layers.length - 1)
                dropdown.$('.item[data-value="move-down"], .item[data-value="move-bottom"]').addClass('disabled');

            if (!clickedLayer.objects.length) {
                dropdown.$('.item[data-value="select-all"]').addClass('disabled');
                dropdown.$('.item[data-value="clear"]').addClass('disabled');
            }
        });

        this.tree.on('dropdown:show:object', (e: JQueryEventObject, dropdown: Dropdown, node, $node: JQuery) => {
            let $moveEl = dropdown.$('.item[data-value="move-to-layer"] .menu');
            let $copyEl = dropdown.$('.item[data-value="copy-to-layer"] .menu');
            let child = EDITOR.map.objectById(node.id);
            let otherLayers = _.filter(EDITOR.map.layers, layer => layer.id != child.layer);
            otherLayers.forEach(layer => {
                $('<div></div>')
                    .attr('data-value', 'move-to-layer-' + layer.id)
                    .addClass('item').text(layer.name)
                    .appendTo($moveEl);

                $('<div></div>')
                    .attr('data-value', 'copy-to-layer-' + layer.id)
                    .addClass('item').text(layer.name)
                    .appendTo($copyEl);
            });
            if (otherLayers.length) {
                $('<div></div>').addClass('divider').appendTo($moveEl);
                $('<div></div>').addClass('divider').appendTo($copyEl);
            }
            $('<div></div>')
                .attr('data-value', 'move-to-layer-')
                .addClass('item').text('New layer')
                .appendTo($moveEl);
            $('<div></div>')
                .attr('data-value', 'copy-to-layer-')
                .addClass('item').text('New layer')
                .appendTo($copyEl);
        });

        this.tree.on('dropdown:change', (value, $el, node, $node) => {
            let parent = node.type === 'layer' ? '#' : '#' + this.tree.$el.jstree(true).get_parent(node);

            let moveNodes = [node];
            if (node.type === 'object') {
                let child = EDITOR.map.objectById(node.id);
                if (Selection.has(child))
                    moveNodes = _.map(Selection.get(), child => '#' + child.id);
            }

            switch(value) {
                case 'rename':
                    this.tree.rename(node)
                        .then(name => {
                            if (node.type == 'layer')
                                EDITOR.map.layerById(node.id).name = name;
                            else if (node.type == 'object') {

                                let found = EDITOR.map.objectById(name);
                                if (!found) {
                                    EDITOR.map.objectById(node.id).id = name;
                                    this.tree.$el.jstree(true).set_id(node, name);
                                } else {
                                     this.tree.$el.jstree(true).rename_node(node, node.id);
                                     let modal = new View({className: 'ui basic modal'});
                                     (<any>modal.setTemplate('templates/modals/error.html').render().$el).modal('show');
                                }
                            }
                        });
                break;
                case 'move-top': this.tree.$el.jstree(true).move_node(moveNodes, parent, 'first'); break;
                case 'move-up': this.tree.$el.jstree(true).move_node(moveNodes, parent, Math.max(0, $node.index() - 1)); break;
                case 'move-down': this.tree.$el.jstree(true).move_node(moveNodes, parent, Math.min($node.index() + 2, $node.parent().children().length)); break;
                case 'move-bottom': this.tree.$el.jstree(true).move_node(moveNodes, parent, 'last'); break;
                case 'delete':
                    if (node.type === 'layer') {
                        Utils.remove(EDITOR.map.layerById(node.id).objects);
                        EDITOR.map.removeLayer(node.id);
                    }
                    else {
                        let obj = EDITOR.map.objectById(node.id);
                        Utils.remove( Selection.has(obj) ? Selection.get() : [obj] );
                    }
                break;
            }
        });

        let cut = false;

        this.tree.on('dropdown:change:layer', (value, $el, node, $node) => {
            let clickedLayer = EDITOR.map.layerById(node.id);
            if (!clickedLayer) return;
            switch(value) {
                case 'select-all': Selection.selectLayer(clickedLayer); break;
                case 'clone':  EDITOR.map.cloneLayer(clickedLayer); break;
                case 'paste': Utils.paste(clickedLayer); break;
                case 'clear': Utils.remove(clickedLayer.objects.slice()); break;
            }
        });

        this.tree.on('dropdown:change:object', (value: string, $el, node, $node) => {
            let child = EDITOR.map.objectById(node.id);
            let clickedLayer = EDITOR.map.layerById(child.layer);

            let isInSelect = Selection.has(child);
            let selection = isInSelect ? Selection.get() : [child];
            switch(value) {
                case 'cut': Utils.cut(selection); break;
                case 'copy': Utils.copy(selection); break;
            }
            let moveOrCopy = (targetId: string, move: boolean) => {
                let targetLayer = EDITOR.map.layerById(targetId);
                if (!targetId)
                    targetLayer = EDITOR.map.createLayer('layer-' + (layersCount++));
                if (targetLayer) {
                    if (move)
                        Utils.moveTo(targetLayer, selection);
                    else
                        Utils.copyTo(targetLayer, selection);
                    this.tree.$el.jstree(true).open_node('#' + targetId);
                }
            }
            let mvIdx = value.indexOf('move-to-layer-');
            if (mvIdx >= 0)
                moveOrCopy(value.substr('move-to-layer-'.length), true);
            let cpIdx = value.indexOf('copy-to-layer-');
            if (cpIdx >= 0)
                moveOrCopy(value.substr('copy-to-layer-'.length), false);
        });

        this.tree.setContextMenu('layer', 'templates/editor/sidebar/scene/layers/menu/layer.html');
        this.tree.setContextMenu('object', 'templates/editor/sidebar/scene/layers/menu/object.html');


        this.selecting = false;
        let selectedNodes = [];

        Pubsub.on('selection:select', children =>  {
            this.selecting = true;
            selectedNodes = _.map(children, (child: any) => child.id);
            let map = _.map(selectedNodes, (id: string) => '#' + id);
            (<any>this.tree.$el.jstree(true)).select_node(map);
            this.selecting = false;
        });
        Pubsub.on('selection:unselect', () => {
            (<any>this.tree.$el.jstree(true)).deselect_all();
            (<any>this.tree.$el.jstree(true)).select_node('#' + EDITOR.map.currentLayer.id);
            selectedNodes = [];
        });

        // Helper which syncs tree selection with map selection
        let select = selected => {
            let children = EDITOR.map.currentLayer.getChildren(selected);
            Selection.clear(true);
            Selection.select(children);
            this.selecting = true;
            (<any>this.tree.$el.jstree(true)).select_node('#' + EDITOR.map.currentLayer.id);
            this.selecting = false;
        };

        this.tree.$el.on('select_node.jstree', (e, data) => {
            if (this.selecting) return;
            this.selecting = true;

            // Keep the current selection displayed properly in the tree
            if (data.node.type == 'layer') {
                if (data.node.id != EDITOR.map.currentLayer.id) {
                    Selection.clear();
                    EDITOR.map.currentLayer = EDITOR.map.layerById(data.node.id);
                    selectedNodes = [];
                    (<any>this.tree.$el.jstree(true)).deselect_all();
                    (<any>this.tree.$el.jstree(true)).select_node('#' + EDITOR.map.currentLayer.id);
                } else
                    selectedNodes = _.map(Selection.getSelectionContainer().selection, (child: any) => child.id);
                let map = _.map(selectedNodes, id => '#' + id);
                (<any>this.tree.$el.jstree(true)).select_node(map);
                this.selecting = false;
                return;
            }

            let object = EDITOR.map.objectById(data.node.id);
            let selection = Selection.getSelectionContainer().selection;
            Selection.clear(true);
            EDITOR.map.currentLayer = <Layer>object.parent;

            let multiSelect = data.event ? data.event.ctrlKey : false;
            let idx = selectedNodes.indexOf(data.node.id);
            selectedNodes = data.selected.slice();
            if (idx >= 0) {
                (<any>this.tree.$el.jstree(true)).deselect_node(data.node);
                selectedNodes.splice(idx, 1);
            } else if (idx < 0) {
                selectedNodes.push(data.node.id);
            }
            // Sync map selection
            select(selectedNodes);
            this.selecting = false;
        });
        this.tree.$el.on('deselect_node.jstree', (e, data: any) => {
            if (this.selecting) return;
            this.selecting = true;
            if (data.node.type == 'layer') {
                (<any>this.tree.$el.jstree(true)).select_node('#' + EDITOR.map.currentLayer.id);
                this.selecting = false;
                return;
            }
            selectedNodes = data.selected.slice();
            // Sync map selection
            select(selectedNodes);
            this.selecting = false;
        } );

        let sort = (nodes: string[]) => {
            this.selecting = true;
            let affectedLayers: Layer[] = [EDITOR.map.currentLayer];
            let selection = Selection.getSelectionContainer().selection;
            // Make sure all objects are in layer space before sorting them
            Selection.clear(true);

            nodes.forEach(id => {
                let object = EDITOR.map.objectById(id);
                let node = (<any>this.tree.$el.jstree(true)).get_node('#' + id);
                let parent = (<any>this.tree.$el.jstree(true)).get_parent('#' + id);
                let layer = EDITOR.map.layerById(parent);

                if (object) {
                    if (parent !== object.layer) {
                        object.layer = parent;
                        (<Layer>object.parent).deleteChild(object);
                        layer.addChild(object);
                        let idx = selection.indexOf(object);
                        if (idx >= 0) selection.splice(idx, 1);
                    }
                }
                if (layer && affectedLayers.indexOf(layer) < 0)
                    affectedLayers.push(layer);
            });
            affectedLayers.forEach(layer => {
                // Update the z index of each object
                layer.objects.forEach(object => {
                    let node = (<any>this.tree.$el.jstree(true)).get_node('#' + object.id, true);
                    if (node)
                        object.z = node.index() + 1;
                });
                layer.sort();
            });
            // Update z-index of the layers and sort them
            EDITOR.map.layers.forEach(layer => {
                let node = (<any>this.tree.$el.jstree(true)).get_node('#' + layer.id, true);
                if (node)
                    layer.z = node.index() + 1;
            });
            EDITOR.map.sortLayers();

            // Sort and restore the selection
            if (selection.length) {
                selection = selection.sort((a, b) => a.z - b.z);
                Selection.select(selection, true);
            }
            this.selecting = false;
        };

        // If a node got moved, update the z-index of each layer
        this.tree.$el.on('move_node.jstree', () => sort(_.map(EDITOR.map.layers, layer => layer.id)) );
        Pubsub.on('editor:interaction:paste', (pasted, target: Layer) => sort([target.id]));

        $(document).on('dnd_stop.vakata', (e: any, data) => {
            // Only react on d&d from this tree
            // if (!$.contains( this.tree.el, e.delegateTarget.activeElement) ) return;
            if (data.data)
                sort(data.data.nodes);
        });

        this.addLayer(EDITOR.map.currentLayer);


        let accordion = this.accordion = new Accordion({ className: 'ui styled accordion' });
        let group = accordion.create('Layers');
        group.active = true;
        group.setTitle('Layers');
        group.setContent(this.tree);

        let button = new Button({className: 'mini ui right floated positive button'});
        button.add(new Icon({iconName: 'plus icon'}));

        group.title.add(button);

        button.on('click', e => {
            EDITOR.map.createLayer('layer-' + (layersCount++));
            e.stopPropagation();
        });

        layers.add(accordion);

        this.properties = new Properties(Selection.getSelectionContainer());
        this.properties.hide();
        layers.add(this.properties);

        this.updateSize();
        $(window).resize(() => this.updateSize());
        this.accordion.on('change opening closing', this.updateSize, this);

        Pubsub.on('map:createLayer', (world: Map, layer) => this.addLayer(layer));
        Pubsub.on('map:removeLayer', (world: Map, layer: Layer) => this.tree.$el.jstree(true).delete_node('#' + layer.id) );
        Pubsub.on('map:currentLayer map:parse', (world: Map, layer: Layer) => this.tree.$el.jstree(true).select_node('#' + layer.id));
    }

    /**
     * Updates the size of the accordion and property section.
     */
    updateSize() {
        // +48 because of segment padding & segment top margin
        let anchorSize = (this.layers.anchor.$el.outerHeight(true) + 48) / window.innerHeight;
        let leftSize = 1 - anchorSize;
        let halfSize = (leftSize * .5) * 100;
        this.accordion.css = `max-height: ${halfSize}%;`;
        this.properties.css = `max-height: ${halfSize}%;`;
    }

    /**
     * Adds the given layer to the tree view.
     * @param {Layer} layer
     */
    addLayer(layer: Layer) {
        let layerControl = new LayerControl(layer, this.tree);
        this.tree.$el.jstree(true).create_node(null, layerControl.node);
        this.tree.$el.on('create_node.jstree', () => {
            this.tree.$el.jstree(true).select_node('#' + EDITOR.map.currentLayer.id);
            this.updateSize();
        });
        layer.on('change:id', (id, old) => this.tree.$el.jstree(true).set_id(layerControl.node,  id));
    }
}
