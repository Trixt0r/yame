import { Asset } from 'common/asset';
import { State, Action, StateContext } from '@ngxs/store';
import { AddAsset, DeleteAsset, UpdateAsset } from './actions/asset.action';
import { merge } from 'lodash';

export interface IAssetState {
  assets: Asset[];
}

@State<IAssetState>({
  name: 'assets',
  defaults: {
    assets: []
  }
})
export class AssetState {

  @Action(AddAsset)
  addAsset(ctx: StateContext<IAssetState>, action: AddAsset) {
    const assets = ctx.getState().assets.slice();
    const toAdd = Array.isArray(action.asset) ? action.asset : [action.asset];
    const newAssets = toAdd.filter(asset => {
      const found = assets.find(it => it.id === asset.id);
      if (found) console.warn(`[Asset] Asset with ${found.id} already exists`);
      return !found;
    });
    if (newAssets.length === 0) return;
    newAssets.forEach(it => assets.push(it));
    return ctx.patchState({ assets });
  }

  @Action(DeleteAsset)
  removeAsset(ctx: StateContext<IAssetState>, action: DeleteAsset) {
    const assets = ctx.getState().assets.slice();
    const toRemove = Array.isArray(action.id) ? action.id : [action.id];
    const deletedAssets = toRemove.map(id => assets.find(it => it.id === id)).filter(it => !!it);
    if (deletedAssets.length === 0) return;
    deletedAssets.forEach(asset => {
      if (!asset) return;
      const idx = assets.indexOf(asset);
      if (idx >= 0) assets.splice(idx, 1);
    });
    return ctx.patchState({ assets });
  }

  @Action(UpdateAsset)
  updateAsset(ctx: StateContext<IAssetState>, action: UpdateAsset) {
    const assets = ctx.getState().assets.slice();
    const toUpdate = Array.isArray(action.asset) ? action.asset : [action.asset];
    toUpdate.forEach(update => {
      const found = assets.find(it => update.id === it.id);
      if (!found) return console.warn(`[Asset] Asset with ${update.id} does not exist`);
      merge(found, update);
    });
    return ctx.patchState({ assets });
  }

}
