import { NgModule } from '@angular/core';
import { Pubsub } from '../idx';
import { Environment } from '../environment';
import { RendererPlugin } from './plugin/interface';

let pluginModules = [];

Environment.plugins.forEach((plugin: RendererPlugin) => {
  if (!Array.isArray(plugin.ngModules)) return;
  pluginModules = pluginModules.concat(plugin.ngModules);
});

Pubsub.emit('plugin:NgModules', pluginModules);

@NgModule({
  declarations: [],
  entryComponents: [],
  imports: pluginModules,
  exports: pluginModules,
})
export class PluginModule {}
