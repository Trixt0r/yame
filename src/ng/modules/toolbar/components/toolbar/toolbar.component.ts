import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  HostBinding,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  OnDestroy,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { IToolbarUISettings, ToolbarState } from '../../states/toolbar.state';
import { Observable, Subject } from 'rxjs';
import { Tool, ToolType } from '../../tool';
import { ActivateTool, UpdateToolbarUI } from '../../states/actions/toolbar.action';
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
  @Input() height = 0;

  /**
   * Selects the current active tool.
   */
  @Select(ToolbarState.activeTool) activeTool$!: Observable<Tool>;

  /**
   * Selects the current tools.
   */
  @Select(ToolbarState.tools) tools$!: Observable<Tool[]>;

  /**
   * Selects the current toolbar width.
   */
  @Select(ToolbarState.ui) ui$!: Observable<IToolbarUISettings>;

  /**
   * The currently activated tool.
   */
  activeTool?: Tool;

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
  get width(): number {
    return this._width;
  }

  @Input() set width(width: number) {
    this.store.dispatch(new UpdateToolbarUI({ width }));
  }

  get settingsCollapsed(): boolean {
    return this._width <= this.minWidth;
  }

  readonly minWidth = 48;

  readonly threshold = 150;

  /**
   * Triggered as soon as this component gets removed
   */
  protected destroy$ = new Subject<void>();

  @HostBinding('style.width.px')
  private _width = 0;

  constructor(public ref: ElementRef<HTMLElement>, public store: Store, private cdr: ChangeDetectorRef) {
    this.tools$.pipe(takeUntil(this.destroy$)).subscribe((tools) => {
      this.tools = tools.filter((it) => it.type === ToolType.TOGGLE).sort((a, b) => a.position - b.position);
      this.clickers = tools.filter((it) => it.type === ToolType.CLICK).sort((a, b) => b.position - a.position);
      cdr.markForCheck();
    });
    this.activeTool$.pipe(takeUntil(this.destroy$)).subscribe((tool) => {
      this.activeTool = tool;
      this.cdr.markForCheck();
    });
    this.ui$.pipe(takeUntil(this.destroy$)).subscribe((ui) => {
      this._width = ui.width;
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
    if (this.activeTool?.id === tool.id) {
      this.width = this.settingsCollapsed ? this.minWidth + this.threshold : this.minWidth;
    }
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
