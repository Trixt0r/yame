import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Actions, ofActionSuccessful, Select } from '@ngxs/store';
import { Asset } from 'common/asset';
import { NzDescriptionsItemComponent } from 'ng-zorro-antd/descriptions';
import { DestroyLifecycle, notify } from 'ng/modules/utils';
import { merge, Observable, takeUntil, tap } from 'rxjs';
import { AssetDetailsComponent } from '../../interfaces';
import { AssetState, LoadAssetResource } from '../../states';

const dragImage = new Image(0, 0);

interface AssetDescription {
  label: string;
  content: AssetDetailsComponent;
}

@Component({
  selector: 'yame-asset-preview',
  templateUrl: './preview.component.html',
  styleUrls: ['./preview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  viewProviders: [NzDescriptionsItemComponent],
  providers: [DestroyLifecycle],
})
export class AssetPreviewComponent {
  /**
   * Selector for subscribing to asset selection.
   */
  @Select(AssetState.selectedAsset) asset$!: Observable<Asset>;

  /**
   * Selector for subscribing to icon updates.
   */
  @Select(AssetState.icons) icons$!: Observable<{ [icon: string]: string }>;

  /**
   * Selector for subscribing to type label updates.
   */
  @Select(AssetState.typeLabels) labels$!: Observable<{ [label: string]: string }>;

  /**
   * Selector for reacting to details component updates.
   */
  @Select(AssetState.detailsComponents) details$!: Observable<{ [key: string]: AssetDetailsComponent[] }>;

  /**
   * The currently selected asset.
   */
  selectedAsset: Asset | null = null;

  /**
   * The current asset icon map.
   */
  icons: { [icon: string]: string } = {};

  /**
   * The current asset type label map.
   */
  labels: { [label: string]: string } = {};

  /**
   * The current asset details map.
   */
  details: { [key: string]: AssetDetailsComponent[] } = {};

  /**
   * The current language.
   */
  lang: string;

  /**
   * A list of descriptions to display.
   */
  descriptions: AssetDescription[] = [];

  constructor(
    translate: TranslateService,
    actions: Actions,
    zone: NgZone,
    destroy$: DestroyLifecycle,
    cdr: ChangeDetectorRef
  ) {
    this.lang = translate.currentLang;
    zone.runOutsideAngular(() => {
      merge(
        this.asset$.pipe(tap(_ => (this.selectedAsset = _))),
        this.icons$.pipe(tap(_ => (this.icons = _))),
        this.labels$.pipe(tap(_ => (this.labels = _))),
        this.details$.pipe(tap(_ => (this.details = _))),
        translate.onLangChange.pipe(tap(_ => (this.lang = _.lang))),
        actions.pipe(ofActionSuccessful(LoadAssetResource))
      )
        .pipe(takeUntil(destroy$), notify(cdr))
        .subscribe(a => {
          this.updateDescriptions();
        });
    });
  }

  protected updateDescriptions(): void {
    if (!this.selectedAsset) return;
    const components = this.details[this.selectedAsset.type];
    if (!Array.isArray(components)) return;
    this.descriptions = components.map(content => ({
      label: (content as any).label,
      content,
    }));
  }

  /**
   * Returns the icon for the given asset.
   *
   * @param asset The asset.
   * @return The icon name.
   */
  getIcon(asset: Asset): string {
    return this.icons[asset.type] || 'file';
  }

  /**
   * Returns the type label for the given asset.
   *
   * @param asset The asset.
   * @return The label name.
   */
  getLabel(asset: Asset): string {
    return this.labels[asset.type] || asset.type;
  }

  /**
   * Overrides the default drag image.
   *
   * @param event The triggered event.
   */
  onDragStart(event: DragEvent): void {
    event.dataTransfer?.setDragImage(dragImage, 0, 0);
  }
}
