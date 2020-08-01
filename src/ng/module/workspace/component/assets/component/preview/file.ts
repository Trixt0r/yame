import { FileAsset } from 'common/asset/file';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AssetPreviewComponent } from './interface';

@Component({
  template: `
    <mat-icon class="no-preview">{{ 'insert_drive_file' }}</mat-icon>
  `,
  styles: [
    `
      mat-icon {
        font-size: 5em;
        width: 100%;
        color: rgba(255, 255, 255, 0.7);
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileAssetPreviewComponent implements AssetPreviewComponent {
  asset: FileAsset;
}
