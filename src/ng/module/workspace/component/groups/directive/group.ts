import { GroupComponent } from '../component/group/abstract';
import { GroupComponentService } from '../../../service/group-component';
import { AssetService } from '../../../service/asset';
import { Asset } from '../../../../../../common/asset';
import { AssetGroup } from '../../../../../../common/asset/group';

import {
  ComponentFactoryResolver,
  ComponentRef,
  Directive,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewContainerRef,
  OnChanges,
  SimpleChanges,
} from '@angular/core';

/**
 * The groupHost directive is used to render arbitary types of asset groups.
 *
 * In order to render a group item, the way you want, you have to register a component type
 * for a certain asset group type in the group component service.
 *
 * Asset group types which are not registered in the service, will not be displayed.
 *
 * @export
 * @class GroupDirective
 */
@Directive({
  selector: '[groupHost]',
})
export class GroupDirective implements OnChanges {
  /** @type {AssetGroup<Asset>} The asset group to render. */
  @Input('groupHost') group!: AssetGroup<Asset>;

  /** @type {EventEmitter<MouseEvent>} The click event, which should be triggered by the rendered component. */
  @Output('click') click: EventEmitter<MouseEvent> = new EventEmitter();

  constructor(
    private groups: GroupComponentService,
    private viewContainerRef: ViewContainerRef,
    private componentFactoryResolver: ComponentFactoryResolver
  ) {}

  /** @inheritdoc */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.group) this.render();
  }

  /**
   * Renders the group item, if a component type for the currently set group is registered.
   *
   * @returns {ComponentRef<GroupComponent>} The created component reference or `null`
   *                                          if no component found for the current group.
   */
  render(): ComponentRef<GroupComponent> | null {
    const compType = this.groups.get(this.group);
    if (!compType) return null;
    const componentFactory = this.componentFactoryResolver.resolveComponentFactory(compType);
    const viewContainerRef = this.viewContainerRef;
    viewContainerRef.clear();
    const componentRef = viewContainerRef.createComponent(componentFactory);
    componentRef.instance.group = this.group;
    componentRef.instance.clickEvent.subscribe((event: MouseEvent) => this.click.emit(event));
    return componentRef;
  }
}
