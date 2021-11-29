import { Type } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * A tool component draws it's current assigned tool.
 */
export interface IToolComponent {
  /**
   * The tool for this component.
   */
  tool: Tool;
}

/**
 * A tool type defines the
 */
export enum ToolType {
  /**
   * A tool that can be toggled, deactivates the current active tool and activates itself on click.
   */
  TOGGLE = 0,

  /**
   * A clickable tool does not affect the currently active tool,
   * i.e. it activates itself, without deactivating the current active tool.
   */
  CLICK = 1,
}

/**
 * A tool defines the implementation of a tool.
 * It can be either activated or deactivated.
 */
export class Tool {
  /**
   * Internal reference count.
   */
  protected static TOOL_COUNT: number = 0;

  /**
   * The icon for this tool. Primarily used for the default tool component.
   */
  icon?: string;

  /**
   * Triggered when this tool got activated.
   */
  readonly activated$ = new Subject<void>();

  /**
   * Triggered when this tool got deactivated.
   */
  readonly deactivated$ = new Subject<void>();

  /**
   * The component for this tool.
   */
  readonly component: Type<IToolComponent> | null = null;

  /**
   * The type of this tool.
   */
  readonly type: ToolType = ToolType.TOGGLE;

  /**
   * The position of this tool.
   */
  readonly position: number;

  /**
   * Internal state indicating whether this tool is active or not.
   */
  protected active: boolean;

  /**
   * The internal id of this tool. Override it to your needs.
   */
  protected _id: string;

  constructor(id: string, icon?: string, position?: number) {
    this._id = id;
    this.active = false;
    this.icon = icon;
    this.position = typeof position === 'number' ? position : Tool.TOOL_COUNT + 1;
    Tool.TOOL_COUNT++;
  }

  /**
   * The identifier for this tool.
   */
  get id(): string {
    return this._id;
  }

  /**
   * Whether this tool is active.
   */
  get isActive(): boolean {
    return this.active;
  }

  /**
   * Activates this tool, i.e. runs all preparation for working with this tool.
   * It emits the `activated` event if activated successfully.
   * The default implementation can be extended to your needs.
   *
   * @param event The triggered DOM event, if any.
   */
  async activate(event?: Event): Promise<void> {
    if (this.active) return;
    if (this.type === ToolType.TOGGLE) this.active = true;
    await this.onActivate(event);
    this.activated$.next();
  }

  /**
   * Deactivates this tool, i.e. executes all processes which are needed to make it inactive.
   * It emits the `deactivated` event if deactivated successfully.
   * The default implementation can be extended to your needs.
   *
   * @param event The triggered DOM event, if any.
   */
  async deactivate(event?: Event): Promise<void> {
    if (!this.active) return;
    if (this.type === ToolType.TOGGLE) this.active = false;
    await this.onDeactivate(event);
    this.deactivated$.next();
  }

  /**
   * Handler called during activation.
   * Override this in your custom tool for initializing it.
   *
   * @param event The triggered DOM event, if any.
   */
  protected async onActivate(event?: Event): Promise<any> {}

  /**
   * Handler called during deactivation.
   * Override this in your custom tool for deactivating it.
   *
   * @param event The triggered DOM event, if any.
   */
  protected async onDeactivate(event?: Event): Promise<any> {}
}
