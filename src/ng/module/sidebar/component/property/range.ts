import { PropertyComponent, InputEvent } from './abstract';
import { Component } from '@angular/core';
import { MatSliderChange } from '@angular/material';

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
        (change)="update($event, $event.value)"
      >
      </mat-slider>
    </div>
  `,
  styleUrls: ['./style.scss'],
})
export class RangePropertyComponent extends PropertyComponent {
}
