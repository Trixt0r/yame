/**
 * An ipc action sets a specific set of ipc messages up.
 * Simply used to have a better ipc messaging overview.
 *
 * @export
 * @abstract
 * @class IpcAction
 */
export abstract class IpcAction {

  /**
   * @inheritdoc
   */
  protected _initialized = false;

  /**
   * Initializes the message handling. Promise, in case initialization is asynchronous.
   */
  abstract init(): Promise<void>;

  /**
   * Whether the action is initialized or not.
   */
  get isInitialized(): boolean {
    return this._initialized;
  };

}
