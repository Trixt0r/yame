import { ChangeDetectionStrategy, Component, ElementRef, Input, NgZone, ViewChild } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Asset } from 'common/asset';
import { ResizableComponent } from 'ng/module/utils';
import { Observable } from 'rxjs';
import { SelectAssetGroup, UnselectAssetGroup } from '../../states/actions/asset.action';
import { AssetState } from '../../states/asset.state';
import { AssetGroupsComponent } from '../groups/groups.component';
import { AssetItemsComponent } from '../items/items.component';

@Component({
  selector: 'yame-asset-panel',
  templateUrl: 'panel.component.html',
  styleUrls: ['panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssetPanelComponent extends ResizableComponent {

  /**
   * The minimum width for each column.
   */
  @Input() minWidth = 300;

  /**
   * The resizable component between groups and items.
   */
  @ViewChild(ResizableComponent) resizable!: ResizableComponent;

  /**
   * The row, which is wrapped around all inner components.
   */
  @ViewChild('row') row!: ElementRef;

  /**
   * The groups component, on the left.
   */
  @ViewChild(AssetGroupsComponent, { read: ElementRef }) groups!: ElementRef<HTMLElement>;

  /**
   * The assets component, on the right.
   */
  @ViewChild(AssetItemsComponent, { read: ElementRef }) items!: ElementRef<HTMLElement>;

  @Select(AssetState.selectedGroup) selectedGroup$!: Observable<Asset>;

  protected onResizeBind: () => void;

  constructor(public ref: ElementRef, protected zone: NgZone, protected store: Store) {
    super(ref, zone);
    this.maxVal = window.innerHeight - 150;
    this.onResizeBind = this.onResize.bind(this);
    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', this.onResizeBind);
    });
  }

  /**
   * @inheritdoc
   */
  onResize() {
    this.maxVal = window.innerHeight - 150;
    if (this.row) {
      const fullWidth = this.row.nativeElement.offsetWidth;
      this.resizable.maxVal = Math.max(200, fullWidth - (this.minWidth + 15));
    }
    super.onResize();
    if (!this.resizable) return;
    this.resizable.onResize();
    this.updateColumns(this.resizable.propertyValue);
  }

  /**
   * Updates the size of the columns.
   *
   * @param size The new column size of the groups container.
   * @return `true` if the size has been applied, `false` otherwise.
   */
  updateColumns(size: number) {
    if (!this.row) return false;
    const fullWidth = this.row.nativeElement.offsetWidth;
    this.groups.nativeElement.style.width = `${size}px`;
    this.groups.nativeElement.style.maxWidth = `${size}px`;
    this.items.nativeElement.style.left = `${size + 5}px`;
    this.items.nativeElement.style.maxWidth = `${fullWidth - size - 5}px`;
    this.items.nativeElement.style.width = `${fullWidth - size - 5}px`;
    return true;
  }

  onGroupSelect(asset: Asset) {
    this.store.dispatch(new SelectAssetGroup(asset));
  }

  onGroupUnselect(asset: Asset) {
    this.store.dispatch(new UnselectAssetGroup());
  }

}