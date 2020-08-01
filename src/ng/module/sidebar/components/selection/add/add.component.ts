import { Component, Input, AfterViewInit, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { GroupSceneComponent, SceneEntity } from 'common/scene';
import { SceneComponentsService } from 'ng/module/sidebar/services/scene-components.service';
import { NavItem } from 'ng/module/utils/components/nested-menu-item/nested-menu-item.component';
import * as _ from 'lodash';

/**
 * The add scene component button handles the creation of new components per entity.
 */
@Component({
  selector: 'yame-add-component',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
  host: {
    class: 'relative fill-width padding-vert-4'
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSceneComponentButtonComponent implements OnChanges {

  /**
   * The parent component, to attach new components to.
   */
  @Input() component?: GroupSceneComponent;

  /**
   * The entity to add new components to.
   */
  @Input() entities: SceneEntity[];

  /**
   * The items to display in the menu.
   */
  items: NavItem[];

  constructor(protected sceneComponents: SceneComponentsService) {
  }

  /**
   * The items, which are not categorized.
   */
  get componentItems(): string[] {
    const items = [];
    this.sceneComponents.items.forEach(item => {
      const categories = this.sceneComponents.getCategories(item);
      if (categories.length > 0) return;
      items.push(item);
    });
    return items;
  }

  /**
   * Initializes the items to render.
   *
   * @inheritdoc
   */
  ngOnChanges(changes): void {
    const items: NavItem[] = [];
    const sceneCategories = this.sceneComponents.categories;
    const flatList: NavItem[] = sceneCategories.map(category => {
      return {
        id: category.id,
        label: category.label,
        icon: category.icon,
        children: [],
      };
    });

    flatList.forEach(item => {
      const sceneCategory = sceneCategories.find(it => item.id === it.id);
      if (sceneCategory.categories)
        item.children = flatList.filter(it => sceneCategory.categories.indexOf(it.id) >= 0);
      if (!sceneCategory.parent)
        items.push(item);
    });

    this.sceneComponents.items.forEach(item => {
      if (this.component && !this.sceneComponents.canSceneComponentBeAddedToGroup(this.component, item)) return;
      const componentItem = {
        id: item.id,
        icon: item.icon,
        label: item.label,
      };
      const categories = sceneCategories.filter(it => it.items.indexOf(item.id) >= 0);
      if (categories.length === 0) {
        if (!componentItem.label)
          componentItem.label = item.id.split(/\.|_|-/g).map(str => _.capitalize(str)).join(' ');
        items.push(componentItem);
      } else {
        categories.forEach(it => {
          const navItem = flatList.find(_ => _.id === it.id);
          const child = Object.assign({}, componentItem);
          if (!child.label)
            child.label = item.id.split(/\.|_|-/g).filter(str => it.id !== str).map(str => _.capitalize(str)).join(' ');
          navItem.children.push(child);
        });
      }
    });
    this.items = items.filter(it => _.isNil(it.children) || (it.children && it.children.length > 0));
  }

  /**
   * Handles the selection of an menu item,
   * i.e. adds the scene component for the given menu id to the current entity.
   *
   * @param id The id of the selected item.
   */
  onSelected(id: string): void {
    this.sceneComponents.addSceneComponent(this.entities, id, this.component as GroupSceneComponent);
  }

}
