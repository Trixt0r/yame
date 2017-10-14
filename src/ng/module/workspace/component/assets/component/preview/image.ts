import { Component } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ImageAsset } from '../../../../../../../common/asset/image';
import { AssetPreviewComponent } from './interface';
import { Asset } from '../../../../../../../common/asset';

@Component({
  moduleId: module.id,
  template: `<img mat-card-image [src]="sanitize(asset.content.path)" />`,
})
export class ImageAssetPreviewComponent implements AssetPreviewComponent {

  asset: ImageAsset;

  constructor(private sanitizer: DomSanitizer ) { }

  /**
   * @param {string} url
   * @returns {string}
   */
  sanitize(url: string): string {
    return <string>this.sanitizer.bypassSecurityTrustUrl(url);
  }

}
