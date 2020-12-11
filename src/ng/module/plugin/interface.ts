import { YamePlugin } from "common/plugin";
import { Type, ModuleWithProviders } from "@angular/core";

export interface RendererPlugin extends YamePlugin {

  /**
   * A list of angular modules this plugin provides.
   * This attribute will be read once, before initializing the main module
   * and only if the plugin has been initialized successfully.
   */
  ngModules?: Array<Type<unknown> | ModuleWithProviders<unknown> | any[]>;

}
