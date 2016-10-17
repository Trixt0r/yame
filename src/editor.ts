declare var global;

import Editor from './editor/editor';
import Map from './core/renderer/scene/map';
import Camera from './core/renderer/scene/camera';

var Pubsub = require('backbone').Events;

Pubsub.on('renderer-ready', ()  => {
    var editor = new Editor();
    Pubsub.trigger('editor:ready', editor);
});
