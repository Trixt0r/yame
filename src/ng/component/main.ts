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
import { ToolbarComponent } from '../module/toolbar/component';
import { SceneComponent } from '../module/scene/components/scene/scene.component';
import { AssetPanelComponent } from 'ng/module/asset/components/panel/panel.component';

@Component({
  moduleId: module.id.toString(),
  selector: 'yame-main',
  templateUrl: 'main.html',
  styleUrls: ['main.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainComponent implements AfterViewInit, OnChanges {
  static get DEFAULT_SIZE(): number {
    return window.innerHeight * 0.66;
  }

  @Input() width!: number;

  @ViewChild(SceneComponent, { static: false }) scene!: SceneComponent;
  @ViewChild(ToolbarComponent, { static: false }) toolbar!: ToolbarComponent;
  @ViewChild(AssetPanelComponent) assets!: AssetPanelComponent;
  // @ViewChild(WorkspaceComponent, { static: false }) workspace!: WorkspaceComponent;

  sceneHeight = 0;

  constructor(public ref: ElementRef, protected cdr: ChangeDetectorRef) {}

  /**
   * Handles the size update event of the workspace.
   * @param {number} top The top value of the workspace.
   * @returns {void}
   */
  onAssetSizeUpdated(top: number): void {
    this.sceneHeight = top;
    this.cdr.detectChanges();
  }

  /**
   * @inheritdoc
   */
  ngAfterViewInit() {
    this.assets.updateValue(this.assets.clampValue(MainComponent.DEFAULT_SIZE));
  }

  /**
   * @inheritdoc
   */
  ngOnChanges(changes: SimpleChanges) {
    if (changes.width) {
      this.ref.nativeElement.style.width = `${changes.width.currentValue}px`;
      if (this.assets) this.assets.onResize();
    }
  }
}
