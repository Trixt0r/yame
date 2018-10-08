import * as path from 'path';

/**
 * Extends the default require function.
 * The 'yame' module gets faked, by overriding the require function and checking for that
 * specific module name. The given indexModule will be exported in that case.
 *
 * @param {any} indexModule The module to export, if 'yame' will be required.
 * @return {void}
 */
export function extend(indexModule) {
  var Module = require('module');
  var originalRequire = Module.prototype.require;
  const nodeModules = path.resolve(__dirname, '..', 'node_modules');

  Module.prototype.require = function(name) {
    this.paths.unshift(nodeModules);
    return name === 'yame' ? indexModule : originalRequire.apply(this, arguments);
  };
}
