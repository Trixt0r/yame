import * as Promise from 'bluebird';

/**
 * An ipc action sets a specific set of ipc messages up.
 * Simply used to have a better ipc messaging overview.
 *
 * @export
 * @interface IpcAction
 */
export interface IpcAction {

  /** @returns {Promise<any>} Initializes the message handling. Promise, in case initialization is asynchronous. */
  init(): Promise<any>;

}