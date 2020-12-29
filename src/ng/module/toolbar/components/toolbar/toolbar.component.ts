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
  ChangeDetectorRef,
  OnDestroy,
} from '@angular/core';
import { RippleAnimationConfig } from '@angular/material/core';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { Select, Store } from '@ngxs/store';
import { ToolbarState } from '../../states/toolbar.state';
import { Observable, Subject } from 'rxjs';
import { Tool } from '../../tool';
import { ActivateTool } from '../../states/actions/toolbar.action';
import { takeUntil } from 'rxjs/operators';

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
  templateUrl: 'toolbar.component.html',
  styleUrls: ['toolbar.component.scss'],
  animations: [
    trigger('state', [
      state('open', style({ transform: 'translateX(0)' })),
      state('closed', style({ transform: 'translateX(calc(-100% + 15px))' })),
      transition('open => closed, closed => open', animate('100ms ease-in')),
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolbarComponent implements OnChanges, OnDestroy {
  /**
   * The internal state for animating the component.
   */
  @HostBinding('@state') protected state: 'open' | 'closed' = 'closed';

  /**
   * Whether the toolbar is opened or closed.
   */
  @Input('open') open = false;

  @Input('height') height!: number;

  /**
   * Event which gets emitted when the toolbar gets opened.
   */
  @Output('opening') opening = new EventEmitter();

  /**
   * Event which gets emitted when the toolbar has been opened.
   */
  @Output('opened') opened = new EventEmitter();

  /**
   * Event which gets emitted when the toolbar gets closed.
   */
  @Output('closing') closing = new EventEmitter();

  /**
   * Event which gets emitted when the toolbar has been closed.
   */
  @Output('closed') closed = new EventEmitter();

  /**
   * The ripple animation config for the toggle button.
   */
  rippleAnimationConfig: RippleAnimationConfig = {
    enterDuration: 100,
    exitDuration: 100,
  };

  /**
   * Selects the current tools.
   */
  @Select(ToolbarState.tools) tools$!: Observable<Tool[]>;

  /**
   * A list of current tools.
   */
  tools: Tool[] = [];

  /**
   * Triggered as soon as this component gets removed
   */
  protected destroy$ = new Subject();

  constructor(public ref: ElementRef, public store: Store, cdr: ChangeDetectorRef) {
    this.tools$.pipe(takeUntil(this.destroy$)).subscribe((tools) => {
      this.tools = tools;
      cdr.markForCheck();
    });
  }

  /**
   * Updates the animation state based on the open flag.
   */
  protected updateState() {
    if (this.open) this.state = 'open';
    else this.state = 'closed';
  }

  activate(tool: Tool) {
    this.store.dispatch(new ActivateTool(tool));
  }

  /**
   * Toggles the toolbar, either from open to closed or vice versa.
   */
  toggle(): void {
    this.open = !this.open;
    this.updateState();
  }

  /**
   * Handles the animation start when either opening or closing the toolbar.
   *
   * @param event
   */
  @HostListener('@state.start', ['$event'])
  stateAnimStart(event: AnimationEvent): void {
    if (event.toState === 'open') this.opening.emit();
    else if (event.toState === 'closed') this.closing.emit();
  }

  /**
   * Handles the animation end when either opening or closing the toolbar.
   *
   * @param event
   */
  @HostListener('@state.done', ['$event'])
  stateAnimDone(event: AnimationEvent): void {
    if (event.toState === 'open') this.opened.emit();
    else if (event.toState === 'closed') this.closed.emit();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.open) this.updateState();
    if (changes.height) this.ref.nativeElement.style['height'] = `${changes.height.currentValue}px`;
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
