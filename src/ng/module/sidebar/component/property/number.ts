import { Component } from '@angular/core';
import { InputEvent, PropertyComponent } from './abstract';

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

  /**
   * @inheritdoc
   */
  update(event: InputEvent) {
    this.property.value = parseFloat((<HTMLInputElement>event.originalEvent.currentTarget).value);
    return super.update(event);
  }
}
