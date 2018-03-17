import { MainComponent } from './main';
import { PixiService } from '../module/pixi/service';
import { PixiComponent } from '../module/pixi/component';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { SidebarComponent } from "../module/sidebar/component";

/**
 * Entry point for the main application.
 *
 * @export
 * @class AppComponent
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'app-root',
  templateUrl: 'app.html',
  styleUrls: ['./app.scss'],
})
export class AppComponent {
  name = 'YAME';
  private initialized = false;

  @ViewChild('main') main: MainComponent;
  @ViewChild('sidebar') sidebar: SidebarComponent;

  constructor(public ref: ElementRef, private pixiService: PixiService) { }

  /** @inheritdoc */
  ngAfterViewInit() {
    this.sidebar.updateValue(this.sidebar.clampValue(window.innerWidth * .75));
    this.main.workspace.updateValue(this.main.workspace.clampValue(window.innerHeight * .75));
    this.initialized = true;
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    if (!this.initialized) return;
    this.main.sidebarUpdate(left);
  }
}
