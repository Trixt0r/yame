import { MainComponent } from './main';
import { PixiService } from '../module/pixi/service';
import { Component, ElementRef, ViewChild, AfterViewInit, ChangeDetectionStrategy } from '@angular/core';
import { SidebarComponent } from '../module/sidebar/component';

/**
 * Entry point for the main application.
 *
 * @export
 * @class AppComponent
 */
@Component({
  moduleId: module.id.toString(),
  selector: 'yame-root',
  templateUrl: 'app.html',
  styleUrls: ['./app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  name = 'YAME';
  private initialized = false;

  @ViewChild('main', { static: false }) main: MainComponent;
  @ViewChild('sidebar', { static: false }) sidebar: SidebarComponent;

  constructor(public ref: ElementRef, private pixiService: PixiService) {}

  /** @inheritdoc */
  ngAfterViewInit() {
    this.sidebar.updateValue(this.sidebar.clampValue(window.innerWidth * 0.75));
    this.main.workspace.updateValue(this.main.workspace.clampValue(window.innerHeight * 0.75));
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
