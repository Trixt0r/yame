import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

/**
 * Abstract component which is able to handle resizes.
 * Pass the (mousedown), (window:mousemove) and (window:mouseup) handlers to
 * your resize element.
 *
 * @export
 * @abstract
 * @class ResizeableComponent
 */
@Component({
  moduleId: module.id,
  templateUrl: 'resizable.html',
  selector: 'resizable',
  providers: null,
  styles: ['div { witdh: 100%; height: 100%; }']
})
export class ResizeableComponent implements OnChanges, AfterViewInit {

  /**
   * @protected
   * @type {{ x: number, y: number }} position The click position
   */
  protected position: { x: number, y: number };

  /**
   * @private
   * @type {number} The clicked value
   */
  private clickedVal: number;

  /**
   * @private
   * @type {number} number The property value on click.
   */
  protected propVal: number;

  /**
   * @private
   * @type {boolean} isVer Whether the property has to be calculated clientY.
   */
  protected isVer: boolean = false;

  @Output() sizeUpdated = new EventEmitter();
  @Input() property: string;
  @Input() minVal: number;
  @Input() maxVal: number;

  /**
   * Creates an instance of ResizeableComponent.
   *
   * @param {ElementRef} ref Injected by angular
   */
  constructor(public ref: ElementRef) {
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.property) {
      this.isVer = ['top', 'bottom', 'height'].indexOf(this.property) >= 0;
      this.updateFromStyle();
    }
  }

  /**
   * Starts the resizing.
   * @param {MouseEvent} event
   */
  onMouseDown(event: MouseEvent): void {
    // Cache the clicked position
    this.position = {
      x: event.clientX,
      y: event.clientY
    };
    this.clickedVal = this.propVal;
    // Prevents text selection
    event.preventDefault();
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
      // Add the difference and clamp
      let newVal = this.clampValue(this.clickedVal + diff);
      // Skip if nothing changed
      if (Math.abs(this.clickedVal - newVal) === 0) return;
      this.updateValue(newVal);
    }
  }

  /** Stops the resizing. */
  onMouseUp(): void {
    if (this.position)
      this.position = null;
  }

  /** Handles window resize event. */
  onResize(): void {
    let style = window.getComputedStyle(this.ref.nativeElement);
    let newVal = parseFloat(style.getPropertyValue(this.property));
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

  /** @inheritdoc */
  ngAfterViewInit() {
    setTimeout(() => this.updateFromStyle());
  }

  /**
   * Runs an update based on the current style value of the property
   *
   * @private
   */
  private updateFromStyle() {
    let style = window.getComputedStyle(this.ref.nativeElement);
    let val = parseFloat(style.getPropertyValue(this.property));
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
