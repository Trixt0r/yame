import { Component, ChangeDetectionStrategy } from '@angular/core';
import { InputPropertyComponent } from './input';

@Component({
  template: `
  <mat-form-field class="full">
    <input matInput
        type="color"
        placeholder="{{ property.name }}"
        [disabled]="!property.editable"
        [value]="property.value | color"
        (input)="update({ originalEvent: $event, property: property })" />
  </mat-form-field>`,
  styleUrls: ['./style.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorPropertyComponent extends InputPropertyComponent {

}
