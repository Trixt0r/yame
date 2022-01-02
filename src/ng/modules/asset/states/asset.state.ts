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
import { IResource, IResourceGroup } from 'common/interfaces/resource';
import { ISerializeContext } from 'common/interfaces/serialize-context.interface';
import { PlatformPath } from 'path';
import { OnRead, OnWrite } from 'ng/decorators/serializer.decorator';
import { IAssetDetailsComponent, IAssetOwner } from '../interfaces';

/**
 * Tab components to initialize initially.
 */
const initTabComponents: { [type: string]: Type<IAssetOwner>[] } = {};

/**
 * Preview components to initialize initially.
 */
const initPreviewComponents: { [type: string]: Type<IAssetOwner> } = {};

/**
 * Details components to initialize initially.
 */
const initDetailsComponents: { [type: string]: IAssetDetailsComponent[] } = {};

/**
 * Defines asset ui state.
 */
interface AssetUI {
  /**
   * Component map for asset tabs.
   */
  tabs: { [type: string]: Type<IAssetOwner>[] };

  /**
   * Component map for asset previews.
   */
  previews: { [type: string]: Type<IAssetOwner> };

  /**
   * Component map for asset details.
   */
  details: { [type: string]: IAssetDetailsComponent[] };

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
      tabs: {},
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
        icon: 'folder-open',
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
  static groups(state: IAssetState): Asset<IResourceGroup>[] {
    return state.assets.filter(asset => asset.type === 'group') as Asset<IResourceGroup>[];
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
   * Returns all registered tab components.
   */
  @Selector()
  static tabComponents(state: IAssetState) {
    return state.ui.tabs;
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
   * Initializes the given tab component for the given types.
   */
  static _initTabComponent(comp: Type<IAssetOwner>, ...types: string[]): void {
    console.log(comp, types);
    if (!types || types.length <= 0) {
      if (!Array.isArray(initTabComponents['*'])) initTabComponents['*'] = [];
      initTabComponents['*'].push(comp);
    }

    types.forEach(assetType => {
      if (!Array.isArray(initTabComponents[assetType])) initTabComponents[assetType] = [];
      initTabComponents[assetType].push(comp);
    });
  }

  /**
   * @private
   *
   * Initializes the given preview component for the given types.
   */
  static _initPreviewComponent(comp: Type<IAssetOwner>, ...types: string[]): void {
    types.forEach(assetType => (initPreviewComponents[assetType] = comp));
  }

  /**
   * @private
   *
   * Initializes the given details component for the given types.
   */
  static _initDetailsComponent(comp: IAssetDetailsComponent, ...types: string[]): void {
    types.forEach(assetType => {
      if (!Array.isArray(initDetailsComponents[assetType])) initDetailsComponents[assetType] = [];
      initDetailsComponents[assetType].push(comp);
    });
  }

  constructor(protected store: Store) {}

  /**
   * @inheritdoc
   */
  ngxsOnInit(ctx?: StateContext<IAssetState>) {
    const ui = ctx?.getState().ui;
    ctx?.patchState({
      ui: merge({ tabs: initTabComponents, previews: initPreviewComponents, details: initDetailsComponents }, ui),
    });
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

  /**
   * Returns the asset for the given uniform resource identifier.
   *
   * @param uri The uniform resource identifier.
   * @return The found asset.
   */
  getAssetForUri(uri: string): Asset | undefined {
    const state = this.store.snapshot().assets as IAssetState;
    return state.assets.find(it => it.resource.uri === uri);
  }

  /**
   * Returns the asset for the given identifier.
   *
   * @param id The asset identifier.
   * @return The found asset.
   */
  getAssetById(id: string): Asset | undefined {
    const state = this.store.snapshot().assets as IAssetState;
    return state.assets.find(it => it.id === id);
  }

  /**
   * Returns the children for the given asset.
   *
   * @param asset The parent asset.
   * @param deep Whether to recursively search children if the children.
   * @return The found children
   */
  getChildren(asset: Asset, deep = true): Asset[] {
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
  addAssetsSource(ctx: StateContext<IAssetState>, action: AddAssetsSource): void {
    const sources = ctx.getState().sources.slice();
    const found = sources.find(it => it.type === action.source.type);
    if (found) return console.warn(`[Assets] Asset source with type '${found.type}' is already registered.`);
    sources.push(action.source);
    ctx.patchState({ sources });
  }

  @Action(RemoveAssetsSource)
  removeAssetsSource(ctx: StateContext<IAssetState>, action: RemoveAssetsSource): void {
    const sources = ctx.getState().sources.slice();
    const idx = sources.findIndex(it => it.type === action.type);
    if (idx < 0) return console.warn(`[Assets] Asset source with type '${action.type}' is not registered.`);
    sources.splice(idx, 1);
    ctx.patchState({ sources });
  }

  @Action(AddAsset)
  addAsset(ctx: StateContext<IAssetState>, action: AddAsset): void {
    const assets = ctx.getState().assets.slice();
    const toAdd = Array.isArray(action.asset) ? action.asset : [action.asset];
    const newAssets = toAdd.filter(asset => {
      const found = assets.find(it => it.id === asset.id);
      if (found) console.warn(`[Asset] Asset with ${found.id} already exists`);
      return !found;
    });
    if (newAssets.length === 0) return;
    newAssets.forEach(it => assets.push(it));
    ctx.patchState({ assets });
  }

  @Action(RemoveAsset)
  removeAsset(ctx: StateContext<IAssetState>, action: RemoveAsset): void {
    const state = ctx.getState();
    const assets = state.assets.slice();
    const toRemove = Array.isArray(action.id) ? action.id : [action.id];
    let deletedAssets = toRemove.map(id => assets.find(it => it.id === id)).filter(it => !!it) as Asset[];
    if (deletedAssets.length === 0) return;
    let children: Asset[] = [];
    deletedAssets.forEach(it => {
      children = children.concat(this.getChildren(it, true));
    });
    const patch: Partial<IAssetState> = { assets };
    deletedAssets = deletedAssets.concat(children);
    deletedAssets.forEach(asset => {
      if (!asset) return;
      const idx = assets.indexOf(asset);
      if (idx >= 0) {
        if (asset.id === state.selectedGroup?.id) patch.selectedGroup = null;
        if (asset.id === state.selectedAsset?.id) patch.selectedAsset = null;
        assets.splice(idx, 1);
      }
    });
    ctx.patchState(patch);
  }

  @Action(UpdateAsset)
  updateAsset(ctx: StateContext<IAssetState>, action: UpdateAsset): void {
    const assets = ctx.getState().assets.slice();
    const toUpdate = Array.isArray(action.asset) ? action.asset : [action.asset];
    toUpdate.forEach(update => {
      const found = assets.find(it => update.id === it.id);
      if (!found) return console.warn(`[Asset] Asset with ${update.id} does not exist`);
      merge(found, update);
    });
    ctx.patchState({ assets });
  }

  @Action(LoadAssetResource)
  async loadAssetResource(ctx: StateContext<IAssetState>, action: LoadAssetResource): Promise<void> {
    const resource = action.resource;
    if (resource.loaded && !action.force) {
      ctx.patchState({ scanningResource: null });
      return;
    }
    const parent = this.getAssetForResource(resource);

    const assets = [parent];

    if (Array.isArray(resource.data)) {
      resource.data?.forEach(it => {
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
  scanResource(ctx: StateContext<IAssetState>, action: ScanResource): void {
    if (ctx.getState().scanningResource === action.uri) return;
    ctx.patchState({ scanningResource: action.uri });
  }

  @Action(SelectAssetGroup)
  selectAssetGroup(ctx: StateContext<IAssetState>, action: SelectAssetGroup): void {
    if (ctx.getState().selectedGroup?.id === action.asset.id) return;
    ctx.patchState({ selectedGroup: action.asset });
  }

  @Action(UnselectAssetGroup)
  unselectAssetGroup(ctx: StateContext<IAssetState>): void {
    if (!ctx.getState().selectedGroup) return;
    ctx.patchState({ selectedGroup: null });
  }

  @Action(SelectAsset)
  selectAsset(ctx: StateContext<IAssetState>, action: SelectAsset): void {
    const { asset } = action;
    if (ctx.getState().selectedGroup?.id === asset?.id) return;
    ctx.patchState({ selectedAsset: asset });
    if (!asset || asset.resource.loaded) return;
    ctx.dispatch(new ScanResource(asset.resource.uri, asset.resource.source, asset.resource.type));
  }

  @Action(UnselectAsset)
  unselectAsset(ctx: StateContext<IAssetState>): void {
    if (!ctx.getState().selectedAsset) return;
    ctx.patchState({ selectedAsset: null });
  }

  @Action(RegisterAssetIcon)
  registerAssetIcon(ctx: StateContext<IAssetState>, action: RegisterAssetIcon): void {
    const currentUi = ctx.getState().ui;
    const icons: { [icon: string]: string } = {};
    action.types.forEach(it => (icons[it] = action.icon));
    const ui = merge({}, currentUi);
    ui.icons = { ...ui.icons, ...icons };
    ctx.patchState({ ui });
  }

  @Action(RegisterAssetTypeLabel)
  registerAssetTypeLabel(ctx: StateContext<IAssetState>, action: RegisterAssetTypeLabel): void {
    const currentUi = ctx.getState().ui;
    const labels: { [label: string]: string } = {};
    action.types.forEach(it => (labels[it] = action.label));
    const ui = merge({}, currentUi);
    ui.typeLabels = { ...ui.typeLabels, ...labels };
    ctx.patchState({ ui });
  }

  @Action(ResetAssets)
  reset(ctx: StateContext<IAssetState>, action: ResetAssets): void {
    ctx.patchState({ assets: [], selectedAsset: null, selectedGroup: null, scanningResource: null });
  }

  @OnWrite('assets')
  async write(context: ISerializeContext) {
    const uri = context.uri;
    const protocol = context.protocol;
    const assetState = this.store.selectSnapshot(state => state.assets) as IAssetState;
    const path = (global as any).require('path') as PlatformPath;
    return assetState.assets
      .filter(asset => !asset.parent)
      .map(asset => ({
        id: './' + path.relative(path.dirname(uri), asset.id.replace(protocol, '')).replace(/\\/g, '/'),
        resource: {
          uri: './' + path.relative(path.dirname(uri), asset.resource.uri.replace(protocol, '')).replace(/\\/g, '/'),
          source: asset.resource.source,
        },
      }));
  }

  @OnRead('assets')
  async read(data: Asset[], context: ISerializeContext) {
    const uri = context.uri;
    const protocol = context.protocol;
    const path = (global as any).require('path') as PlatformPath;
    const scans = data.map(
      asset =>
        new ScanResource(
          path.resolve(path.dirname(uri), asset.resource.uri.replace(protocol, '')),
          asset.resource.source
        )
    );
    await this.store.dispatch(new ResetAssets());
    return this.store.dispatch(scans).toPromise();
  }
}
