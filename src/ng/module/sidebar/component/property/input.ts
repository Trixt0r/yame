import { PropertyComponent } from './abstract';
import { Component } from '@angular/core';

@Component({
  template: `
  <mat-form-field class="full">
    <input matInput
        type="{{ property.type }}"
        placeholder="{{ property.name }}"
        [disabled]="!property.editable"
        [value]="property.value ? property.value : ''"
        (input)="update({ originalEvent: $event, property: property })" />
  </mat-form-field>`,
  styleUrls: ['./style.scss'],
})
export class InputPropertyComponent extends PropertyComponent {

}
