declare var process;
// Load all external modules
import WindowModule = require('./backend/window');
import TemplateModule = require('./backend/template');
import path = require('path');

// Export the classes inside the modules
export type Window = WindowModule.Window;
export var Window = WindowModule.Window;
export type Template = TemplateModule.Template;
export var Template = TemplateModule.Template;

export var baseDir = path.resolve(__dirname, '..', '..');

if (process.type === 'renderer') {
    var metas = document.getElementsByTagName('meta');
    for (var i = 0;  i < metas.length; i++)
        if (metas[i].getAttribute('baseDir'))
            baseDir = metas[i].getAttribute('baseDir');
}


export var appDir = path.resolve(baseDir, 'app');
export var templateDir = path.resolve(baseDir, 'templates');
export var cssDir = path.resolve(baseDir, 'css');
