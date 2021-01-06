import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { MatSliderChange } from '@angular/material/slider';
import { Select, Store } from '@ngxs/store';
import { IPoint } from 'common/math';
import { SelectState } from 'ng/module/scene';
import { CameraZoom } from 'ng/module/toolbar/states/toolbar.interface';
import { IToolComponent, Tool } from 'ng/module/toolbar/tool';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UpdateCameraZoom, ZoomCameraOut, ZoomCameraToPosition } from '../../states/actions/camera.action';
import { CameraState } from '../../states/camera.state';

@Component({
  templateUrl: 'tool.component.html',
  styleUrls: ['tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CameraToolComponent implements IToolComponent, OnDestroy {
  /**
   * @inheritdoc
   */
  tool!: Tool;

  /**
   * Selector for the current camera zoom config.
   */
  @Select(CameraState.zoom) cameraZoom$!: Observable<CameraZoom>;

  /**
   * The current camera zoom config.
   */
  cameraZoom!: CameraZoom;

  /**
   * Selector for the currently selected entity ids.
   */
  @Select(SelectState.entities) selectedEntities$!: Observable<string[]>;

  /**
   * The currently selected entity ids.
   */
  selectedEntities: string[] = [];

  /**
   * the current ca
   */
  get value(): number {
    return this.cameraZoom.value;
  }

  /**
   * Triggered when this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(
    protected store: Store,
    protected cdr: ChangeDetectorRef
  ) {
    this.cameraZoom$.pipe(takeUntil(this.destroy$)).subscribe(zoom => {
      this.cameraZoom = zoom;
      cdr.markForCheck();
    });
    this.selectedEntities$.pipe(takeUntil(this.destroy$)).subscribe(entities => {
      this.selectedEntities = entities;
      cdr.markForCheck();
    });
  }

  /**
   * Updates the camera zoom to the given value.
   *
   * @param value The zoom value to set.
   */
  update(value: number): void {
    const step = this.cameraZoom.step;
    this.store.dispatch([
      new UpdateCameraZoom({ step: Math.abs(this.cameraZoom.value - value) }),
      new ZoomCameraToPosition(value as number, this.getTargetPosition()),
      new UpdateCameraZoom({ step })
    ]);
  }

  /**
   * Formats the given values as a percent string.
   *
   * @return The formatted string.
   */
  formatLabel(value: number): string {
    return Math.round(value * 100) + '%';
  }

  /**
   * Handles the update event.
   */
  onUpdate(event: MatSliderChange): void {
    this.update(event.value as number);
  }

  /**
   * Zooms out by the currently configured zoom step.
   */
  onZoomOut(): void {
    this.update(this.value - this.cameraZoom.step);
  }

  /**
   * Zooms in by the currently configured zoom step.
   */
  onZoomIn(): void {
    this.update(this.value + this.cameraZoom.step);
  }

  /**
   * Zooms out, so all entities are visible.
   */
  onZoomCameraOut(): void {
    this.store.dispatch(new ZoomCameraOut());
  }

  /**
   * Zooms to the currently selected entities.
   */
  onZoomCameraToSelection(): void {
    this.store.dispatch(new ZoomCameraOut(this.selectedEntities));
  }

  /**
   * Returns the zoom target position.
   */
  getTargetPosition(): IPoint {
    const sceneElement = document.getElementsByTagName('yame-scene')[0];
    return { x: sceneElement.clientWidth / 2, y: sceneElement.clientHeight / 2 };
  }

  /**
   * @inheritdoc
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}