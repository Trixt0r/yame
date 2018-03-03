import { EventEmitter } from 'eventemitter3';

/**
 * A tool defines the implementation of a tool.
 * It can be either activated or deactivated.
 *
 * @class Tool
 * @extends {EventEmitter}
 */
export class Tool extends EventEmitter {

  /** @type {boolean} Internal state indicating whether this tool is active or not. */
  protected active: boolean;

  /** @type {string} The internal id of this tool. Override it to your needs. */
  protected internalId: string;

  /** @type {string} The icon for this tool. Primarily used for the default tool component. */
  icon: string;

  constructor(id: string, icon?: string) {
    super();
    this.internalId = id;
    this.active = false;
    this.icon = icon;
  }

  /** @type {string} The identifier for this tool. */
  get id(): string {
    return this.internalId;
  }

  /** @type {boolean} Whether this tool is active. */
  get isActive(): boolean {
    return this.active;
  }

  /**
   * Activates this tool, i.e. runs all preperation for working with this tool.
   * It emits the `activated` event if activated successfully.
   * The defaul implementation can be extended to your needs.
   *
   * @returns {Promise<boolean>} Resolves `true` if it has been activated. `fales` if not.
   */
  activate(): Promise<boolean> {
    if (this.active) return Promise.resolve(false);
    this.active = true;
    this.emit('activated');
    return Promise.resolve(true);
  }

  /**
   * Deactivates this tool, i.e. executes all processes which are needed to make it inactive.
   * It emits the `deactivated` event if deactivated successfully.
   * The defaul implementation can be extended to your needs.
   *
   * @returns {Promise<boolean>} Resolves `true` if it has been deactivated. `fales` if not.
   */
  deactivate(): Promise<boolean> {
    if (!this.active) return Promise.resolve(false);
    this.active = false;
    this.emit('deactivated');
    return Promise.resolve(true);
  }

}
