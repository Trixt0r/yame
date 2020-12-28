import { Asset } from 'common/asset';
import { State, Action, StateContext, Selector, Store, NgxsOnInit } from '@ngxs/store';
import { AddAsset, AddAssetsSource, RemoveAsset, RemoveAssetsSource, IAssetsSource, UpdateAsset, LoadAssetResource, SelectAssetGroup, UnselectAssetGroup, RegisterAssetIcon } from './actions/asset.action';
import { merge } from 'lodash';
import { Injectable, Type } from '@angular/core';
import { IResource } from 'common/interfaces/resource';
import { IAssetPreviewComponent } from '../directives/preview.directive';

/**
 * Preview components to initialize initially.
 */
const initPreviewComponents: { [type: string]: Type<IAssetPreviewComponent> } = { }

/**
 * Defines asset ui state.
 */
interface AssetUI {
  /**
   * Component map for asset previews.
   */
  previews: { [type: string]: Type<IAssetPreviewComponent> };

  /**
   * The icon mapping.
   */
  icons: { [key: string]: string };
}

export interface IAssetState {

  /**
   * A list of all loaded assets.
   */
  assets: Asset[];

  /**
   * A list of available folder types.
   */
  sources: IAssetsSource[];

  /**
   * The selected group.
   */
  selectedGroup: Asset | null;

  /**
   * The ui state, including settings and components.
   */
  ui: AssetUI;

  /**
   * The selected asset.
   */
  selectedAsset: Asset | null;
}

@State<IAssetState>({
  name: 'assets',
  defaults: {
    assets: [],
    selectedGroup: null,
    selectedAsset: null,
    ui: {
      previews: { },
      icons: { }
    },
    sources: [
      {
        origin: 'file:///',
        type: 'local',
        label: 'Local folder',
        icon: 'folder_open'
      }
    ]
  }
})
@Injectable()
export class AssetState implements NgxsOnInit {

  /**
   * Returns all loaded assets in the state.
   */
  @Selector()
  static assets(state: IAssetState) { return state.assets; }

  /**
   * Returns all asset sources in the state.
   */
  @Selector()
  static sources(state: IAssetState) { return state.sources; }

  @Selector()
  static groups(state: IAssetState) { return state.assets.filter(asset => asset.type === 'group'); }

  /**
   * Returns the currently selected asset group.
   */
  @Selector()
  static selectedGroup(state: IAssetState) { return state.selectedGroup; }

  /**
   * Returns the currently selected asset.
   */
  @Selector()
  static selectedAsset(state: IAssetState) { return state.selectedAsset; }

  /**
   * Returns all registered preview components.
   */
  @Selector()
  static previewComponents(state: IAssetState) {
    return state.ui.previews;
  }

  /**
   * Returns the icon map.
   */
  @Selector()
  static icons(state: IAssetState) {
    return state.ui.icons;
  }

  static _initPreviewComponent(comp: Type<IAssetPreviewComponent>, ...types: string[]) {
    types.forEach(assetType => initPreviewComponents[assetType] = comp);
  }

  constructor(protected store: Store) { }

  /**
   * @inheritdoc
   */
  ngxsOnInit(ctx?: StateContext<IAssetState>) {
    const ui = ctx?.getState().ui;
    ctx?.patchState({ ui: merge({ previews: initPreviewComponents }, ui) });
  }

  /**
   * Returns an asset instance for the given resource.
   *
   * @param resource The resource
   * @return A new asset instance or an existing one from the current state.
   */
  getAssetForResource(resource: IResource): Asset {
    const state = this.store.snapshot().assets as IAssetState;
    let found = state.assets.find(it => it.resource.uri === resource.uri);
    if (!found) {
      found = new Asset();
      found.id = resource.uri;
      found.type = resource.type === 'directory' ? 'group' : resource.type;
      found.resource = resource;
    }
    return found;
  }

  getAssetForUri(uri: string): Asset | undefined {
    const state = this.store.snapshot().assets as IAssetState;
    return state.assets.find(it => it.resource.uri === uri);
  }

  getAssetById(id: string): Asset | undefined {
    const state = this.store.snapshot().assets as IAssetState;
    return state.assets.find(it => it.id === id);
  }

  getChildren(asset: Asset, deep = true) {
    let children: Asset[] = [];
    const state = this.store.snapshot().assets as IAssetState;
    asset.children.forEach(id => {
      const child = state.assets.find(it => it.id === id);
      if (!child) return;
      children.push(child);
      if (!deep || child.children.length === 0) return;
      children = children.concat(this.getChildren(child));
    });
    return children;
  }

  @Action(AddAssetsSource)
  addAssetsSource(ctx: StateContext<IAssetState>, action: AddAssetsSource) {
    const sources = ctx.getState().sources.slice();
    const found = sources.find(it => it.type === action.source.type);
    if (found) return console.warn(`[Assets] Asset source with type '${found.type}' is already registered.`);
    sources.push(action.source);
    return ctx.patchState({ sources });
  }

  @Action(RemoveAssetsSource)
  removeAssetsSource(ctx: StateContext<IAssetState>, action: RemoveAssetsSource) {
    const sources = ctx.getState().sources.slice();
    const idx = sources.findIndex(it => it.type === action.type);
    if (idx < 0) return console.warn(`[Assets] Asset source with type '${action.type}' is not registered.`);
    sources.splice(idx, 1);
    return ctx.patchState({ sources });
  }

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

  @Action(RemoveAsset)
  removeAsset(ctx: StateContext<IAssetState>, action: RemoveAsset) {
    const assets = ctx.getState().assets.slice();
    const toRemove = Array.isArray(action.id) ? action.id : [action.id];
    let deletedAssets = toRemove.map(id => assets.find(it => it.id === id)).filter(it => !!it) as Asset[];
    if (deletedAssets.length === 0) return;
    let children: Asset[] = [];
    deletedAssets.forEach(it => {
      children = children.concat(this.getChildren(it, true));
    });
    deletedAssets = deletedAssets.concat(children);
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

  @Action(LoadAssetResource)
  loadAssetResource<T>(ctx: StateContext<IAssetState>, action: LoadAssetResource) {
    const resource = action.resource;
    if (resource.loaded && !action.force) return;
    const parent = this.getAssetForResource(resource);

    const assets = [parent];

    if (Array.isArray(resource.data)) {
      resource.data?.forEach(it => {
        const asset = this.getAssetForResource(it);
        asset.parent = parent.id;
        if (parent.children.indexOf(asset.id) < 0)
          parent.children.push(asset.id);
        assets.push(asset);
      });
    }

    return ctx.dispatch(new AddAsset(assets))
                .subscribe(() => parent.resource.loaded = true);
  }

  @Action(SelectAssetGroup)
  selectAssetGroup(ctx: StateContext<IAssetState>, action: SelectAssetGroup) {
    if (ctx.getState().selectedGroup?.id === action.asset.id) return;
    ctx.patchState({ selectedGroup: action.asset });
  }

  @Action(UnselectAssetGroup)
  unselectAssetGroup(ctx: StateContext<IAssetState>, action: UnselectAssetGroup) {
    ctx.patchState({ selectedGroup: null });
  }

  @Action(RegisterAssetIcon)
  registerAssetIcon(ctx: StateContext<IAssetState>, action: RegisterAssetIcon) {
    const currentUi = ctx.getState().ui;
    const icons: { [icon: string] : string } = { };
    action.types.forEach(it => icons[it] = action.icon);
    const ui = merge({ }, currentUi);
    ui.icons = { ...ui.icons, ...icons };
    ctx.patchState({ ui });
  }

}
