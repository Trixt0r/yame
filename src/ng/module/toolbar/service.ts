import { Injectable, Type } from '@angular/core';
import { ToolComponent } from './component/tool';
import { DefaultToolComponent } from './component/default';
import { Tool } from './tool';
import { Subject } from 'rxjs';
import { ToolbarServiceException } from './exception/service';
import { first } from 'rxjs/operators';

interface ToolComponents {
  [key: string]: Type<ToolComponent>;
}

interface Tools {
  [key: string]: Tool;
}

/**
 * The toolbar service is responsible for providing an api to the editors toolbar.
 * You can register your custom tool via the @see {ToolbarService#register} method.
 *
 * @class ToolbarService
 */
@Injectable({ providedIn: 'root' })
export class ToolbarService {
  /** @type {ToolComponents} A tool components map, which maps a tool to a tool component, for rendering. */
  protected toolComponents: ToolComponents = {};

  /** @type {ToolComponents} A tool map for accessing tool instances via id easier and faster. */
  protected tooInstances: Tools = {};

  /** @type {Tool[]} The list of all currently registered tools. */
  protected toolArray: Tool[] = [];

  /** @type {Tool} The currently active tool. */
  protected currentTool?: Tool;

  private registeredSource = new Subject<Tool>();
  private activatedSource = new Subject<Tool>();
  private deactivatedSource = new Subject<Tool>();

  private registering = false;

  registered$ = this.registeredSource.asObservable();
  activated$ = this.activatedSource.asObservable();
  deactivated$ = this.deactivatedSource.asObservable();

  /**
   * Registers the given tool with the given optional tool component.
   * This method emits the registered event with the registered tool as a parameter.
   *
   * @param {Tool} tool The tool to register.
   * @param {Type<ToolComponent>} [component=DefaultToolComponent] The component for the tool.
   * @returns {Promise} Resolves whether an activation has been done or not.
   */
  register(tool: Tool, component: Type<ToolComponent> = DefaultToolComponent): Promise<boolean> {
    if (this.toolArray.indexOf(tool) >= 0 || this.getTool(tool.id) !== void 0)
      throw new ToolbarServiceException(`Tool '${tool.id}' is already registered`);
    if (this.registering)
      return new Promise((resolve, reject) => {
        this.registered$.pipe(first()).subscribe(() => {
          this.register(tool, component)
            .then(resolve)
            .catch(reject);
        });
      });
    this.toolArray.push(tool);
    this.tooInstances[tool.id] = tool;
    this.toolComponents[tool.id] = component;
    if (!this.currentTool) {
      this.registering = true;
      return this.activate(tool).then(re => {
        this.registering = false;
        this.registeredSource.next(tool);
        return re;
      });
    }
    this.registeredSource.next(tool);
    return Promise.resolve(false);
  }

  /**
   * Returns the tool component for the given tool.
   *
   * @param {(string | Tool)} tool The tool itself or it's id.
   * @returns {Type<ToolComponent>} The tool component prototype.
   */
  getComponent(tool: string | Tool): Type<ToolComponent> {
    return this.toolComponents[typeof tool === 'string' ? tool : tool.id];
  }

  /**
   * Returns the tool for the given id.
   *
   * @param {string} id The tool id.
   * @returns {Tool} The tool or `void 0`.
   */
  getTool(id: string): Tool {
    return this.tooInstances[id];
  }

  /** @type {Tool[]} A shallow copy of the currently registered tools. */
  get tools(): Tool[] {
    return this.toolArray.slice();
  }

  /** @type {Tool} The currently activate tool. */
  get activeTool(): Tool | undefined {
    return this.currentTool;
  }

  /**
   * Activates the given tool.
   * This method makes sure, that the current tool gets properly deactivated, if it is active.
   * The activation of the given tool happens only if the previous deactivation was successful.
   * This emits the activated and deactivated events with the corresponding tools.
   *
   * @param {(string | Tool)} tool
   * @returns {Promise<boolean>}
   */
  activate(tool: string | Tool): Promise<boolean> {
    const toActivate = typeof tool === 'string' ? this.getTool(tool) : this.getTool(tool.id);
    if (!toActivate) throw new ToolbarServiceException('Tool to activate not found');
    const currentTool = this.currentTool;
    if (currentTool === toActivate) return Promise.resolve(false);
    const deactivate = currentTool && currentTool.isActive ?
            currentTool.deactivate().then(re => {
              this.deactivatedSource.next(currentTool);
              return re;
            }) :
            Promise.resolve(false);
    return deactivate
      .then(() => toActivate.activate())
      .then(() => (this.currentTool = toActivate))
      .then(() => this.activatedSource.next(this.currentTool))
      .then(() => true);
  }
}
