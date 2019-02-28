import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  HostBinding,
  HostListener,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from '@angular/core';
import { RippleAnimationConfig } from '@angular/material';
import { ToolbarService } from './service';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';

/**
 * The toolbar renders all tools.
 * This component is meant to be opened or closed in the editor.
 * Changing the opened state of the component will trigger the corresponding events on it.
 *
 * @class ToolbarComponent
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-toolbar',
  templateUrl: 'component.html',
  styleUrls: ['component.scss'],
  animations: [
    trigger('state', [
      state('open', style({ transform: 'translateX(0)' })),
      state('closed', style({ transform: 'translateX(calc(-100% + 15px))' })),
      transition('open => closed, closed => open', animate('100ms ease-in')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements OnChanges {
  /** @type {'open' | 'closed'} The internal state for animating the component. */
  @HostBinding('@state') protected state = 'closed';

  /** @type {boolean} Whether the toolbar is opened or closed. */
  @Input('open') open = false;

  /** @type {EventEmitter} Event which gets emitted when the toolbar gets opened. */
  @Output('opening') opening = new EventEmitter();

  /** @type {EventEmitter} Event which gets emitted when the toolbar has been opened. */
  @Output('opened') opened = new EventEmitter();

  /** @type {EventEmitter} Event which gets emitted when the toolbar gets closed. */
  @Output('closing') closing = new EventEmitter();

  /** @type {EventEmitter} Event which gets emitted when the toolbar has been closed. */
  @Output('closed') closed = new EventEmitter();

  /** @type {RippleAnimationConfig} The ripple animation config for the toggle button. */
  rippleAnimationConfig: RippleAnimationConfig = {
    enterDuration: 100,
    exitDuration: 100,
  };

  constructor(public ref: ElementRef, public service: ToolbarService) {}

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.open) this.updateState();
  }

  /**
   * Toggles the toolbar, either from open to closed or vice versa.
   */
  toggle(): void {
    this.open = !this.open;
    this.updateState();
  }

  /**
   * Updates the animation state based on the open flag.
   *
   * @protected
   */
  protected updateState() {
    if (this.open) this.state = 'open';
    else this.state = 'closed';
  }

  /**
   * Handles the animation start when either opening or closing the toolbar.
   *
   * @param {AnimationEvent} event
   */
  @HostListener('@state.start', ['$event'])
  stateAnimStart(event: AnimationEvent): void {
    if (event.toState === 'open') this.opening.emit();
    else if (event.toState === 'closed') this.closing.emit();
  }

  /**
   * Handles the animation end when either opening or closing the toolbar.
   *
   * @param {AnimationEvent} event
   */
  @HostListener('@state.done', ['$event'])
  stateAnimDone(event: AnimationEvent): void {
    if (event.toState === 'open') this.opened.emit();
    else if (event.toState === 'closed') this.closed.emit();
  }
}
