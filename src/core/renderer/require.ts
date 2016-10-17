declare var process, require, module;
import path = require('path');

/**
 * Fix for loading modules from the HTML scope.
 */
(function() {
    var baseDir = path.resolve('..');

    var metas = document.getElementsByTagName('meta');
    for (var i = 0;  i < metas.length; i++)
        if (metas[i].getAttribute('baseDir'))
            baseDir = metas[i].getAttribute('baseDir');

    module.paths.push(baseDir);
    module.paths.push(path.resolve(baseDir, 'node_modules'));
    baseDir = path.resolve(baseDir, 'app');
    module.paths.push(baseDir);

    var oldRequire = require;

    require = function(file) {
        try {
            return oldRequire.apply(null, arguments);
        } catch (e) {
            var newArgs = [];
            for (var i in arguments)
                newArgs.push(arguments[i]);
            newArgs[0] = path.resolve(baseDir, file);
            return oldRequire.apply(null, newArgs);
        }
    };
}());
