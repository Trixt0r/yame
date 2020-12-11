import { Subject } from 'rxjs';

/**
 * A tool defines the implementation of a tool.
 * It can be either activated or deactivated.
 */
export class Tool {

  /**
   * The icon for this tool. Primarily used for the default tool component.
   */
  icon?: string;

  readonly activated$ = new Subject();
  readonly deactivated$ = new Subject();

  /**
   * Internal state indicating whether this tool is active or not.
   */
  protected active: boolean;

  /**
   * The internal id of this tool. Override it to your needs.
   */
  protected _id: string;

  constructor(id: string, icon?: string) {
    this._id = id;
    this.active = false;
    this.icon = icon;
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
   * Resolves `true` if it has been activated. `false` if not.
   */
  async activate(): Promise<boolean> {
    if (this.active) return Promise.resolve(false);
    this.active = true;
    await this.onActivate();
    this.activated$.next();
    return true;
  }

  /**
   * Deactivates this tool, i.e. executes all processes which are needed to make it inactive.
   * It emits the `deactivated` event if deactivated successfully.
   * The default implementation can be extended to your needs.
   *
   * Resolves `true` if it has been deactivated. `false` if not.
   */
  async deactivate(): Promise<boolean> {
    if (!this.active) return Promise.resolve(false);
    this.active = false;
    await this.onDeactivate()
    this.deactivated$.next();
    return true;
  }

  /**
   * Handler called during activation.
   * Override this in your custom tool for initializing it.
   */
  protected async onActivate(): Promise<any> { return Promise.resolve(); }

  /**
   * Handler called during deactivation.
   * Override this in your custom tool for deactivating it.
   */
  protected async onDeactivate(): Promise<any> { return Promise.resolve(); }

}
