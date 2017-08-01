import { AssetComponentService } from '../../../service/asset-component';
import { AssetService } from '../../../service/asset';
import { Asset } from '../../../../../../common/asset';

import {  Input, Output, EventEmitter, Directive, ViewContainerRef, ComponentFactoryResolver, OnInit } from '@angular/core';

/**
 *
 * @export
 * @class AssetPreviewDirective
 */
@Directive({
  selector: '[assetPreview]',
})
export class AssetPreviewDirective {

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
   * @returns {void}
   */
  render(): void {
    let compType = this.assets.getPreview(this.asset);
    if (!compType) return;
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    let viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    let componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.asset = this.asset;
  }
}
