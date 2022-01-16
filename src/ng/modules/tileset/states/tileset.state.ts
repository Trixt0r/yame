import { Injectable } from '@angular/core';
import { Action, Selector, State, StateContext } from '@ngxs/store';
import { cloneDeep, merge } from 'lodash';
import { SaveTilesetSettings } from '.';
import { ITileset, ITilesetSetting } from '../interfaces';

export interface ITilesetState {
  tilesets: ITileset[];
}

export const DEFAULT_SETTINGS: Omit<ITilesetSetting, 'id' | 'label'> = {
  offset: { x: 0, y: 0 },
  selections: [{ x: 0, y: 0 }],
  size: { x: 16, y: 16 },
  spacing: { x: 0, y: 0 },
};

@State<ITilesetState>({
  name: 'tilset',
  defaults: {
    tilesets: [],
  },
})
@Injectable({ providedIn: 'root' })
export class TilesetState {
  @Selector() static tilesets(state: ITilesetState): ITileset[] {
    return state.tilesets;
  }

  @Action(SaveTilesetSettings)
  save(ctx: StateContext<ITilesetState>, action: SaveTilesetSettings): void {
    const tilesets = ctx.getState().tilesets.slice();
    let found = tilesets.find(_ => _.asset.id === action.asset.id);
    if (!found) {
      found = { asset: action.asset, settings: [] };
      tilesets.push(found);
    }
    const settings = [...found.settings];
    action.settings.forEach(_ => {
      const setting = settings.find(s => s.id === _.id);
      const clone = cloneDeep(_);
      if (!setting) settings.push(merge({ id: settings.length, label: 'default' }, cloneDeep(DEFAULT_SETTINGS), clone));
      else merge(setting, cloneDeep(_));
    });
    found.settings = settings;
    ctx.patchState({ tilesets });
  }
}
