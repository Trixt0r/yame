import { PropertyComponent } from './abstract';
import { Component } from '@angular/core';

@Component({
  template: `
  <mat-form-field class="full">
    <input matInput
        type="number"
        placeholder="{{ property.name }}"
        [disabled]="!property.editable"
        [value]="property.value | round"
        (input)="update({ originalEvent: $event, property: property })" />
  </mat-form-field>`,
  styleUrls: ['./style.scss'],
})
export class NumberPropertyComponent extends PropertyComponent {

}
