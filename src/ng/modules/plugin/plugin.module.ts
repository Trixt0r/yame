import { NgModule } from '@angular/core';
import { Pubsub } from 'common/pubsub';
import { Environment } from '../../environment';
import { NgYamePlugin } from './plugin.interface';

let pluginModules: any[] = [];

Environment.plugins.forEach((plugin: NgYamePlugin) => {
  if (!Array.isArray(plugin.ngModules)) return;
  pluginModules = pluginModules.concat(plugin.ngModules);
});

Pubsub.emit('plugin:NgModules', pluginModules);

@NgModule({
  declarations: [],
  imports: pluginModules,
  exports: pluginModules,
})
export class PluginModule {}
