import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { IPoint } from 'common/math';
import { DestroyLifecycle, notify } from 'ng/modules/utils';
import { AddToolService, AssetTabComponent, IAssetOwner } from 'ng/modules/asset';
import { Observable, takeUntil } from 'rxjs';
import { ITileset, ITilesetSetting } from '../../interfaces';
import { DEFAULT_SETTINGS, SaveTilesetSettings, TilesetState } from '../../states';
import { difference, merge } from 'lodash';
import { ToolbarState } from 'ng/modules/toolbar';
import { AssetSceneComponent, createAssetComponent, createGroupComponent } from 'common/scene';

@Component({
  selector: 'yame-tileset-tab',
  templateUrl: './tileset-tab.component.html',
  styleUrls: ['./tileset-tab.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [DestroyLifecycle],
})
@AssetTabComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class TilesetTabComponent implements IAssetOwner, OnInit {
  static readonly icon = 'appstore';

  static readonly title = 'Tileset';

  @Select(TilesetState.tilesets) tilesets$!: Observable<ITileset[]>;

  @Select(ToolbarState.activeTool) activeTool$!: Observable<AddToolService>;

  expanded = false;

  set asset(value: Asset) {
    this._asset = value;
    this.store.dispatch(new SaveTilesetSettings(this._asset, [{ id: this.settingId, label: 'dflt' }]));
  }

  get asset(): Asset {
    return this._asset;
  }

  set size(value: IPoint) {
    if (value.x === this._size.x && value.y === this._size.y) return;
    this.updateValue('size', value);
  }
  get size(): IPoint {
    return this._size;
  }

  set spacing(value: IPoint) {
    if (value.x === this._spacing.x && value.y === this._spacing.y) return;
    this.updateValue('spacing', value);
  }
  get spacing(): IPoint {
    return this._spacing;
  }

  set offset(value: IPoint) {
    if (value.x === this._offset.x && value.y === this._offset.y) return;
    this.updateValue('offset', value);
  }
  get offset(): IPoint {
    return this._offset;
  }

  set selections(value: IPoint[]) {
    if (
      difference(
        this._selections.map(_ => `${_.x},${_.y}`),
        value.map(_ => `${_.x},${_.y}`)
      ).length === 0
    )
      return;
    this.updateValue('selections', value);
  }
  get selections(): IPoint[] {
    return this._selections;
  }

  settingId = 0;

  private _asset!: Asset;
  private _size: IPoint = { ...DEFAULT_SETTINGS.size };
  private _spacing: IPoint = { ...DEFAULT_SETTINGS.spacing };
  private _offset: IPoint = { ...DEFAULT_SETTINGS.offset };
  private _selections: IPoint[] = [...DEFAULT_SETTINGS.selections];
  private _tool?: AddToolService;

  constructor(
    private store: Store,
    private destroy$: DestroyLifecycle,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  private updateValue<T>(key: keyof ITilesetSetting, value: T): void {
    (this as any)[`_${key}`] = value;
    this.store.dispatch(new SaveTilesetSettings(this._asset, [{ id: this.settingId, [key]: value }]));
  }

  ngOnInit(): void {
    this.zone.runOutsideAngular(() => {
      this.destroy$.subscribe(_ => {
        if (!this._tool) return;
        this._tool.previewComponents = [];
      });
      this.tilesets$.pipe(takeUntil(this.destroy$), notify(this.cdr)).subscribe(tilesets => {
        const tileset = tilesets.find(_ => _.asset.id === this._asset.id);
        if (!tileset) return;
        const setting = tileset.settings.find(_ => _.id === this.settingId);
        if (!setting) return;
        merge(this._size, setting.size);
        merge(this._offset, setting.offset);
        merge(this._spacing, setting.spacing);
        this._selections = setting.selections.slice();
        if (!this._tool?.previewComponents) return;

        this._tool.previewComponents[this._tool.previewComponents.length - 1].setting = {
          id: this.settingId,
          label: 'dflt',
          size: this._size,
          offset: this._offset,
          spacing: this._spacing,
          selections: this._selections,
        };
      });

      this.activeTool$.pipe(takeUntil(this.destroy$), notify(this.cdr)).subscribe(tool => {
        if (!(tool instanceof AddToolService)) return;
        this._tool = tool;
        const group = createGroupComponent('tileset', ['tileset.texture', 'tileset.setting']);
        const asset = createAssetComponent('tileset.texture', this._asset.resource.uri, 'tileset');
        const setting = {
          id: 'tileset.setting',
          type: 'tileset',
          label: 'Tileset',
          removable: false,
          group: 'tileset',
          setting: {
            id: this.settingId,
            label: 'dflt',
            size: this._size,
            offset: this._offset,
            spacing: this._spacing,
            selections: this._selections,
          } as ITilesetSetting,
        };
        this._tool.previewComponents = [group, asset, setting];
      });
    });
  }
}
