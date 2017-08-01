import { Component, Input, EventEmitter,} from '@angular/core';
import { AssetGroup } from "../../../../../../../common/asset/group";
import { Asset } from "../../../../../../../common/asset";
import { GroupComponent } from './abstract';

/**
 * Component which displays a single directory group in the groups view.
 *
 * @export
 * @class DirectoryGroupComponent
 * @extends {GroupComponent}
 */
@Component({
  template: `
    <md-list-item (click)="click($event)">
      <md-icon md-list-icon>folder</md-icon>
      <h4 md-line> {{ group.content.name }} </h4>
    </md-list-item>`
})
export class DirectoryGroupComponent extends GroupComponent {

  /** @inheritdoc */
  @Input() group: AssetGroup<Asset>;

}
