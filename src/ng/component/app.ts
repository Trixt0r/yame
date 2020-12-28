import { MainComponent } from './main';
import { Component, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SidebarComponent } from '../module/sidebar/components/sidebar.component';

/**
 * Entry point for the main application.
 *
 * @export
 * @class AppComponent
 */
@Component({
  selector: 'yame-root',
  templateUrl: 'app.html',
  styleUrls: ['app.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements AfterViewInit {
  name = 'YAME';

  mainWidth = window.innerWidth;

  /**
   * Minimum resize value for the sidebar.
   */
  get sidebarMinVal(): number {
    return Math.max(window.innerWidth * 0.66, 400);
  }

  private initialized = false;

  @ViewChild(MainComponent, { static: false }) main!: MainComponent;
  @ViewChild(SidebarComponent, { static: false }) sidebar!: SidebarComponent;

  constructor(private cdr: ChangeDetectorRef) {}

  /** @inheritdoc */
  ngAfterViewInit() {
    this.initialized = true;
  }

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  onSidebarSizeUpdate(left: number): void {
    if (!this.initialized) return;
    this.mainWidth = left;
    this.cdr.detectChanges();
  }
}
