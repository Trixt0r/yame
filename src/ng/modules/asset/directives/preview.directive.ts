import { Asset } from 'common/asset';

import { ComponentRef, Directive, Input, ViewContainerRef, Type, NgZone } from '@angular/core';
import { Select } from '@ngxs/store';
import { AssetState } from '../states/asset.state';
import { Observable } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AssetDefaultPreviewComponent } from '../components/previews/default/default.component';
import { DestroyLifecycle } from 'ng/modules/utils';
import { IAssetOwner } from '../interfaces';

/**
 * Directive for injecting a preview component for a certain asset.
 */
@Directive({
    selector: '[yameAssetPreview]',
    providers: [DestroyLifecycle],
    standalone: false
})
export class AssetPreviewDirective {
  /**
   * The asset to render.
   */
  @Input('yameAssetPreview') set asset(val: Asset) {
    this.render(val);
  }

  /**
   * Selector for reacting to preview component updates.
   */
  @Select(AssetState.previewComponents) previews$!: Observable<{ [key: string]: Type<IAssetOwner> }>;

  /**
   * A map of all preview components.
   */
  previews: { [key: string]: Type<IAssetOwner> } = {};

  constructor(protected viewContainerRef: ViewContainerRef, protected zone: NgZone, destroy$: DestroyLifecycle) {
    this.zone.runOutsideAngular(() => {
      this.previews$.pipe(takeUntil(destroy$)).subscribe(previews => (this.previews = previews));
    });
  }

  /**
   * Renders the asset preview for the given asset.
   *
   * @param asset The asset to render.
   * @return The created component reference or `null` if no component found for the current group.
   */
  render(asset: Asset): ComponentRef<IAssetOwner> | null {
    const compType = this.previews[asset.type] || AssetDefaultPreviewComponent;
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    if (!compType) return null;
    const componentRef = viewContainerRef.createComponent(compType);
    componentRef.instance.asset = asset;
    return componentRef;
  }
}
