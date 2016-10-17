import EventBus from './eventbus';
import * as path from 'path';

let baseDir = path.resolve(__dirname, '..', '..', '..');

if (process.type === 'renderer') {
    var metas = document.getElementsByTagName('meta');
    for (var i = 0; i < metas.length; i++)
        if (metas[i].getAttribute('baseDir'))
            baseDir = metas[i].getAttribute('baseDir');
}

/**
 * Global environment module for accessing specific directories and sending
 * public events, everybody can subscribe to.
 * @singleton
 * @class Environment
 * @extends {EventBus}
 */
class Environment extends EventBus {

    /**
     * @readonly
     * @type {string} The base directory of the editor, i.e. where package.json
     * lives.
     */
    get baseDir(): string {
        return baseDir;
    }

    /**
     * @readonly
     * @type {string} The app directory, i.e. where the main entry point of the
     * app is.
     */
    get appDir(): string {
        return path.resolve(baseDir, 'app');
    }

    /**
     * @readonly
     * @type {string} The template directory of the app.
     */
    get templateDir(): string {
        return path.resolve(baseDir, 'templates');
    }

    /**
     * @readonly
     * @type {string} The css directory of the app.
     */
    get cssDir(): string {
        return path.resolve(baseDir, 'css');
    }

    /**
     * @readonly
     * @static
     * @type {string} The node modules directory of the app.
     */
    get nodeDir(): string {
        return path.resolve(baseDir, 'node_modules');
    }
}

let env = new Environment();
export default env;
