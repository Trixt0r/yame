import { Directive, Input, ViewContainerRef, ComponentFactoryResolver, ComponentRef, OnChanges } from "@angular/core";
import { Tool } from "../tool";
import { ToolbarService } from "../service";
import { ToolComponent } from "../component/tool";

/**
 * Directive for rendering a tool component in a template.
 *
 * @class ToolDirective
 */
@Directive({
  selector: '[toolHost]'
})
export class ToolDirective implements OnChanges {

  @Input('toolHost') tool: Tool;

  constructor(
    private tools: ToolbarService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) { }

  /** @inheritdoc */
  ngOnChanges(changes) {
    if (changes.tool)
      this.render();
  }

  /**
   * Renders the tool, if a component type for the currently set tool is registered.
   *
   * @returns {ComponentRef<ToolComponent>} The created component reference or `null`
   *                                          if no component found for the current tool.
   */
  render(): ComponentRef<ToolComponent> {
    let compType = this.tools.getComponent(this.tool);
    if (!compType) return null;
    let componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    let viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    let componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.tool = this.tool;
    return componentRef;
  }

}
