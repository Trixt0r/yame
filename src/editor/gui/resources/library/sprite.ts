import { View } from '../../../../core/view/abstract';
import { Input } from '../../../../core/view/input';
import { Icon } from '../../../../core/view/icon';
import { Accordion, Group } from '../../../../core/view/accordion';
import { SpriteFactory } from '../../../../core/graphics/sprite';
import { List } from '../../../../core/view/list';
import { Image } from '../../../../core/view/image';
import { Anchor } from '../../../../core/view/anchor';
import { Library } from '../library';
import Resources = require('../../../resources');

import fs = require('fs');
import path = require('path');

const ipcRenderer = require('electron').ipcRenderer;

var changeImage = false;
var selectedImg: Image = null;

class Preview extends View {

    public img: Image;

    constructor() {
        super({
            className: 'sixteen wide column'
        });
        this.img = new Image();
        this.img.$el.addClass('centered').css('max-height', '200px');
        this.add(this.img);
    }
}

class Properties extends View {
    form: View;
    input: Input;

    constructor() {
        super({
            className: 'thirteen wide column'
        });
        this.form = new View({
            className: 'ui form',
            tagName: 'form'
        });

        this.add(this.form);

        var pathContainer = new View({
            className: 'ui right labeled left icon input'
        });

        pathContainer.add(new Icon({
            iconName: 'file'
        }));

        this.input = new Input({
            attributes: {
                disabled: true
            }
        });
        pathContainer.add(this.input);

        var btn = new Anchor({
            className: 'ui label'
        });
        var openFoderIco = new Icon({
            iconName: 'folder open outline large'
        });
        openFoderIco.$el.css('margin', '0');
        btn.add(openFoderIco);
        btn.on('click', () => {
            changeImage = true;
            ipcRenderer.send('showOpenDialog', ['openFile']);
            return false;
        });
        pathContainer.add(btn);

        this.form.add(pathContainer);
    }
}

export class Sprite {

    public imageDropHandler: Resources.ImageDropHandler;
    images: View;
    bodyFiller: View;
    openFolderView: Icon;
    preview: Preview;
    properties: Properties;
    sprites: Group;

    constructor(private library: Library) {
        Resources.setFactoryForType('Sprite', new SpriteFactory());

        this.openFolderView = new Icon({
            iconName: 'folder open'
        });
        this.openFolderView.$el.css('float', 'right');

        // Sprites
        var sprites = this.sprites = library.accordion.create('Sprites');
        sprites.active = true;

        sprites.title.add(this.openFolderView);

        this.sprites.setTitle('Sprites');

        this.bodyFiller = new View({
            el: '<div class="panel-body-filler"> <div class="panel-body-filler-text"> Drag a Sprite into this area. </div> </div>'
        });
        sprites.content.add(this.bodyFiller);

        this.images = new List({
            className: 'ui middle aligned selection animated list',
        });
        sprites.content.add(this.images);

        // Register an image drop handler
        this.imageDropHandler = new Resources.ImageDropHandler();
        this.imageDropHandler.registerHandler(this.addImage.bind(this));
        // Enable file drops on the panel body


        Resources.registerFileDropView(sprites.content, this.imageDropHandler);
        sprites.content.render();

        ipcRenderer.on('showOpenDialog', (event, files: string[]) => {
            files.forEach(filePath => {
                if (fs.lstatSync(filePath).isDirectory())
                    this.addDir(filePath, false);
                else if (changeImage && fs.lstatSync(filePath).isFile()) {
                    // Check if image has alread been loaded
                    var found = this.images.find((view: View) => view.$('img').attr('src') == filePath);
                    if (found) return alert('Sprite "' + filePath + '" has already been loaded. Choose another file!');
                    this.preview.img.src = selectedImg.src = filePath;
                    this.properties.input.placeholder = filePath;
                    selectedImg.parent.$('.header').text(path.basename(filePath));
                    PIXI.loader.add(filePath.replace(path.extname(filePath), ''), filePath);
                    PIXI.loader.load();
                }
                changeImage = false;
            });
        });

        this.openFolderView.$el.on('click', () => {
            ipcRenderer.send('showOpenDialog', {properties: ['openDirectory'] });
            return false;
        });

        this.preview = new Preview();
        this.properties = new Properties();
    }

    /**
     * Adds the given file to the sprites panel.
     * @param  {Resources.File} file
     * @returns {void}
     */
    addImage(payload: Resources.Payload): void {
        // Clear the drag event handlers, if a file got dropped
        this.imageDropHandler.clearEnter();
        this.imageDropHandler.clearLeave();

        var filePath = payload.content;

        if (fs.lstatSync(filePath).isDirectory()) return this.addDir(filePath, false);

        // Check if file has already been droppped
        var found = this.images.find((view: View) => view.$('img').attr('src') == filePath);
        // Stop here, if the image already exists.
        if (found) return;
        // Add the file to the asset loader
        PIXI.loader.add(filePath.replace(path.extname(filePath), ''), filePath);

        var img = new Image();
        img.src = filePath;
        this.images.add(img);
        img.$el.removeClass().addClass('ui avatar image sprite');
        var name = new View({ className: 'content' });
        name.$el.html('<div class="header">' + path.basename(filePath) + '</div>');
        img.parent.add(name);
        img.parent.$el.attr('draggable', 'true');
        img.parent.$el.bind('dragstart', (e: any) => {
            Resources.setPayload(e, payload.type, filePath);
            e.originalEvent.dataTransfer.setData('type', 'Sprite');
        });

        this.sprites.content.delete(this.bodyFiller);
        this.sprites.content.$el.css('min-height', 'initial');
        img.parent.$el.on('click', () => {
            selectedImg = img;
            this.images.$('.item').removeClass('active');
            img.parent.$el.addClass('active');

            this.library.props.delete(this.preview).delete(this.properties);
            this.preview.img.$el.unbind('dragstart');
            this.preview.img.src = img.src;
            this.properties.input.placeholder = img.src;
            this.library.props.add(this.preview).add(this.properties);
            this.preview.img.$el.bind('dragstart', (e: any) => Resources.setPayload(e, payload.type, img.src));
        });
        // Load the file
        PIXI.loader.load();
    }

    /**
     * Adds all image files in the given directory to the sprites panel.
     * @param {string}  dir
     * @param {boolean} recursive Whether to iterate subfolders or not.
     */
    addDir(dir: string, recursive: boolean): void {
        fs.readdir(dir, (err, files) => {
            if (err) return alert('Could not read files from ' + dir);
            files.forEach(filePath => {
                var file = {
                    path: path.resolve(dir, filePath)
                }
                if (fs.lstatSync(file.path).isDirectory() && recursive) this.addDir(file.path, recursive);
                else this.addImage({ type: 'file:' + path.extname(file.path).replace('.', ''), content: file.path });
            });
        });
    }
}
