Y.A.M.E
=======

**Y.A.M.E** stands for **Yet** **Another** **Map** **Editor**.
For now this is a development title.

Primarily it aims to be a generic map/scene editor for any kind of 2D game.

The project is in a really early phase, which means it is still a prototype.
Code base may change completey in the future.

Feature
-------

The main features of **Y.A.M.E** have to be the following:

* Layer support.
* Support for tiled and non-tiled maps.
   * A mix of both has to be possible.
* Non-tile entities can be organized as a mesh.
* Primitive shape (rectangle, ellipsis, line & polygon) support.
* Entity grouping support.
   * Users can define more complex entities by grouping up single entities.
      * E.g. a tree entity contains a wood entity and a bunch of leaf entities.
* Smart tile support.
   * Similar to grouping support, where users arange their tiles in a way, the
    editor knows how to align the tiles properly when brushing tiles onto the
    map.
* Smart mesh support.
   * Similar to the Unity 3D map editor, where you can define which texture has
   has to be rendered on a surface based on the surfaces angle.
* Extension support.
   * The editor has to give other developers access to all features it provides,
   so features which are not supported out of the box can still be implemented.

Technologies:
-------------

The whole editor is based on HTML5.

The following libraries, languages and tools are used:

* [Electron](http://electron.atom.io/) and [Node.js](https://nodejs.org/en/) as
a basis
* [TypeScript](https://www.typescriptlang.org/) for the buisinuess logic
* [less](http://lesscss.org/) for styling the UI
* [PixiJS](http://www.pixijs.com/) for the map rendering
* [Semantic UI](http://semantic-ui.com/) for the GUI
* [gulp.js](http://gulpjs.com/) for developing and building
* Common JS libraries such as [jQuery](https://jquery.com/),
[Backbone.js](http://backbonejs.org/), [bluebird](http://bluebirdjs.com/), etc.
check out the `package.json`

Installation
------------

The project assumes that you have installed [Node.js](https://nodejs.org/en/)
on your system.

If you do not have installed `typescript`, `typings`, `gulp` and `electron`
globally, install them with

`npm install -g typescript typings gulp electron`

If you met all requirements, checkout the repo and run

```npm install```

```npm run yame```

will run the editor.