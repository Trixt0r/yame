import { Injectable, Type } from "@angular/core";
import { ToolComponent } from "./component/tool";
import { DefaultToolComponent } from "./component/default";
import { Tool } from "./tool";

interface ToolComponents {
  [key: string]: Type<ToolComponent>
}

interface Tools {
  [key: string]: Tool
}

@Injectable()
export class ToolbarService {

  protected toolComponents: ToolComponents = { };
  protected tooInstances: Tools = { };
  protected toolArray: Tool[] = [];
  protected currentTool: Tool;

  register(tool: Tool, component: Type<ToolComponent> = DefaultToolComponent) {
    if (this.toolArray.indexOf(tool) >= 0)
      throw new Error(`Tool ${tool.id} is already registered`);
    this.toolArray.push(tool);
    this.tooInstances[tool.id] = tool;
    this.toolComponents[tool.id] = component;
    if (!this.currentTool) this.activate(tool);
  }

  getComponent(tool: string | Tool): Type<ToolComponent> {
    return this.toolComponents[ typeof tool === 'string' ? tool : tool.id ];
  }

  getTool(id: string): Tool {
    return this.tooInstances[id];
  }

  get tools(): Tool[] {
    return this.toolArray.slice();
  }

  activate(tool: string | Tool): Promise<boolean> {
    const toActivate = typeof tool === 'string' ? this.getTool(tool) : tool;
    if (this.currentTool === toActivate) return Promise.resolve(false);
    let deactivate = this.currentTool && this.currentTool.isActive ? this.currentTool.deactivate() : Promise.resolve(false);
    return deactivate.then(() => toActivate.activate())
                      .then(() => true);
  }
}
