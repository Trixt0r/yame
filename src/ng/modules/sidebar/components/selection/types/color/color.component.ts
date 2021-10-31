import {
  Component,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  SimpleChange,
  ViewEncapsulation,
} from '@angular/core';
import { InputTypeComponent } from '../input/input.component';
import { ColorPickerControl } from '@iplab/ngx-color-picker';
import { Subscription } from 'rxjs';
import { ColorSceneComponent } from 'common/scene/component/color';
import { TranslateService } from '@ngx-translate/core';
import { NzCollapseComponent } from 'ng-zorro-antd/collapse';

@Component({
  selector: 'yame-component-type-color',
  templateUrl: './color.component.html',
  styleUrls: ['../style.scss', './color.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [NzCollapseComponent],
  host: {
    class: 'margin-bottom-4',
  },
})
export class ColorTypeComponent extends InputTypeComponent<ColorSceneComponent> implements OnDestroy, OnChanges {
  static readonly type: string = 'color';

  /**
   * The color control.
   */
  control = new ColorPickerControl();

  /**
   * The subscription to the color control value changes.
   */
  protected sub: Subscription;

  /**
   * The internal rgba string.
   */
  protected _rgbaString?: string;

  /**
   * The current rgba values as a string.
   */
  get rgbaString(): string | undefined {
    return this._rgbaString;
  }

  /**
   * Whether this group component is expanded or not.
   */
  get expanded(): boolean {
    return (this.component?.expanded as boolean) ?? false;
  }

  constructor(protected translate: TranslateService, protected cdr: ChangeDetectorRef) {
    super(translate, cdr);
    this.sub = this.control.valueChanges.subscribe((val) => {
      if (!this.component) return;
      this._rgbaString = val.toRgbaString();
      const value = val.getRgba();
      Object.assign(this.component, {
        red: value.red,
        green: value.green,
        blue: value.blue,
        alpha: value.alpha,
      });
      delete this.component.mixed;
      this.updateEvent.emit({
        originalEvent: val,
        component: this.component,
      });
    });
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    if (this.component?.mixed) {
      this._rgbaString = 'rgba(255, 255, 255, 1)';
      const tmp = this.component;
      this.component = null; // This skips the handler above, so the color stays as is
      this.control.setValueFrom(this._rgbaString);
      this.component = tmp;
      this.cdr.markForCheck();
    } else {
      this.ngOnChanges({ component: new SimpleChange(this.component, this.component, false) });
    }
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.component || !this.component) return;
    const val = this.component ? this.component : null;
    if (val && typeof val === 'object') {
      const parts = [val.red, val.green, val.blue, val.alpha];
      this._rgbaString = this.component.mixed ? 'rgba(255, 255, 255, 1)' : `rgba(${parts.join(',')})`;
      const wasMixed = this.component?.mixed;
      this.control.setValueFrom(this._rgbaString);
      this.component.mixed = wasMixed;
      if (!this.component.mixed) delete this.component.mixed;
    }
    this.cdr.markForCheck();
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }
}
