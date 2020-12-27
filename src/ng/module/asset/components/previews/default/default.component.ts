import { Component, ChangeDetectionStrategy } from '@angular/core';

import { Asset } from 'common/asset';
import { IAssetPreviewComponent } from '../../../directives/preview.directive';

@Component({
  templateUrl: 'default.component.html',
  styleUrls: ['default.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultAssetPreviewComponent implements IAssetPreviewComponent {
  asset!: Asset;
}
