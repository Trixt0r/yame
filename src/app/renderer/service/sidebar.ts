import { SidebarComponent } from '../component/sidebar';
import { Injectable } from '@angular/core';

@Injectable()
export class SidebarService {

  get items() {
    return [
      new SidebarComponent()
    ]
  }
}