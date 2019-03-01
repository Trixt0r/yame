import { PropertyComponent, InputEvent } from './abstract';
import { Component } from '@angular/core';

@Component({
  template: `
    <div class="slider-container full">
      <label class="mat-form-field-label">{{ property.name }}</label>
      <mat-slider
        [max]="property.max"
        [min]="property.min"
        [disabled]="!property.editable"
        [step]="property.step"
        [thumbLabel]="true"
        [value]="property.value"
        (input)="update({ originalEvent: $event, property: property })"
      >
      </mat-slider>
    </div>
  `,
  styleUrls: ['./style.scss'],
})
export class RangePropertyComponent extends PropertyComponent {
  /**
   * @inheritdoc
   */
  update(event: InputEvent) {
    this.property.value = (<any>event.originalEvent).value;
    return super.update(event);
  }
}
