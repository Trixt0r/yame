import { Component, ChangeDetectionStrategy } from '@angular/core';
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
    </mat-list-item>`,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DirectoryGroupComponent extends GroupComponent { }
