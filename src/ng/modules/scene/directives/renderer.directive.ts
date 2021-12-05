import { Directive, ViewContainerRef, ComponentFactoryResolver, AfterViewInit, Inject, Type } from '@angular/core';
import { ISceneRendererComponent, YAME_RENDERER_COMPONENT } from '../services/scene.service';

@Directive({
  selector: '[yameSceneRendererComponent]',
})
export class SceneRendererComponentDirective implements AfterViewInit {
  constructor(
    @Inject(YAME_RENDERER_COMPONENT) protected readonly rendererComponent: Type<ISceneRendererComponent<HTMLElement>>,
    protected viewContainerRef: ViewContainerRef
  ) {}

  /**
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    const compType = this.rendererComponent;
    if (!compType) return;
    this.viewContainerRef.clear();
    const componentRef = this.viewContainerRef.createComponent(compType);
    componentRef.changeDetectorRef.detectChanges();
    componentRef.changeDetectorRef.detach();
  }
}
