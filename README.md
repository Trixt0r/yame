# yame (ng2)

## Installing & Running

It is assumed, that [nodejs and npm](https://nodejs.org) are installed on your machine.
Preferably __node 10.11.0__ and __npm 6.4.1__.

Clone this repo and switch to the branch named __ng2__

```sh
git clone https://github.com/Trixt0r/yame.git
cd yame
git checkout ng2
```

Then you will have to install all dependencies with

```sh
npm install
```

Then you can start the editor with

```sh
npm run editor
```

This task should do a dev build and start the electron process.

## Developing

In order to develop, you have just to run the follwing command

```sh
npm start
```

This will start watch tasks for the renderer and browser processes.

Those are basically webpack and tsc watch tasks which run concurrently.

The startup process may take a while and restart the process some times, since the watch tasks run in parallel.

### yame-dev

This plugin will only run in development mode and reload the web contents or reset the electron process as the code gets compiled.

After those steps your can run `npm start` and auto reload should just work fine.

### Own plugins

As mentioned above, the editor already supports plugins.

You can implement your own plugins by adding them to the `node_modules\@yame` folder or based on your config. Have a look at the `config.json`.

The `yame-dev` plugin is also a plugin example.

Basically you can code node js code, with an yame api :smile:.

## Purpose
This branch contains the migration from the old, buggy Backbone based implementation to a cleaner angular implementation.
Old code gets reviewed and only the good parts of it will be migrated to the new version. All other parts will be re-written.

This will lead to a more maintainable codebase.

__The main goals are__
* Use angular databinding and get rid of the custom Backbone implementation.
* Faster public subscription system (pubsub) with eventemitter3.
* Use bluebird promises where possible and get rid of the node js style callback usage.
* Clean up the component and entity system.

This branch will be merged into the master branch, as soon as most of the previous features are implemented.
