import { Component, Input, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { GroupSceneComponent, SceneEntity } from 'common/scene';
import { SceneComponentsService } from 'ng/modules/sidebar/services/scene-components.service';
import { NavItem } from 'ng/modules/utils/components/nested-dropdown/nested-dropdown.component';
import { TranslateService } from '@ngx-translate/core';
import { capitalize, isNil } from 'lodash';
import { MenuService, NzIsMenuInsideDropDownToken, NzSubmenuService } from 'ng-zorro-antd/menu';

/**
 * The add scene component button handles the creation of new components per entity.
 */
@Component({
  selector: 'yame-add-component',
  templateUrl: './add.component.html',
  styleUrls: ['./add.component.scss'],
  host: {
    class: 'relative fill-width padding-vert-4',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    MenuService,
    NzSubmenuService,
    {
      provide: NzIsMenuInsideDropDownToken,
      useValue: true,
    },
  ],
})
export class AddSceneComponentButtonComponent implements OnChanges {
  /**
   * The parent component, to attach new components to.
   */
  @Input() component?: GroupSceneComponent;

  /**
   * The entity to add new components to.
   */
  @Input() entities: SceneEntity[] = [];

  /**
   * The items to display in the menu.
   */
  items: NavItem[] = [];

  constructor(protected sceneComponents: SceneComponentsService, protected translate: TranslateService) {}

  /**
   * Initializes the items to render.
   *
   * @inheritdoc
   */
  ngOnChanges(): void {
    const items: NavItem[] = [];
    const sceneCategories = this.sceneComponents.categories;
    const flatList: NavItem[] = sceneCategories.map((category) => {
      return {
        id: category.id,
        label: category.label,
        icon: category.icon,
        children: [],
      };
    });

    flatList.forEach((item) => {
      const sceneCategory = sceneCategories.find((it) => item.id === it.id);
      if (!sceneCategory) return;
      if (sceneCategory.categories) {
        const categories = sceneCategory.categories || [];
        item.children = flatList.filter((it) => categories.indexOf(it.id) >= 0);
      }
      if (!sceneCategory.parent) items.push(item);
    });

    this.sceneComponents.items.forEach((item) => {
      if (this.component && !this.sceneComponents.canSceneComponentBeAddedToGroup(this.component, item)) return;
      const componentItem = {
        id: item.id,
        icon: item.icon,
        label: item.label,
      };
      const categories = sceneCategories.filter((it) => it.items.indexOf(item.id) >= 0);
      if (categories.length === 0) {
        if (!componentItem.label)
          componentItem.label = item.id
            .split(/\.|_|-/g)
            .map((str) => capitalize(str))
            .join(' ');
        items.push(componentItem);
      } else {
        categories.forEach((it) => {
          const navItem = flatList.find((it) => it.id === it.id);
          const child = Object.assign({}, componentItem);
          if (!child.label)
            child.label = item.id
              .split(/\.|_|-/g)
              .filter((str) => it.id !== str)
              .map((str) => capitalize(str))
              .join(' ');
          child.label = this.translate.instant(child.label);
          navItem?.children?.push(child);
        });
      }
    });
    this.items = items.filter((it) => isNil(it.children) || (it.children && it.children.length > 0));
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
