import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewEncapsulation } from '@angular/core';
import { Asset } from 'common/asset';
import { AssetDetailsComponent } from '../../../decorators/details.decorator';
import { IAssetDetailsComponent } from '../../../directives/details.directive';

@Component({
  templateUrl: 'image.component.html',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
@AssetDetailsComponent('png', 'jpg', 'jpeg', 'gif', 'svg')
export class ImageAssetDetailsComponent implements IAssetDetailsComponent, AfterViewInit {

  /**
   * @inheritdoc
   */
  asset!: Asset<unknown>;

  constructor(protected cdr: ChangeDetectorRef) { }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    const img = new Image();
    img.onload = () => {
      this.asset.resource.width = img.width;
      this.asset.resource.height = img.height;
      this.cdr.markForCheck();
    };
    img.src = this.asset.resource.uri;
  }
}