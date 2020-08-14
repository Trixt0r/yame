import { Component, OnChanges, SimpleChanges, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef, SimpleChange } from '@angular/core';
import { AbstractTypeComponent } from '../abstract';
import { AssetSceneComponent as AssetComponent } from 'common/scene/component/asset';
import { AssetService } from 'ng/module/workspace/idx';
import { DragDropData } from 'ng2-dnd';
import { Asset } from 'common/asset';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatSelect } from '@angular/material/select';
import { SceneComponent } from 'common/scene';

let allAssets: Asset[] = null;

@Component({
  templateUrl: './asset.component.html',
  styleUrls: ['../style.scss', './asset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetTypeComponent<T extends AssetComponent> extends AbstractTypeComponent<T> implements OnChanges {

  static readonly type: string = 'asset';

  /**
   * Internal list of all assets.
   */
  protected _allAssets: Asset[];

  /**
   * The current index.
   */
  currentIndex: number;

  /**
   * A map of sanitized url values.
   */
  sanitized: { [key: string]: SafeUrl } = { };

  /**
   * The virtual scroll viewport reference.
   */
  @ViewChild(CdkVirtualScrollViewport, { static: true }) cdkVirtualScrollViewport: CdkVirtualScrollViewport;

  /**
   * The select reference.
   */
  @ViewChild(MatSelect) matSelect: MatSelect;

  /**
   * Compares options with a selection.
   */
  compare = (option: string, selection: string) => {
    return this.selected ? selection === this.selected : selection === option;
  };

  /**
   * A list of all assets for the current asset type.
   */
  get allAssets(): Asset[] {
    return this._allAssets;
  }

  /**
   * The current asset instance.
   */
  get currentAsset(): Asset {
    return this.currentIndex >= 0 ? this._allAssets[this.currentIndex] : null;
  }

  /**
   * The currently selected asset value.
   */
  get selected(): string {
    return this.component.mixed ? null : this.component.asset;
  }

  set selected(id: string) {
    const data = {
      originalEvent: null,
      value: id,
      component: this.component
    };
    this.currentIndex = id ? this._allAssets.findIndex(it => it.id === id) : -1;
    const asset = this._allAssets[this.currentIndex];
    this.component.asset = asset ? id : null;
    this.component.mixed = false;
    this.cdr.detectChanges();
    this.updateEvent.emit(data);
  }

  constructor(protected assets: AssetService, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {
    super();
  }

  /**
   * Handles the opened event.
   */
  onOpened(): void {
    this.cdkVirtualScrollViewport.scrollToIndex(this.currentIndex + 1);
    this.cdkVirtualScrollViewport.checkViewportSize();
  }

  /**
   * Checks the type of the given asset.
   *
   * @param asset The asset to check.
   * @return Whether the asset can be used as a value or not.
   */
  checkType(asset: Asset): boolean {
    let allowedTypes = this.component.allowedTypes;
    if (allowedTypes && typeof allowedTypes === 'string')
      allowedTypes = [allowedTypes];
    if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
        return allowedTypes.indexOf(asset.type) >= 0;
    } else {
      return true;
    }
  }

  /**
   * Returns a function which returns `true` if a drop is allowed onto this component.
   */
  allowDrop(): (event: DragDropData) => boolean {
    return (event: DragDropData) => {
      return event.dragData instanceof Asset && this.checkType(event.dragData);
    };
  }

  /**
   * @inheritdoc
   */
  onExternalUpdate(): void {
    if (this.component.mixed) {
      this.cdr.detectChanges();
    } else {
      this.selected = this.component.asset;
    }
  }

  /**
   * Handles an asset drop onto this component.
   *
   * @param data The drop data.
   */
  onDrop(data: DragDropData): void {
    if (!this.checkType(data.dragData)) return;
    this.selected = data.dragData.id;
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (!changes.component) return;
    if (!allAssets) allAssets = this.assets.getAssetsRecursive();
    this._allAssets = allAssets.filter(asset => this.checkType(asset));
    if (Object.keys(this.sanitized).length === 0)
      this._allAssets.forEach(it => this.sanitized[it.id] = this.sanitizer.bypassSecurityTrustUrl(it.content.path));
    if (this.component.mixed) return;
    this.selected = this.component.asset;
  }
}
