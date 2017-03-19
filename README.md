# yame-ng2
This branch contains the migration from the old, buggy Backbone based implementation to a cleaner angular2 implementation.
Old code gets reviewed and only the good parts of it will be migrated to the new version. All other parts will be re-written.

This will lead to a more maintainable codebase.

The main goals are:
* Use angular2 databinding and get rid of the custom Backbone implementation.
* Faster public subscription system (pubsub) with eventemitter3.
* Use bluebird promises where possible and get rid of the node js style callback usage.
* Clean up the component and entity system.
