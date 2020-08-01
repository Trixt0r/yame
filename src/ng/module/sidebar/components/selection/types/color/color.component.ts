import { Component, OnChanges, SimpleChanges, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { InputTypeComponent } from '../index';
import { ColorPickerControl, Color as NgxColor } from '@iplab/ngx-color-picker';
import { Subscription } from 'rxjs';
import { ColorSceneComponent } from 'common/scene/component/color';

@Component({
  templateUrl: './color.component.html',
  styleUrls: ['../style.scss', './color.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ColorTypeComponent extends InputTypeComponent<ColorSceneComponent> implements OnDestroy, OnChanges {

  static readonly type: string = 'color';

  control = new ColorPickerControl();
  protected sub: Subscription;
  _rgbaString: string;

  constructor(private cdr: ChangeDetectorRef) {
    super();
    this.sub = this.control.valueChanges.subscribe(val => {
      if (!this.component) return;
      this._rgbaString = val.toRgbaString();
      const value = val.getRgba();
      Object.assign(this.component, {
        red: value.red,
        green: value.green,
        blue: value.blue,
        alpha: value.alpha,
      });
      this.updateEvent.emit({
        originalEvent: val,
        component: this.component
      });
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.component) return;
    const val = this.component ? this.component : null;
    if (val && typeof val === 'object') {
      const parts = [ val.red, val.green, val.blue, val.alpha ];
      this._rgbaString = `rgba(${parts.join(',')})`;
      this.control.setValueFrom(new NgxColor(this._rgbaString));
    }
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get rgbaString(): string {
    return this._rgbaString;
  }

}
