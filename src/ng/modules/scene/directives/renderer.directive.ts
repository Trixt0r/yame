import { Directive, ViewContainerRef, ComponentFactoryResolver, AfterViewInit } from '@angular/core';
import { SceneService } from '../services/scene.service';

@Directive({
  selector: '[yameSceneRendererComponent]',
})
export class SceneRendererComponentDirective implements AfterViewInit {

  constructor(
    protected scene: SceneService,
    protected viewContainerRef: ViewContainerRef,
    protected componentFactoryResolver: ComponentFactoryResolver
  ) {
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    const compType = this.scene.rendererComponent;
    if (!compType) return;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(componentFactory);
    componentRef.changeDetectorRef.detectChanges();
    componentRef.changeDetectorRef.detach();
  }
}
