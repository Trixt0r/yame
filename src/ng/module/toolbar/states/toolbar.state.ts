
import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { ToolbarException } from '../exception';
import { Tool } from '../tool';
import { ActivateTool, DeactivateTool, RegisterTool } from './actions/toolbar.action';

export interface IToolbarState {

  /**
   * A list of all available tools.
   */
  tools: Tool[];

  /**
   * The currently activated tool.
   */
  activeTool: Tool | null;
}

@State<IToolbarState>({
  name: 'toolbar',
  defaults: {
    tools: [],
    activeTool: null,
  }
})
@Injectable()
export class ToolbarState {

  /**
   * Returns the currently registered tools.
   */
  @Selector()
  static tools(state: IToolbarState) {
    return state.tools;
  }

  /**
   * Returns the currently activated tool.
   */
  @Selector()
  static activeTool(state: IToolbarState) {
    return state.activeTool;
  }

  @Action(RegisterTool)
  async register(ctx: StateContext<IToolbarState>, action: RegisterTool) {
    const state = ctx.getState();
    console.log(state);
    const tools = state.tools.slice();
    const toRegister = Array.isArray(action.tool) ? action.tool : [action.tool];
    toRegister.forEach(tool => {
      const found = tools.find(it => it.id === tool.id);
      if (found) return console.warn(`[Toolbar] A tool with id ${tool.id} is already registered`);
      tools.push(tool);
    });
    ctx.patchState({ tools });
    if (!state.activeTool && tools.length > 0)
      await ctx.dispatch(new ActivateTool(tools[0])).toPromise();
  }

  @Action(ActivateTool)
  async activate(ctx: StateContext<IToolbarState>, action: ActivateTool) {
    const state = ctx.getState();
    const tools = state.tools;
    const id = typeof action.tool === 'string' ? action.tool : action.tool.id;
    const activeTool = tools.find(it => it.id === id);
    if (!activeTool) throw new ToolbarException(`Could not find tool '${id}'.`);
    if (state.activeTool?.id === id) return;
    if (state.activeTool) {
      await ctx.dispatch(new DeactivateTool(state.activeTool)).toPromise();
    }
    await activeTool.activate();
    return ctx.patchState({ activeTool });
  }

  @Action(DeactivateTool)
  async deactivate(ctx: StateContext<IToolbarState>, action: DeactivateTool) {
    const state = ctx.getState();
    const activeTool = state.activeTool;
    if (!activeTool) return console.warn('[Toolbar] No tool active');
    await activeTool.deactivate();
    return ctx.patchState({ activeTool: null });
  }



}