import { Component } from '@angular/core';
import { InputEvent, PropertyComponent } from './abstract';

@Component({
  template: `
    <mat-form-field class="full">
      <input
        matInput
        type="number"
        placeholder="{{ property.name }}"
        [disabled]="!property.editable"
        [value]="property.value | round"
        (input)="update($event, $event.currentTarget.value)"
      />
    </mat-form-field>
  `,
  styleUrls: ['./style.scss'],
})
export class NumberPropertyComponent extends PropertyComponent {
  /**
   * @inheritdoc
   */
  update(event: any, value: any) {
    return super.update(event, typeof value === 'string' ? parseFloat(value.replace(',', '.')) : value);
  }
}
