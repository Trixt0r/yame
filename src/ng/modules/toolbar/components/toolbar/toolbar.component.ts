import {
  Component,
  ElementRef,
  Input,
  OnChanges,
  SimpleChanges,
  HostBinding,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  ViewEncapsulation,
  AfterViewInit,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { IToolbarUISettings, ToolbarState } from '../../states/toolbar.state';
import { merge, Observable } from 'rxjs';
import { Tool, ToolType } from '../../tool';
import { ActivateTool, UpdateToolbarUI } from '../../states/actions/toolbar.action';
import { takeUntil, tap } from 'rxjs/operators';
import { DestroyLifecycle, notify } from 'ng/modules/utils';

/**
 * The toolbar renders all tools.
 * This component is meant to be opened or closed in the editor.
 * Changing the opened state of the component will trigger the corresponding events on it.
 */
@Component({
  selector: 'yame-toolbar',
  templateUrl: 'toolbar.component.html',
  styleUrls: ['toolbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DestroyLifecycle],
})
export class ToolbarComponent implements OnChanges, AfterViewInit {
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
   * Selects the current toolbar ui state.
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

  @Input() set width(fullWidth: number) {
    this.store.dispatch(new UpdateToolbarUI({ width: this.minWidth, fullWidth }));
  }

  get settingsCollapsed(): boolean {
    return !this.activeTool?.settingsComponent || this._width <= this.minWidth;
  }

  readonly minWidth = 48;

  get threshold(): number {
    return this.activeTool?.settingsComponent ? this.activeTool?.settingsMinWidth ?? 150 : 0;
  }

  @HostBinding('style.width.px')
  private _width = 0;

  constructor(
    public ref: ElementRef<HTMLElement>,
    public store: Store,
    cdr: ChangeDetectorRef,
    destroy$: DestroyLifecycle
  ) {
    merge(
      this.tools$.pipe(
        tap(tools => {
          this.tools = tools.filter(it => it.type === ToolType.TOGGLE).sort((a, b) => a.position - b.position);
          this.clickers = tools.filter(it => it.type === ToolType.CLICK).sort((a, b) => b.position - a.position);
        })
      ),
      this.activeTool$.pipe(
        tap(tool => {
          this.activeTool = tool;
          this._width = this.minWidth + this.threshold;
        })
      ),
      this.ui$.pipe(tap(ui => (this._width = ui.fullWidth)))
    )
      .pipe(takeUntil(destroy$), notify(cdr))
      .subscribe();
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
    const tools = this.tools.filter(it => it.type === ToolType.TOGGLE);
    if (tools.length === 0) return;
    this.store.dispatch(new ActivateTool(tools[0]));
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.height) this.ref.nativeElement.style['height'] = `${changes.height.currentValue}px`;
  }
}
