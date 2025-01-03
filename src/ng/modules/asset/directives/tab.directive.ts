import { Directive, Input, OnChanges, Type, ViewContainerRef } from '@angular/core';
import { Asset } from 'common/asset';
import { IAssetOwner } from '../interfaces';

/**
 * Directive for injecting a preview component for a certain asset.
 */
@Directive({
    selector: '[yameAssetTab]',
    standalone: false
})
export class AssetTabDirective implements OnChanges {
  /**
   * The asset to render.
   */
  @Input('yameAssetTab') asset!: Asset;

  /**
   * The component to render.
   */
  @Input('yameAssetTabContent') content!: Type<IAssetOwner>;

  constructor(protected viewContainerRef: ViewContainerRef) {}

  /**
   * Renders the current asset tab content.
   */
  private render(): void {
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(this.content);
    componentRef.instance.asset = this.asset;
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(): void {
    if (!this.asset || !this.content) return;
    this.render();
  }
}
