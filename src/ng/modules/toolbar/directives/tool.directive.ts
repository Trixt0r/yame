import { Directive, Input, ViewContainerRef, ComponentFactoryResolver, ComponentRef, OnChanges, SimpleChanges } from '@angular/core';
import { Tool, IToolComponent } from '../tool';
import { DefaultToolComponent } from '../components/tool/default/default.component';

/**
 * Directive for rendering a tool component in a template.
 */
@Directive({
  selector: '[yameTool]',
})
export class ToolDirective implements OnChanges {

  /**
   * The tool to display.
   */
  @Input('yameTool') tool!: Tool;

  constructor(
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.tool) this.render();
  }

  /**
   * Renders the tool, if a component type for the currently set tool is registered.
   *
   * @return The created component reference or `null` if no component found for the current tool.
   */
  render(): ComponentRef<IToolComponent> | null {
    const compType = this.tool.component || DefaultToolComponent
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    if (!compType) return null;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.tool = this.tool;
    return componentRef;
  }
}
