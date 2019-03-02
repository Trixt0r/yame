import { Component } from '@angular/core';
import { InputPropertyComponent } from './input';

@Component({
  template: `
    <mat-form-field class="full">
      <input
        matInput
        type="color"
        placeholder="{{ property.name }}"
        [disabled]="!property.editable"
        [value]="property.value | color"
        (change)="update($event, $event.currentTarget.value)"
      />
    </mat-form-field>
  `,
  styleUrls: ['./style.scss'],
})
export class ColorPropertyComponent extends InputPropertyComponent {

  update(event: any, value: any) {
    return super.update(event, typeof value === 'string' ? parseInt(value.replace('#', ''), 16) : value);
  }

}
