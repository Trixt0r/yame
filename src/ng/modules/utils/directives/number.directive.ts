import { Directive, ViewContainerRef, HostListener, Output, EventEmitter, NgZone } from '@angular/core';

/**
 * Event which gets emitted on the number directive.
 */
interface NumberDirectiveEvent {
  /**
   * The initial DOM event.
   */
  event: Event;

  /**
   * The current value.
   */
  value: number;
}

/**
 * The number directive can be used to provide number input features
 * for changing the value, such as keyboard up/down arrow keys, mouse wheel and mouse move events.
 */
@Directive({
    selector: '[yameNumber]',
    host: {
        style: 'cursor: ew-resize',
    },
    standalone: false
})
export class NumberDirective {
  /**
   * Emits as soon as the value has been changed.
   */
  @Output() yameNumberInput: EventEmitter<NumberDirectiveEvent> = new EventEmitter();

  /**
   * Last clicked y position of the mouse.
   */
  protected clickedX: number | null = null;

  /**
   * Initial clicked value, when moving the mouse.
   */
  protected clickedValue: number | null = null;

  /**
   * The bound mouse move event handler.
   */
  protected onMouseMoveBound!: (event: MouseEvent) => void;

  /**
   * The value of the host input.
   */
  get value(): number {
    const input = this.vcr.element.nativeElement as HTMLInputElement;
    let re = parseFloat(input.value);
    if (isNaN(re)) re = 0;
    return re;
  }

  constructor(protected vcr: ViewContainerRef, protected zone: NgZone) {
    zone.runOutsideAngular(() => {
      this.onMouseMoveBound = this.onMouseMove.bind(this);
    });
  }

  /**
   * Processes the given value and event.
   * Call this for setting the value on the host input and emit the next event.
   *
   * @param value The new value.
   * @param event The source event.
   */
  process(value: number, event: Event): void {
    const input = this.vcr.element.nativeElement as HTMLInputElement;
    const val = Math.round(value * 1000) / 1000;
    input.value = String(val);
    this.yameNumberInput.next({ event, value: val });
  }

  /**
   * Handles the up and down arrow keys.
   *
   * @param event The triggered keyboard event.
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.keyCode === 38 || event.keyCode === 40) this.process(this.value + (event.keyCode === 38 ? 1 : -1), event);
  }

  /**
   * Handles the mouse wheel event.
   *
   * @param event The triggered wheel event.
   */
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    this.process(this.value - Math.sign(event.deltaY), event);
  }

  /**
   * Handles the mouse down event,
   * i.e. sets up values for changing the input via mouse movement.
   *
   * @param event The triggered mouse event.
   */
  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (event.which === 1) {
      this.clickedValue = this.value;
      this.clickedX = event.clientX;
      window.addEventListener('mousemove', this.onMouseMoveBound, { passive: true });
    }
  }

  /**
   * Handles the mouse move event on the window,
   * i.e. updates the value based on the distance between the current and the initially clicked mouse position.
   *
   * @param event The triggered event.
   */
  onMouseMove(event: MouseEvent): void {
    if (event.which !== 1) {
      this.clickedX = null;
      this.clickedValue = null;
      (this.vcr.element.nativeElement as HTMLInputElement).style.userSelect = '';
      window.removeEventListener('mousemove', this.onMouseMoveBound);
      return;
    }
    if (this.clickedX === null) return window.removeEventListener('mousemove', this.onMouseMoveBound);

    (this.vcr.element.nativeElement as HTMLInputElement).style.userSelect = 'none';
    this.process((this.clickedValue as number) + (event.clientX - this.clickedX), event);
  }
}
