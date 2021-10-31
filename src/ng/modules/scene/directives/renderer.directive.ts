import { Directive, ViewContainerRef, ComponentFactoryResolver, AfterViewInit, Inject, Type } from '@angular/core';
import { ISceneRendererComponent, YAME_RENDERER_COMPONENT } from '../services/scene.service';

@Directive({
  selector: '[yameSceneRendererComponent]',
})
export class SceneRendererComponentDirective implements AfterViewInit {
  constructor(
    @Inject(YAME_RENDERER_COMPONENT) protected readonly rendererComponent: Type<ISceneRendererComponent<HTMLElement>>,
    protected viewContainerRef: ViewContainerRef,
    protected componentFactoryResolver: ComponentFactoryResolver
  ) {}

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    const compType = this.rendererComponent;
    if (!compType) return;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    componentRef.changeDetectorRef.detectChanges();
    componentRef.changeDetectorRef.detach();
  }
}
