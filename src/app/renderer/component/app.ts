import { PixiService } from '../module/pixi/service';
import { SidebarComponent } from './sidebar';
import { PixiComponent } from '../module/pixi/component';
import { Component, ElementRef, ViewChild } from '@angular/core';

/**
 * Entry point for the main application.
 *
 * @export
 * @class AppComponent
 */
@Component({
  moduleId: module.id,
  selector: 'my-app',
  templateUrl: 'app.html',
  styleUrls: ['app.css'],
})
export class AppComponent {
  name = 'YAME';

  @ViewChild('pixi') pixi: PixiComponent;
  @ViewChild('sidebar') sidebar: SidebarComponent;

  constructor(public ref: ElementRef, private pixiService: PixiService) { }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.pixiService.initGrid().attachCamera();
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.pixi.$el.css('width', left);
    this.pixi.onResize();
  }
}
