import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  OnDestroy,
  NgZone,
  ChangeDetectionStrategy,
} from '@angular/core';

/**
 * Abstract component which is able to handle resizes.
 * Pass the (mousedown), (window:mousemove) and (window:mouseup) handlers to
 * your resize element.
 *
 * @export
 * @abstract
 * @class ResizableComponent
 */
@Component({
  moduleId: module.id.toString(),
  templateUrl: 'resizable.html',
  selector: 'yame-resizable',
  styles: ['div { width: 100%; height: 100%; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResizableComponent implements OnChanges, AfterViewInit, OnDestroy {
  /**
   * The click position
   */
  protected position: { x: number; y: number } | null = null;

  /**
   * The clicked value
   */
  private clickedVal!: number;

  /**
   * The property value on click.
   */
  protected propVal!: number;

  /**
   * @private
   * @type {boolean} isVer Whether the property has to be calculated clientY.
   */
  protected isVer = false;

  @Output() sizeUpdated = new EventEmitter();
  @Input() property!: string;
  @Input() minVal!: number;
  @Input() maxVal!: number;

  protected onMouseDownBind: (event: MouseEvent) => void;
  protected onMouseMoveBind: (event: MouseEvent) => void;
  protected onMouseUpBind: (event: MouseEvent) => void;

  /**
   * Creates an instance of ResizableComponent.
   *
   * @param {ElementRef} ref Injected by angular
   */
  constructor(public ref: ElementRef, protected zone: NgZone) {
    this.onMouseDownBind = this.onMouseDown.bind(this);
    this.onMouseMoveBind = this.onMouseMove.bind(this);
    this.onMouseUpBind = this.onMouseUp.bind(this);
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.property) {
      this.isVer = ['top', 'bottom', 'height'].indexOf(this.property) >= 0;
      this.updateFromStyle();
    }
  }

  /**
   * Adds the mouse listeners to the relevant elements.
   */
  addListeners(): void {
    const elem = <HTMLElement>this.ref.nativeElement;
    if (elem.childNodes.length > 0) {
      const resizer = elem.querySelector('.resizer') as HTMLElement;
      if (resizer) resizer.addEventListener('mousedown', this.onMouseDownBind);
    } else elem.addEventListener('mousedown', this.onMouseDownBind);
  }

  /**
   * Removes the previously mouse listeners from the respective elements.
   */
  removeListeners(): void {
    if (this.position) this.onMouseUp();
    const elem = <HTMLElement>this.ref.nativeElement;
    if (elem.childNodes.length > 0) {
      const resizer = elem.querySelector('.resizer') as HTMLElement;
      if (resizer) resizer.removeEventListener('mousedown', this.onMouseDownBind);
    } else elem.addEventListener('mousedown', this.onMouseDownBind);
    window.removeEventListener('mouseup', this.onMouseUpBind);
  }

  /**
   * Starts the resizing.
   * @param {MouseEvent} event
   */
  onMouseDown(event: MouseEvent): void {
    this.zone.runOutsideAngular(() => {
      // Prevents text selection
      event.preventDefault();
      // Cache the clicked position
      this.position = {
        x: event.clientX,
        y: event.clientY,
      };
      this.clickedVal = this.propVal;
      window.addEventListener('mousemove', this.onMouseMoveBind);
      window.addEventListener('mouseup', this.onMouseUpBind);
    });
  }

  /**
   * Resizes component.
   * @param {MouseEvent} event
   */
  onMouseMove(event: MouseEvent): void {
    if (this.position) {
      let diff = 0;
      if (this.isVer) diff = event.clientY - this.position.y;
      else diff = event.clientX - this.position.x;
      if (this.property === 'bottom')
        diff *= -1;
      // Add the difference and clamp
      const newVal = this.clampValue(this.clickedVal + diff);
      // Skip if nothing changed
      if (Math.abs(this.clickedVal - newVal) === 0) return;
      this.updateValue(newVal);
    }
  }

  /** Stops the resizing. */
  onMouseUp(): void {
    if (this.position) {
      this.zone.runOutsideAngular(() => {
        this.position = null;
        window.removeEventListener('mousemove', this.onMouseMoveBind);
        window.removeEventListener('mouseup', this.onMouseUpBind);
      });
    }
  }

  /** Handles window resize event. */
  onResize(): void {
    const style = window.getComputedStyle(this.ref.nativeElement);
    const newVal = parseFloat(style.getPropertyValue(this.property));
    this.updateValue(this.clampValue(newVal));
  }

  /**
   * Updates the css property to the given value.
   * @param {number} newVal
   */
  updateValue(newVal: number): void {
    this.propVal = newVal;
    this.ref.nativeElement.style[this.property] = `${newVal}px`;
    this.sizeUpdated.emit(newVal);
  }

  /**
   * Clamps the given value the the currently set constraints.
   * @param {number} value
   * @returns {number}
   */
  clampValue(value: number): number {
    if (this.minVal >= 0) value = isNaN(value) ? this.minVal : Math.max(value, this.minVal);
    if (this.maxVal >= 0) value = isNaN(value) ? this.maxVal : Math.min(value, this.maxVal);
    return value;
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit() {
    this.zone.runOutsideAngular(() => {
      this.addListeners();
      setTimeout(() => this.updateFromStyle());
    });
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this.zone.runOutsideAngular(() => this.removeListeners());
  }

  /**
   * Runs an update based on the current style value of the property
   */
  protected updateFromStyle(): void {
    const style = window.getComputedStyle(this.ref.nativeElement);
    const val = parseFloat(style.getPropertyValue(this.property));
    this.updateValue(this.clampValue(val));
  }

  /**
   * @readonly
   * @type number
   */
  get propertyValue(): number {
    return this.propVal;
  }
}
