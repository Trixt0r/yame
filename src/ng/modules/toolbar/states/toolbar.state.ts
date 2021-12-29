import {
  ConnectionPositionPair,
  FlexibleConnectedPositionStrategy,
  FlexibleConnectedPositionStrategyOrigin,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import { lastValueFrom } from 'rxjs';
import { ToolbarException } from '../exception';
import { Tool, ToolType } from '../tool';
import {
  ActivateTool,
  DeactivateTool,
  RegisterTool,
  ShowToolbarOptions,
  UpdateToolbarUI,
} from './actions/toolbar.action';

export interface IToolbarUISettings {
  /**
   * The width of the toolbar buttons.
   */
  width: number;

  /**
   * The overall width of the toolbar.
   */
  fullWidth: number;

  /**
   * Whether the current tool's settings are collapsed or not.
   */
  collapsed: boolean;
}

const DEFAULT_TOOLBAR_WIDTH = 200;

export interface IToolbarState {
  /**
   * A list of all available tools.
   */
  tools: Tool[];

  /**
   * The currently activated tool.
   */
  activeTool: Tool | null;

  /**
   * GUI specific state.
   */
  ui: IToolbarUISettings;
}

@State<IToolbarState>({
  name: 'toolbar',
  defaults: {
    tools: [],
    activeTool: null,
    ui: {
      width: 48,
      fullWidth: DEFAULT_TOOLBAR_WIDTH,
      collapsed: true,
    },
  },
})
@Injectable()
export class ToolbarState {
  /**
   * Returns the currently registered tools.
   */
  @Selector()
  static tools(state: IToolbarState): Tool[] {
    return state.tools;
  }

  /**
   * Returns the currently activated tool.
   */
  @Selector()
  static activeTool(state: IToolbarState): Tool | null {
    return state.activeTool;
  }

  @Selector()
  static ui(state: IToolbarState): IToolbarUISettings {
    return state.ui;
  }

  /**
   * The current overlay reference.
   */
  overlayRef: OverlayRef;

  constructor(protected overlay: Overlay, protected store: Store) {
    this.overlayRef = this.overlay.create({ hasBackdrop: true, backdropClass: '' });
    this.overlayRef.backdropClick().subscribe(() => {
      if (this.overlayRef.hasAttached()) this.overlayRef.detach();
    });
  }

  /**
   * Returns the position strategy for the given origin.
   */
  getPositionStrategy(origin: FlexibleConnectedPositionStrategyOrigin): FlexibleConnectedPositionStrategy {
    return this.overlay
      .position()
      .flexibleConnectedTo(origin)
      .withPush(false)
      .withPositions([
        new ConnectionPositionPair(
          { originX: 'start', originY: 'center' },
          { overlayX: 'start', overlayY: 'center' },
          this.store.snapshot().toolbar.ui.width
        ),
      ]);
  }

  @Action(RegisterTool)
  async register(ctx: StateContext<IToolbarState>, action: RegisterTool): Promise<void> {
    const state = ctx.getState();
    const tools = state.tools.slice();
    const toRegister = Array.isArray(action.tool) ? action.tool : [action.tool];
    toRegister.forEach(tool => {
      const found = tools.find(it => it.id === tool.id);
      if (found) return console.warn(`[Toolbar] A tool with id ${tool.id} is already registered`);
      tools.push(tool);
    });
    ctx.patchState({ tools });
  }

  @Action(ActivateTool)
  async activate(ctx: StateContext<IToolbarState>, action: ActivateTool): Promise<void> {
    const state = ctx.getState();
    const tools = state.tools;
    const id = typeof action.tool === 'string' ? action.tool : action.tool.id;
    const activeTool = tools.find(it => it.id === id);
    if (!activeTool) throw new ToolbarException(`Could not find tool '${id}'.`);
    if (state.activeTool?.id === id) return;
    if (state.activeTool && activeTool.type === ToolType.TOGGLE) {
      await lastValueFrom(ctx.dispatch(new DeactivateTool(state.activeTool, action.event)));
    }
    await activeTool.activate(action.event);
    if (activeTool.type === ToolType.TOGGLE) ctx.patchState({ activeTool });
  }

  @Action(DeactivateTool)
  async deactivate(ctx: StateContext<IToolbarState>, action: DeactivateTool): Promise<void> {
    const state = ctx.getState();
    const activeTool = state.activeTool;
    if (!activeTool) return console.warn('[Toolbar] No tool active');
    await activeTool.deactivate(action.event);
    ctx.patchState({ activeTool: null });
  }

  @Action(ShowToolbarOptions)
  showOverlay(_ctx: StateContext<IToolbarState>, action: ShowToolbarOptions): void {
    if (action.origin) this.overlayRef.updatePositionStrategy(this.getPositionStrategy(action.origin));
    const portal = new ComponentPortal(action.component);
    if (this.overlayRef.hasAttached()) this.overlayRef.detach();
    this.overlayRef.attach(portal);
  }

  @Action(UpdateToolbarUI)
  updateUI(ctx: StateContext<IToolbarState>, action: UpdateToolbarUI): void {
    const ui = ctx.getState().ui;
    ctx.patchState({ ui: { ...ui, ...action.properties } });
  }
}
