import { Component, ChangeDetectionStrategy, OnChanges, AfterViewInit, Input } from '@angular/core';
import { NavItem } from 'ng/module/utils/components/nested-menu-item/nested-menu-item.component';
import * as _ from 'lodash';
import { EntityTypeItem, EntityTypeService } from 'ng/module/sidebar/services/entity-type.service';

/**
 * The add entity component handles the creation of new object.
 */
@Component({
  selector: 'yame-add-entity',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddEntityComponent implements AfterViewInit {

  /**
   * The items to display in the menu.
   */
  items: NavItem[] = [];

  /**
   * The parent reference.
   */
  @Input() parent?: string;

  constructor(protected entityTypes: EntityTypeService) { }

  // /**
  //  * The items, which are not categorized.
  //  */
  // get entityItems(): string[] {
  //   const items: EntityTypeItem[] = [];
  //   this.entityTypes.items.forEach(item => {
  //     const categories = this.entityTypes.getCategories(item);
  //     if (categories.length > 0) return;
  //     items.push(item);
  //   });
  //   return items;
  // }

  /**
   * Initializes the items to render.
   *
   * @inheritdoc
   */
  ngAfterViewInit(): void {
    const items: NavItem[] = [];
    const entityTypeCategories = this.entityTypes.categories;
    const flatList: NavItem[] = entityTypeCategories.map(category => {
      return {
        id: category.id,
        label: category.label,
        icon: category.icon,
        children: [],
      };
    });

    flatList.forEach(item => {
      const sceneCategory = entityTypeCategories.find(it => item.id === it.id);
      if (!sceneCategory) return;
      if (sceneCategory.categories)
        item.children = flatList.filter(it => (sceneCategory.categories?.indexOf(it.id) || -1) >= 0);
      if (!sceneCategory.parent)
        items.push(item);
    });

    this.entityTypes.items.forEach(item => {
      const entityTypeItem = {
        id: item.id,
        icon: item.icon,
        label: item.label,
      };
      const categories = entityTypeCategories.filter(it => it.items.indexOf(item.id) >= 0);
      if (categories.length === 0) {
        if (!entityTypeItem.label)
          entityTypeItem.label = item.id.split(/\.|_|-/g).map(str => _.capitalize(str)).join(' ');
        items.push(entityTypeItem);
      } else {
        categories.forEach(it => {
          const navItem = flatList.find(_ => _.id === it.id);
          const child = Object.assign({}, entityTypeItem);
          if (!child.label)
            child.label = item.id.split(/\.|_|-/g).filter(str => it.id !== str).map(str => _.capitalize(str)).join(' ');
          navItem?.children?.push(child);
        });
      }
    });
    this.items = items.filter(it => {

      if (it.id === 'layer' && this.parent) return false;

      return _.isNil(it.children) || (it.children && it.children.length > 0);
    });
  }

  /**
   * Handles the selection of an menu item,
   * i.e. adds the scene component for the given menu id to the current entity.
   *
   * @param id The id of the selected item.
   */
  onSelected(id: string): void {
    this.entityTypes.addEntity(id, this.parent);
  }

}
