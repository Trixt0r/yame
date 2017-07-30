import { Component, ElementRef, EventEmitter, Output, Input, SimpleChanges, OnChanges } from '@angular/core';
import { AbstractComponent } from "../../../component/abstract";

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
export class ResizeableComponent extends AbstractComponent implements OnChanges {

  /**
   * @protected
   * @type {{ x: number, y: number }} The click position
   */
  protected position: { x: number, y: number }

  /**
   * @private
   * @type {number} number The property value on click.
   */
  private propVal: number;

  /**
   * @private
   * @type {boolean} isVer Whether the property has to be calculated clientY.
   */
  private isVer: boolean = false;

  @Output() sizeUpdated = new EventEmitter();
  @Input() property: string;
  @Input() minVal: number;
  @Input() maxVal: number;

  /**
   * Creates an instance of ResizeableComponent.
   *
   * @param {ElementRef} ref Injected by angular
   * @param {string} property The css property to manipulate, e.g. 'left'
   * @param {number} [minVal=-1] The minimal value, -1 for no minVal
   * @param {number} [maxVal=-1] The maximum value, -1 for no maxVal
   */
  constructor(protected ref: ElementRef) {
    super(ref);
  }

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.property)
      this.isVer = ['top', 'bottom', 'height'].indexOf(this.property) >= 0;
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
    // Cache the css value
    this.propVal = parseFloat($(this.ref.nativeElement).css(this.property));
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
      let newVal = this.clampValue(this.propVal + diff);
      // Skip if nothing changed
      if (Math.abs(this.propVal - newVal) === 0) return;
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
    let newVal = parseFloat($(this.ref.nativeElement).css(this.property));
    this.updateValue(this.clampValue(newVal));
  }

  /**
   * Updates the css property to the given value.
   * @param {number} newVal
   */
  updateValue(newVal: number): void {
    this.$el.css(this.property, newVal);
    this.sizeUpdated.emit(newVal);
  }

  /**
   * Clamps the given value the the currently set constraints.
   * @param {number} value
   * @returns {number}
   */
  clampValue(value: number): number {
    let newVal = value;
    if (this.minVal >= 0) newVal = Math.max(newVal, this.minVal);
    if (this.maxVal >= 0) newVal = Math.min(newVal, this.maxVal);
    return newVal;
  }

  ngAfterViewInit() {
    setTimeout(() => this.updateValue(this.clampValue( parseFloat(this.$el.css(this.property)))));
  }
}
