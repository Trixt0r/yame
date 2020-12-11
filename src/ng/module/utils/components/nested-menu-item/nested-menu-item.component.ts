import {Component, Input, ViewChild, Output, EventEmitter, ChangeDetectionStrategy} from '@angular/core';
import { MatMenu } from '@angular/material/menu';

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
})
export class NestedMenuItemComponent {
  @Input() items!: NavItem[];
  @Output() selected: EventEmitter<NavItem> = new EventEmitter();
  @ViewChild('childMenu', { static: true }) public childMenu!: MatMenu;

  select(item: NavItem) {
    this.selected.emit(item);
  }
}
