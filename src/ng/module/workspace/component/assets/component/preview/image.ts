import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ImageAsset } from 'common/asset/image';
import { AssetPreviewComponent } from './interface';

@Component({
  moduleId: module.id.toString(),
  template: `
    <div class="image-wrapper">
    <img draggable="false" mat-card-image [src]="sanitize(asset.content.path)" />
    </div>
  `,
  styleUrls: ['./image.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageAssetPreviewComponent implements AssetPreviewComponent {

  asset!: ImageAsset;

  constructor(private sanitizer: DomSanitizer ) { }

  /**
   * @param {string} url
   * @returns {string}
   */
  sanitize(url: string): string {
    return <string>this.sanitizer.bypassSecurityTrustUrl(url);
  }

}
