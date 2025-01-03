import { MainComponent } from '../main/main.component';
import { Component, ViewChild, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { SidebarComponent } from '../../modules/sidebar/components/sidebar.component';

/**
 * Entry point for the main application.
 */
@Component({
    selector: 'yame-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
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
   * Handles the sidebar size update event.
   *
   * @param left The new size.
   */
  onSidebarSizeUpdate(left: number): void {
    if (!this.initialized) return;
    this.mainWidth = left;
    this.cdr.detectChanges();
  }
}
