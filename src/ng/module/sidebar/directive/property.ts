import {
  Directive,
  Input,
  ViewContainerRef,
  ComponentFactoryResolver,
  OnChanges,
  ComponentRef,
  EventEmitter,
  Output,
} from '@angular/core';
import { PropertyService } from '../service/property';
import { PropertyComponent, Property, InputEvent } from '../component/property/abstract';

@Directive({
  selector: '[propertyHost]',
})
export class PropertyDirective implements OnChanges {
  /** @type {Asset} The asset group to render. */
  @Input('propertyHost') property: Property;

  /** @type {EventEmitter<InputEvent>} The click event, which should be triggered by the rendered component. */
  @Output() update: EventEmitter<InputEvent> = new EventEmitter();

  constructor(
    private properties: PropertyService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  /** @inheritdoc */
  ngOnChanges(changes) {
    if (changes.property) this.render();
  }

  /**
   * Renders the group item, if a component type for the currently set group is registered.
   *
   * @returns {ComponentRef<AssetPreviewComponent>} The created component reference or `null`
   *                                          if no component found for the current group.
   */
  render(): ComponentRef<PropertyComponent> {
    const compType = this.properties.get(this.property.type);
    if (!compType) return null;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.property = this.property;
    componentRef.instance.updateEvent.subscribe(event => this.update.emit(event));
    return componentRef;
  }
}
