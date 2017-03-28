import { MainComponent } from './main';
import { WorkspaceComponent } from './workspace';
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

  @ViewChild('main') main: MainComponent;
  @ViewChild('sidebar') sidebar: SidebarComponent;

  constructor(public ref: ElementRef, private pixiService: PixiService) { }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.pixiService.initGrid().attachCamera();
    this.sidebar.updateValue(window.innerWidth * .75);
    this.main.workspace.updateValue(window.innerHeight * .75);
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.main.sidebarUpdate(left);
  }
}
