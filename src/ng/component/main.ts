import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { WorkspaceComponent } from '../module/workspace/component';
import { ToolbarComponent } from '../module/toolbar/component';
import { SceneComponent } from 'ng/module/scene';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-main',
  templateUrl: 'main.html',
  styleUrls: ['./main.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit, OnChanges {
  static get DEFAULT_SIZE(): number {
    return window.innerHeight * 0.75;
  }

  @Input() width: number;

  @ViewChild(SceneComponent, { static: false }) scene: SceneComponent;
  @ViewChild(ToolbarComponent, { static: false }) toolbar: ToolbarComponent;
  @ViewChild(WorkspaceComponent, { static: false }) workspace: WorkspaceComponent;

  sceneHeight = 0;

  constructor(public ref: ElementRef, protected cdr: ChangeDetectorRef) {}

  /**
   * Sidebar update handler.
   * @param {number} left
   */
  sidebarUpdate(left: number): void {
    this.ref.nativeElement.style.width = `${left}px`;
    this.workspace.onResize();
  }

  /**
   * Handles the size update event of the workspace.
   * @param {number} top The top value of the workspace.
   * @returns {void}
   */
  onWorkspaceSizeUpdated(top: number): void {
    this.sceneHeight = top;
    this.cdr.detectChanges();
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit() {
    this.workspace.updateValue(this.workspace.clampValue(MainComponent.DEFAULT_SIZE));
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.width) {
      this.ref.nativeElement.style.width = `${changes.width.currentValue}px`;
      if (this.workspace)
        this.workspace.onResize();
    }
  }
}
