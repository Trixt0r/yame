import { EventEmitter } from 'eventemitter3';

export class Tool extends EventEmitter {

  protected active: boolean;
  protected internalId: string;
  icon: string;

  constructor(id: string, icon?: string) {
    super();
    this.internalId;
    this.active = false;
    this.icon = icon;
  }

  /** @type {string} The identifier for this tool. */
  get id(): string {
    return this.internalId;
  }

  get isActive(): boolean {
    return this.active;
  }

  activate(): Promise<boolean> {
    if (this.active) return Promise.resolve(false);
    this.active = true;
    this.emit('activated');
    return Promise.resolve(true);
  }

  deactivate(): Promise<boolean> {
    if (!this.active) return Promise.resolve(false);
    this.active = false;
    this.emit('deactivated');
    return Promise.resolve(true);
  }

}
