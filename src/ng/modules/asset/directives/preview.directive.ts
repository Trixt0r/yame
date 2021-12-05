import { Asset } from 'common/asset';

import {
  ComponentRef,
  Directive,
  Input,
  ViewContainerRef,
  OnChanges,
  SimpleChanges,
  Type,
  NgZone,
  OnDestroy,
} from '@angular/core';
import { Select } from '@ngxs/store';
import { AssetState } from '../states/asset.state';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { DefaultAssetPreviewComponent } from '../components/previews/default/default.component';

/**
 * An interface for defining a component which is able to render a preview of a certain asset.
 */
export interface IAssetPreviewComponent<T = unknown> {
  /**
   * The asset instance.
   */
  asset: Asset<T>;
}

/**
 * Directive for injecting a preview component for a certain asset.
 */
@Directive({
  selector: '[yameAssetPreview]',
})
export class AssetPreviewDirective implements OnChanges, OnDestroy {
  /**
   * The asset to render.
   */
  @Input('yameAssetPreview') asset!: Asset;

  /**
   * Selector for reacting to preview component updates.
   */
  @Select(AssetState.previewComponents) previews$!: Observable<{ [key: string]: Type<IAssetPreviewComponent> }>;

  /**
   * A map of all preview components.
   */
  previews: { [key: string]: Type<IAssetPreviewComponent> } = {};

  /**
   * Triggered when this directive gets destroyed.
   */
  protected destroy$ = new Subject<void>();

  constructor(protected viewContainerRef: ViewContainerRef, protected zone: NgZone) {
    this.zone.runOutsideAngular(() => {
      this.previews$.pipe(takeUntil(this.destroy$)).subscribe((previews) => (this.previews = previews));
    });
  }

  /**
   * Renders the group item, if a component type for the currently set group is registered.
   *
   * @return The created component reference or `null` if no component found for the current group.
   */
  render(): ComponentRef<IAssetPreviewComponent> | null {
    const compType = this.previews[this.asset.type] || DefaultAssetPreviewComponent;
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    if (!compType) return null;
    const componentRef = viewContainerRef.createComponent(compType);
    componentRef.instance.asset = this.asset;
    return componentRef;
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.asset) this.render();
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
