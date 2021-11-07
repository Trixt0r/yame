import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  NgZone,
  OnDestroy,
  ViewEncapsulation,
} from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { IPoint } from 'common/math';
import { SelectState } from 'ng/modules/scene';
import { IToolComponent, Tool } from 'ng/modules/toolbar/tool';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { CameraZoom } from '../../camera-zoom.interface';
import { UpdateCameraZoom, ZoomCameraOut, ZoomCameraToPosition } from '../../states/actions/camera.action';
import { CameraState } from '../../states/camera.state';

@Component({
  selector: 'yame-camera-tool',
  templateUrl: 'tool.component.html',
  styleUrls: ['tool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
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
   * The current camera zoom
   */
  set value(value: number) {
    this.update(value);
  }

  get value(): number {
    return this.cameraZoom.value;
  }

  /**
   * Triggered when this component gets destroyed.
   */
  protected destroy$ = new Subject();

  constructor(protected store: Store, protected cdr: ChangeDetectorRef, protected zone: NgZone) {
    zone.runOutsideAngular(() => {
      this.cameraZoom$.pipe(takeUntil(this.destroy$)).subscribe((zoom) => {
        this.cameraZoom = zoom;
        cdr.markForCheck();
      });
      this.selectedEntities$.pipe(takeUntil(this.destroy$)).subscribe((entities) => {
        this.selectedEntities = entities;
        cdr.markForCheck();
      });
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
      new UpdateCameraZoom({ step }),
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
