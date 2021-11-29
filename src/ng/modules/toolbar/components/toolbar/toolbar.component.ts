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
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import { animate, AnimationEvent, state, style, transition, trigger } from '@angular/animations';
import { Select, Store } from '@ngxs/store';
import { ToolbarState } from '../../states/toolbar.state';
import { Observable, Subject } from 'rxjs';
import { Tool, ToolType } from '../../tool';
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
  selector: 'yame-toolbar',
  templateUrl: 'toolbar.component.html',
  styleUrls: ['toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarComponent implements OnChanges, OnDestroy, AfterViewInit {
  /**
   * The height of the toolbar.
   */
  @Input('height') height: number = 0;

  /**
   * Selects the current active tool.
   */
  @Select(ToolbarState.activeTool) activeTool$!: Observable<Tool>;

  /**
   * Selects the current tools.
   */
  @Select(ToolbarState.tools) tools$!: Observable<Tool[]>;

  /**
   * A list of current tools which can be toggled.
   */
  tools: Tool[] = [];

  /**
   * A list of clickable tools.
   */
  clickers: Tool[] = [];

  /**
   * The current toolbar width.
   */
  width = 48;

  /**
   * Triggered as soon as this component gets removed
   */
  protected destroy$ = new Subject();

  constructor(public ref: ElementRef<HTMLElement>, public store: Store, cdr: ChangeDetectorRef) {
    this.tools$.pipe(takeUntil(this.destroy$)).subscribe((tools) => {
      this.tools = tools.filter((it) => it.type === ToolType.TOGGLE).sort((a, b) => a.position - b.position);
      this.clickers = tools.filter((it) => it.type === ToolType.CLICK).sort((a, b) => b.position - a.position);
      cdr.markForCheck();
    });
  }

  /**
   * Activates the given tool.
   *
   * @param tool The tool.
   * @param event The triggered DOM event.
   */
  activate(tool: Tool, event: Event): void {
    this.store.dispatch(new ActivateTool(tool, event));
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    const tools = this.tools.filter((it) => it.type === ToolType.TOGGLE);
    if (tools.length === 0) return;
    this.store.dispatch(new ActivateTool(tools[0])).toPromise();
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
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
