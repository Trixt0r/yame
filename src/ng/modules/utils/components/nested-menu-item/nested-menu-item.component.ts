import { Component, Input, ViewChild, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { MatMenu } from '@angular/material/menu';
import { NzDropDownDirective, NzDropdownMenuComponent } from 'ng-zorro-antd/dropdown';
import { MenuService, NzIsMenuInsideDropDownToken, NzSubmenuService } from 'ng-zorro-antd/menu';

export interface NavItem {
  id: string;
  label?: string;
  icon?: string;
  children?: NavItem[];
}

@Component({
  selector: 'nested-menu-item',
  templateUrl: './nested-menu-item.component.html',
  styleUrls: ['./nested-menu-item.component.scss'],
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
export class NestedMenuItemComponent {
  @Input() items!: NavItem[];
  @Output() selected: EventEmitter<NavItem> = new EventEmitter();
  @ViewChild('menu', { static: true }) public menu!: NzDropdownMenuComponent;

  select(item: NavItem) {
    console.log(this.menu);
    this.selected.emit(item);
  }
}
