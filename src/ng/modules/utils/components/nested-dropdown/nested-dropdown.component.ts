import {
  Component,
  Input,
  ViewChild,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
  HostBinding,
  HostListener,
} from '@angular/core';

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
})
export class NestedDropdownComponent {
  @Input() items!: NavItem[];
  @Output() selected: EventEmitter<NavItem> = new EventEmitter();

  hasChildren(item: NavItem): boolean {
    return !!item.children?.length;
  }
}
