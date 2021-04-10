import { Asset } from 'common/asset';
import { State, Action, StateContext, Selector, Store, NgxsOnInit } from '@ngxs/store';
import {
  AddAsset,
  AddAssetsSource,
  RemoveAsset,
  RemoveAssetsSource,
  IAssetsSource,
  UpdateAsset,
  LoadAssetResource,
  SelectAssetGroup,
  UnselectAssetGroup,
  RegisterAssetIcon,
  SelectAsset,
  UnselectAsset,
  RegisterAssetTypeLabel,
  ScanResource,
  ResetAssets,
} from './actions/asset.action';
import { merge } from 'lodash';
import { Injectable, Type } from '@angular/core';
import { IResource } from 'common/interfaces/resource';
import { IAssetPreviewComponent } from '../directives/preview.directive';
import { IAssetDetailsComponent } from '../directives/details.directive';

/**
 * Preview components to initialize initially.
 */
const initPreviewComponents: { [type: string]: Type<IAssetPreviewComponent> } = {};

/**
 * Details components to initialize initially.
 */
const initDetailsComponents: { [type: string]: Type<IAssetDetailsComponent> } = {};

/**
 * Defines asset ui state.
 */
interface AssetUI {
  /**
   * Component map for asset previews.
   */
  previews: { [type: string]: Type<IAssetPreviewComponent> };

  /**
   * Component map for asset details.
   */
  details: { [type: string]: Type<IAssetDetailsComponent> };

  /**
   * The icon mapping.
   */
  icons: { [key: string]: string };

  /**
   * The type label mapping.
   */
  typeLabels: { [key: string]: string };
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
   * Whether an asset is being scanned.
   */
  scanningResource: string | null;

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
    scanningResource: null,
    ui: {
      previews: {},
      details: {},
      icons: {},
      typeLabels: {},
    },
    sources: [
      {
        origin: 'file:///',
        type: 'local',
        label: 'asset.source.local',
        icon: 'folder_open',
      },
    ],
  },
})
@Injectable()
export class AssetState implements NgxsOnInit {
  /**
   * Returns all loaded assets in the state.
   */
  @Selector()
  static assets(state: IAssetState) {
    return state.assets;
  }

  /**
   * Returns all asset sources in the state.
   */
  @Selector()
  static sources(state: IAssetState) {
    return state.sources;
  }

  /**
   * Returns all assets of type 'groups'.
   */
  @Selector()
  static groups(state: IAssetState) {
    return state.assets.filter((asset) => asset.type === 'group');
  }

  @Selector()
  static scanningResource(state: IAssetState) {
    return state.scanningResource;
  }

  /**
   * Returns the currently selected asset group.
   */
  @Selector()
  static selectedGroup(state: IAssetState) {
    return state.selectedGroup;
  }

  /**
   * Returns the currently selected asset.
   */
  @Selector()
  static selectedAsset(state: IAssetState) {
    return state.selectedAsset;
  }

  /**
   * Returns all registered preview components.
   */
  @Selector()
  static previewComponents(state: IAssetState) {
    return state.ui.previews;
  }

  /**
   * Returns all registered details components.
   */
  @Selector()
  static detailsComponents(state: IAssetState) {
    return state.ui.details;
  }

  /**
   * Returns the icon map.
   */
  @Selector()
  static icons(state: IAssetState) {
    return state.ui.icons;
  }

  /**
   * Returns the type label map.
   */
  @Selector()
  static typeLabels(state: IAssetState) {
    return state.ui.typeLabels;
  }

  /**
   * @private
   *
   * Initializes the given preview component for the given types.
   */
  static _initPreviewComponent(comp: Type<IAssetPreviewComponent>, ...types: string[]): void {
    types.forEach((assetType) => (initPreviewComponents[assetType] = comp));
  }

  /**
   * @private
   *
   * Initializes the given details component for the given types.
   */
  static _initDetailsComponent(comp: Type<IAssetDetailsComponent>, ...types: string[]): void {
    types.forEach((assetType) => (initDetailsComponents[assetType] = comp));
  }

  constructor(protected store: Store) {}

  /**
   * @inheritdoc
   */
  ngxsOnInit(ctx?: StateContext<IAssetState>) {
    const ui = ctx?.getState().ui;
    ctx?.patchState({ ui: merge({ previews: initPreviewComponents, details: initDetailsComponents }, ui) });
  }

  /**
   * Returns an asset instance for the given resource.
   *
   * @param resource The resource
   * @return A new asset instance or an existing one from the current state.
   */
  getAssetForResource(resource: IResource): Asset {
    const state = this.store.snapshot().assets as IAssetState;
    let found = state.assets.find((it) => it.resource.uri === resource.uri);
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
    return state.assets.find((it) => it.resource.uri === uri);
  }

  getAssetById(id: string): Asset | undefined {
    const state = this.store.snapshot().assets as IAssetState;
    return state.assets.find((it) => it.id === id);
  }

