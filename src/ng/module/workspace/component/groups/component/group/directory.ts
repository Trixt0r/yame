import { Component, Input, EventEmitter } from '@angular/core';
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
    <mat-list-item (click)="click($event)">
      <mat-icon mat-list-icon>folder</mat-icon>
      <h4 mat-line> {{ group.content.name }} </h4>
    </mat-list-item>`
})
export class DirectoryGroupComponent extends GroupComponent { }
