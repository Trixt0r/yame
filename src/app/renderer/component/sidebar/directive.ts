import { Directive, ViewContainerRef } from '@angular/core';

@Directive({
  selector: '[sidebar-host]',
})
export class SidebarDirective {
  constructor(public viewContainerRef: ViewContainerRef) { }
}