  getChildren(asset: Asset, deep = true) {
    let children: Asset[] = [];
    const state = this.store.snapshot().assets as IAssetState;
    asset.children.forEach((id) => {
      const child = state.assets.find((it) => it.id === id);
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
    const found = sources.find((it) => it.type === action.source.type);
    if (found) return console.warn(`[Assets] Asset source with type '${found.type}' is already registered.`);
    sources.push(action.source);
    return ctx.patchState({ sources });
  }

  @Action(RemoveAssetsSource)
  removeAssetsSource(ctx: StateContext<IAssetState>, action: RemoveAssetsSource) {
    const sources = ctx.getState().sources.slice();
    const idx = sources.findIndex((it) => it.type === action.type);
    if (idx < 0) return console.warn(`[Assets] Asset source with type '${action.type}' is not registered.`);
    sources.splice(idx, 1);
    return ctx.patchState({ sources });
  }

  @Action(AddAsset)
  addAsset(ctx: StateContext<IAssetState>, action: AddAsset) {
    const assets = ctx.getState().assets.slice();
    const toAdd = Array.isArray(action.asset) ? action.asset : [action.asset];
    const newAssets = toAdd.filter((asset) => {
      const found = assets.find((it) => it.id === asset.id);
      if (found) console.warn(`[Asset] Asset with ${found.id} already exists`);
      return !found;
    });
    if (newAssets.length === 0) return;
    newAssets.forEach((it) => assets.push(it));
    return ctx.patchState({ assets });
  }

  @Action(RemoveAsset)
  removeAsset(ctx: StateContext<IAssetState>, action: RemoveAsset) {
    const state = ctx.getState();
    const assets = state.assets.slice();
    const toRemove = Array.isArray(action.id) ? action.id : [action.id];
    let deletedAssets = toRemove.map((id) => assets.find((it) => it.id === id)).filter((it) => !!it) as Asset[];
    if (deletedAssets.length === 0) return;
    let children: Asset[] = [];
    deletedAssets.forEach((it) => {
      children = children.concat(this.getChildren(it, true));
    });
    const patch: Partial<IAssetState> = { assets };
    deletedAssets = deletedAssets.concat(children);
    deletedAssets.forEach((asset) => {
      if (!asset) return;
      const idx = assets.indexOf(asset);
      if (idx >= 0) {
        if (asset.id === state.selectedGroup?.id) patch.selectedGroup = null;
        if (asset.id === state.selectedAsset?.id) patch.selectedAsset = null;
        assets.splice(idx, 1);
      }
    });
    return ctx.patchState(patch);
  }

  @Action(UpdateAsset)
  updateAsset(ctx: StateContext<IAssetState>, action: UpdateAsset) {
    const assets = ctx.getState().assets.slice();
    const toUpdate = Array.isArray(action.asset) ? action.asset : [action.asset];
    toUpdate.forEach((update) => {
      const found = assets.find((it) => update.id === it.id);
      if (!found) return console.warn(`[Asset] Asset with ${update.id} does not exist`);
      merge(found, update);
    });
    return ctx.patchState({ assets });
  }

  @Action(LoadAssetResource)
  async loadAssetResource(ctx: StateContext<IAssetState>, action: LoadAssetResource) {
    const resource = action.resource;
    if (resource.loaded && !action.force) {
      ctx.patchState({ scanningResource: null });
      return;
    }
    const parent = this.getAssetForResource(resource);

    const assets = [parent];

    if (Array.isArray(resource.data)) {
      resource.data?.forEach((it) => {
        const asset = this.getAssetForResource(it);
        asset.parent = parent.id;
        if (parent.children.indexOf(asset.id) < 0) parent.children.push(asset.id);
        assets.push(asset);
      });
    }

    await ctx.dispatch(new AddAsset(assets)).toPromise();
    merge(parent.resource, resource);
    parent.resource.loaded = true;
    ctx.patchState({ scanningResource: null });
  }

  @Action(ScanResource)
  scanResource(ctx: StateContext<IAssetState>, action: ScanResource) {
    if (ctx.getState().scanningResource === action.uri) return;
    ctx.patchState({ scanningResource: action.uri });
  }

  @Action(SelectAssetGroup)
  selectAssetGroup(ctx: StateContext<IAssetState>, action: SelectAssetGroup) {
    if (ctx.getState().selectedGroup?.id === action.asset.id) return;
    ctx.patchState({ selectedGroup: action.asset });
  }

  @Action(UnselectAssetGroup)
  unselectAssetGroup(ctx: StateContext<IAssetState>, action: UnselectAssetGroup) {
    if (!ctx.getState().selectedGroup) return;
    ctx.patchState({ selectedGroup: null });
  }

  @Action(SelectAsset)
  selectAsset(ctx: StateContext<IAssetState>, action: SelectAsset) {
    if (ctx.getState().selectedGroup?.id === action.asset.id) return;
    ctx.patchState({ selectedAsset: action.asset });
  }

  @Action(UnselectAsset)
  unselectAsset(ctx: StateContext<IAssetState>, action: UnselectAsset) {
    if (!ctx.getState().selectedAsset) return;
    ctx.patchState({ selectedAsset: null });
  }

  @Action(RegisterAssetIcon)
  registerAssetIcon(ctx: StateContext<IAssetState>, action: RegisterAssetIcon) {
    const currentUi = ctx.getState().ui;
    const icons: { [icon: string]: string } = {};
    action.types.forEach((it) => (icons[it] = action.icon));
    const ui = merge({}, currentUi);
    ui.icons = { ...ui.icons, ...icons };
    ctx.patchState({ ui });
  }

  @Action(RegisterAssetTypeLabel)
  registerAssetTypeLabel(ctx: StateContext<IAssetState>, action: RegisterAssetTypeLabel) {
    const currentUi = ctx.getState().ui;
    const labels: { [label: string]: string } = {};
    action.types.forEach((it) => (labels[it] = action.label));
    const ui = merge({}, currentUi);
    ui.typeLabels = { ...ui.typeLabels, ...labels };
    ctx.patchState({ ui });
  }

  @Action(ResetAssets)
  reset(ctx: StateContext<IAssetState>, action: ResetAssets) {
    ctx.patchState({ assets: [], selectedAsset: null, selectedGroup: null, scanningResource: null });
  }
}
