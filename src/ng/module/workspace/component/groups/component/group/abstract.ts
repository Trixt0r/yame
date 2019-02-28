import { EventEmitter } from '@angular/core';
import { Asset } from 'common/asset';
import { AssetGroup } from 'common/asset/group';

/**
 * Abstract component for rendering a group asset in the groups list.
 *
 * In order to implement a group component , you can checkout the default directory component.
 *
 * @export
 * @abstract
 * @class GroupComponent
 */
export abstract class GroupComponent {

  /** @type {AssetGroup<Asset>} The group to display in the groups list. */
  group: AssetGroup<Asset>;

  /** @type {EventEmitter<MouseEvent>} The event triggered if the group has been clicked. */
  clickEvent: EventEmitter<MouseEvent> = new EventEmitter();

  /**
   * Click handler, which delegates the event.
   *
   * @param {MouseEvent} event
   */
  click(event: MouseEvent) {
    this.clickEvent.emit(event);
  }
}
