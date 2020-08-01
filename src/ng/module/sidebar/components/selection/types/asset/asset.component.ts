import { Component, OnChanges, SimpleChanges, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { AbstractTypeComponent } from '../abstract';
import { AssetSceneComponent as AssetComponent } from 'common/scene/component/asset';
import { AssetService } from 'ng/module/workspace/idx';
import { DragDropData } from 'ng2-dnd';
import { Asset } from 'common/asset';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { MatSelect } from '@angular/material/select';

let allAssets: Asset[] = null;

@Component({
  templateUrl: './asset.component.html',
  styleUrls: ['../style.scss', './asset.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetTypeComponent<T extends AssetComponent> extends AbstractTypeComponent<T> implements OnChanges {

  static readonly type: string = 'asset';

  protected _allAssets: Asset[];
  currentIndex: number;

  sanitized: { [key: string]: SafeUrl } = { };

  @ViewChild(CdkVirtualScrollViewport, { static: true }) cdkVirtualScrollViewport: CdkVirtualScrollViewport;
  @ViewChild(MatSelect) matSelect: MatSelect;

  constructor(protected assets: AssetService, private sanitizer: DomSanitizer, private cdr: ChangeDetectorRef) {
    super();
  }

  compare = (a: string, b: string) => {
    return this.selected ? b === this.selected : b === a;
  };

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.component) return;
    if (!allAssets) allAssets = this.assets.getAssetsRecursive();
    this._allAssets = allAssets.filter(asset => this.checkType(asset));
    if (Object.keys(this.sanitized).length === 0)
      this._allAssets.forEach(it => this.sanitized[it.id] = this.sanitizer.bypassSecurityTrustUrl(it.content.path));
    this.selected = this.component.asset;
  }

  open(event: any) {
    this.cdkVirtualScrollViewport.scrollToIndex(this.currentIndex + 1);
    this.cdkVirtualScrollViewport.checkViewportSize();
    // this.cdr.detectChanges();
    // this.matSelect.stateChanges.next();
  }

  checkType(asset: Asset) {
    let allowedTypes = this.component.allowedTypes;
    if (allowedTypes && typeof allowedTypes === 'string')
      allowedTypes = [allowedTypes];
    if (Array.isArray(allowedTypes) && allowedTypes.length > 0) {
        return allowedTypes.indexOf(asset.type) >= 0;
    } else {
      return true;
    }
  }

  get allAssets(): Asset[] {
    return this._allAssets;
  }

  get currentAsset(): Asset {
    return this.currentIndex >= 0 ? this._allAssets[this.currentIndex] : null;
  }

  get selected(): string {
    return this.component.asset;
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
    this.cdr.detectChanges();
    this.updateEvent.emit(data);
  }

  allowDrop() {
    return (event: DragDropData) => {
      return event.dragData instanceof Asset && this.checkType(event.dragData);
    };
  }

  onDragOver(event: unknown) {
    // console.log(event);
  }

  onDrop(event: DragDropData) {
    if (!this.checkType(event.dragData)) return;
    this.selected = event.dragData.id;
  }

  onDragEnter(event: unknown) {
    // console.log(event);
  }

  onDragLeave(event: unknown) {
    // console.log(event);
  }
}
