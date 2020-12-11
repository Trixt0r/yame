/**
 * Extends the default require function.
 * The 'yame' module gets faked, by overriding the require function and checking for that
 * specific module name. The given indexModule will be exported in that case.
 *
 * @param {any} mapping The module to export, if 'yame' will be required.
 * @return {void}
 */
export function extend(mapping: { [key: string]: any }) {
  const requireFn = typeof (global as any).require === 'function' ? (global as any).require : require;

  const Module = requireFn('module');
  const originalRequire = Module.prototype.require;
  const nodeModules = requireFn('path').resolve(__dirname, '..', 'node_modules');

  Module.prototype.require = function(name: string) {
    if (!this._yame_pushed && name === 'yame') {
      this.paths.unshift(nodeModules);
      this._yame_pushed = true;
    }
    const found = mapping[name];
    return found === void 0 ? originalRequire.apply(this, arguments) : found;
  };
}
