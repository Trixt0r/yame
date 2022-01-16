import {
  Component,
  OnDestroy,
  Optional,
  Self,
  ElementRef,
  Input,
  ChangeDetectionStrategy,
  EventEmitter,
  Output,
  ViewEncapsulation,
} from '@angular/core';
import { ControlValueAccessor, NgControl, FormGroup, FormBuilder } from '@angular/forms';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { IPoint } from 'common/math';

/**
 * The point input component displays a point's values in an input field on the same line.
 *
 * Usage:
 * ```html
 * <point-input type="number"
 *              (input)=update($event)
 *              [value]="point || { x: 0, y: 0 }"
 *              [placeholder]="placeholder"
 *              [disabled]="disabled"
 *              [required]="required"></point-input>
 * ```
 */
@Component({
  selector: 'point-input',
  templateUrl: 'point-input.component.html',
  styleUrls: ['./point-input.component.scss'],
  host: {
    '[id]': 'id',
    '[attr.aria-describedby]': 'describedBy',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class PointInputComponent implements ControlValueAccessor, OnDestroy {
  /**
   * The next component input id.
   */
  static nextId = 0;

  /**
   * The parts of this input.
   */
  parts: FormGroup;

  /**
   * Whether this component is focused or not.
   */
  focused = false;

  /**
   * The error state.
   */
  errorState = false;

  /**
   * @inheritdoc
   */
  controlType = 'point-input';

  /**
   * @inheritdoc
   */
  id = `point-input-${PointInputComponent.nextId++}`;

  /**
   * Sets the `aria-describedby` attribute.
   */
  describedBy = '';

  /**
   * The on change handler.
   */
  onChange = (_: any) => {};

  /**
   * The on touched handler.
   */
  onTouched = () => {};

  /**
   * Input event triggered by number directive.
   */
  @Output() input: EventEmitter<Event> = new EventEmitter();

  /**
   * The internal input type.
   */
  @Input() type: string = 'text';

  /**
   * @inheritdoc
   */
  @Input()
  get placeholder(): string {
    return this._placeholder;
  }

  /**
   * @inheritdoc
   */
  set placeholder(value: string) {
    this._placeholder = value;
  }

  /**
   * Internal `placeholder` value.
   */
  private _placeholder!: string;

  /**
   * @inheritdoc
   */
  @Input()
  get required(): boolean {
    return this._required;
  }

  /**
   * @inheritdoc
   */
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
  }

  /**
   * Internal `required` value.
   */
  private _required = false;

  /**
   * @inheritdoc
   */
  @Input()
  get disabled(): boolean {
    return this._disabled;
  }

  /**
   * @inheritdoc
   */
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
  }

  /**
   * Internal `disabled` value.
   */
  private _disabled = false;

  /**
   * @inheritdoc
   */
  @Input() get value(): IPoint {
    return this._value;
  }

  /**
   * @inheritdoc
   */
  set value(point: IPoint) {
    const { x, y } = point ?? { x: 0, y: 0 };
    if (x === void 0 || y === void 0) return;
    this.parts.setValue({ x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000 });
    this._value = { x, y };
    this.valueChange.next(this.value);
  }

  private _value: IPoint = { x: 0, y: 0 };

  /**
   * Emits as soon as the value changes.
   */
  @Output() valueChange = new EventEmitter<IPoint | null>();

  constructor(
    formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() public ngControl: NgControl
  ) {
    this.parts = formBuilder.group({ ...this._value });

    _focusMonitor.monitor(_elementRef, true).subscribe(origin => {
      if (this.focused && !origin) {
        this.onTouched();
      }
      this.focused = !!origin;
    });

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /**
   * @inheritdoc
   */
  writeValue(point: IPoint): void {
    this.value = point;
    console.log(this.value);
  }

  /**
   * @inheritdoc
   */
  registerOnChange(fn: any): void {
    console.log(fn);
    this.onChange = fn;
  }

  /**
   * @inheritdoc
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * Handles the input.
   */
  _handleInput(): void {
    const {
      value: { x, y },
    } = this.parts;
    const xx = typeof x === 'string' ? parseFloat(x.replace(',', '.')) : x;
    const yy = typeof y === 'string' ? parseFloat(y.replace(',', '.')) : y;
    this.value = { x: isNaN(xx) ? 0 : xx, y: isNaN(yy) ? 0 : yy };

    this.onChange(this.parts.value);
  }
}
