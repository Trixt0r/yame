import { Asset } from 'common/asset';

import {
  ComponentFactoryResolver,
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

/**
 * An interface for defining a component which is able to render a preview of a certain asset.
 */
export interface IAssetDetailsComponent<T = unknown> {

  /**
   * The asset instance.
   */
  asset: Asset<T>;
}


/**
 * Directive for displaying further details for a certain asset.
 */
@Directive({
  selector: '[yameAssetDetails]',
})
export class AssetDetailsDirective implements OnChanges, OnDestroy {

  /**
   * The asset to render.
   */
  @Input('yameAssetDetails') asset!: Asset;

  /**
   * Selector for reacting to details component updates.
   */
  @Select(AssetState.detailsComponents) details$!: Observable<{ [key: string]: Type<IAssetDetailsComponent> }>;

  /**
   * A map of all details components.
   */
  details: { [key: string]: Type<IAssetDetailsComponent> } = { };

  /**
   * Triggered when this directive gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(
    protected viewContainerRef: ViewContainerRef,
    protected componentFactoryResolver: ComponentFactoryResolver,
    protected zone: NgZone
  ) {
    this.zone.runOutsideAngular(() => {
      this.details$.pipe(takeUntil(this.destroy$)).subscribe(details => this.details = details);
    });
  }

  /**
   * Renders the group item, if a component type for the currently set group is registered.
   *
   * @return The created component reference or `null` if no component found for the current group.
   */
  render(): ComponentRef<IAssetDetailsComponent> | null {
    const compType = this.details[this.asset.type];
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    if (!compType) return null;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    const componentRef = viewContainerRef.createComponent(componentFactory);
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
