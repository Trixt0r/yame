import { AssetPreviewComponent } from '../component/preview/interface';
import { AssetComponentService } from '../../../service/asset-component';
import { Asset } from 'common/asset';

import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  Input,
  ViewContainerRef,
  OnChanges,
} from '@angular/core';

/**
 *
 * @export
 * @class AssetPreviewDirective
 */
@Directive({
  selector: '[assetPreview]',
})
export class AssetPreviewDirective implements OnChanges {

  /** @type {Asset} The asset group to render. */
  @Input('assetPreview') asset: Asset;

  constructor(
    private assets: AssetComponentService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

  /** @inheritdoc */
  ngOnChanges(changes) {
    if (changes.asset)
      this.render();
  }

  /**
   * Renders the group item, if a component type for the currently set group is registered.
   *
   * @returns {ComponentRef<AssetPreviewComponent>} The created component reference or `null`
   *                                          if no component found for the current group.
   */
  render(): ComponentRef<AssetPreviewComponent> {
    const compType = this.assets.getPreview(this.asset);
    if (!compType) return null;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.asset = this.asset;
    return componentRef;
  }
}
