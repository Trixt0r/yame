import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

export interface NavItem {
  id: string;
  label?: string;
  icon?: string;
  children?: NavItem[];
}

@Component({
    selector: 'nested-dropdown',
    templateUrl: './nested-dropdown.component.html',
    styleUrls: ['./nested-dropdown.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class NestedDropdownComponent {
  @Input() items!: NavItem[];
  @Output() selected: EventEmitter<NavItem> = new EventEmitter();

  hasChildren(item: NavItem): boolean {
    return !!item.children?.length;
  }
}
