import { Component, OnDestroy, Optional, Self, ElementRef, Input, ChangeDetectionStrategy, EventEmitter, Output } from '@angular/core';
import { ControlValueAccessor, NgControl, FormGroup, FormBuilder } from '@angular/forms';
import { MatFormFieldControl } from '@angular/material/form-field';
import { Subject } from 'rxjs';
import { FocusMonitor } from '@angular/cdk/a11y';
import { coerceBooleanProperty } from '@angular/cdk/coercion';
import { IPoint } from 'common/interface/point';
import * as _ from 'lodash';

/**
 * The point input component displays a point's values in an input field on the same line.
 *
 * Usage:
 * ```html
 * <point-input type="number"
 *              delimiter=";"
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
  providers: [{provide: MatFormFieldControl, useExisting: PointInputComponent}],
  host: {
    '[id]': 'id',
    '[attr.aria-describedby]': 'describedBy',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointInputComponent implements ControlValueAccessor, MatFormFieldControl<IPoint>, OnDestroy {

  /**
   * The next component input id.
   */
  static nextId = 0;

  /**
   * The parts of this input.
   */
  parts: FormGroup;

  /**
   * @inheritdoc
   */
  stateChanges = new Subject<void>();

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
   * @inheritdoc
   */
  get empty() {
    const { value: { x, y } } = this.parts;
    return (_.isNil(x) || x === '') && (y === '' || _.isNil(y));
  }

  /**
   * @inheritdoc
   */
  get shouldLabelFloat() { return this.focused || !this.empty; }

  /**
   * Input event triggered by number directive.
   */
  @Output() input: EventEmitter<Event> = new EventEmitter();

  /**
   * The internal input type.
   */
  @Input() type: string = 'text';

  /**
   * The delimiter between x and y. Default will be `,`.
   */
  @Input() delimiter: string = ',';

  /**
   * @inheritdoc
   */
  @Input()
  get placeholder(): string { return this._placeholder; }

  /**
   * @inheritdoc
   */
  set placeholder(value: string) {
    this._placeholder = value;
    this.stateChanges.next();
  }

  /**
   * Internal `placeholder` value.
   */
  private _placeholder: string;

  /**
   * @inheritdoc
   */
  @Input()
  get required(): boolean { return this._required; }

  /**
   * @inheritdoc
   */
  set required(value: boolean) {
    this._required = coerceBooleanProperty(value);
    this.stateChanges.next();
  }

  /**
   * Internal `required` value.
   */
  private _required = false;

  /**
   * @inheritdoc
   */
  @Input()
  get disabled(): boolean { return this._disabled; }

  /**
   * @inheritdoc
   */
  set disabled(value: boolean) {
    this._disabled = coerceBooleanProperty(value);
    this._disabled ? this.parts.disable() : this.parts.enable();
    this.stateChanges.next();
  }

  /**
   * Internal `disabled` value.
   */
  private _disabled = false;

  /**
   * @inheritdoc
   */
  @Input()
  get value(): IPoint | null {
    const { value: { x, y } } = this.parts;
    const xValid = typeof x === 'number' || (typeof x === 'string' && x.length > 0);
    const yValid = typeof y === 'number' || (typeof y === 'string' && y.length > 0);
    if (xValid && yValid) {
      return {
        x: typeof x === 'string' ? parseFloat(x.replace(',', '.')) : x,
        y: typeof y === 'string' ? parseFloat(y.replace(',', '.')) : y,
      };
    }
    return null;
  }

  /**
   * @inheritdoc
   */
  set value(point: IPoint | null) {
    const { x, y } = point || { x: 0, y: 0 };
    if (x === void 0 || y === void 0) return;
    this.parts.setValue({ x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 });
    this.stateChanges.next();
  }

  constructor(
    formBuilder: FormBuilder,
    private _focusMonitor: FocusMonitor,
    private _elementRef: ElementRef<HTMLElement>,
    @Optional() @Self() public ngControl: NgControl) {

    this.parts = formBuilder.group({
      x: 0,
      y: 0,
    });

    _focusMonitor.monitor(_elementRef, true).subscribe(origin => {
      if (this.focused && !origin) {
        this.onTouched();
      }
      this.focused = !!origin;
      this.stateChanges.next();
    });

    if (this.ngControl != null) {
      this.ngControl.valueAccessor = this;
    }
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this.stateChanges.complete();
    this._focusMonitor.stopMonitoring(this._elementRef);
  }

  /**
   * @inheritdoc
   */
  setDescribedByIds(ids: string[]) {
    this.describedBy = ids.join(' ');
  }

  /**
   * @inheritdoc
   */
  onContainerClick(event: MouseEvent) {
    if ((event.target as Element).tagName.toLowerCase() !== 'input') {
      this._elementRef.nativeElement.querySelector('input')!.focus();
    }
  }

  /**
   * @inheritdoc
   */
  writeValue(point: IPoint | null): void {
    this.value = point;
  }

  /**
   * @inheritdoc
   */
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  /**
   * @inheritdoc
   */
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  /**
   * @inheritdoc
   */
  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  /**
   * Handles the input.
   */
  _handleInput(): void {
    this.onChange(this.parts.value);
  }
}
