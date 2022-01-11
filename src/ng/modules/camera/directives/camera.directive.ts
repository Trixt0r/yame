import { ChangeDetectorRef, Directive, ElementRef, HostBinding, Input, NgZone } from '@angular/core';
import { Actions, ofActionSuccessful, Select, Store } from '@ngxs/store';
import { IPoint } from 'common/math';
import { SettingsState } from 'ng/modules/preferences/states/settings.state';
import { DestroyLifecycle } from 'ng/modules/utils';
import { Keydown, Keyup } from 'ng/states/hotkey.state';
import { merge, Observable, Subject, takeUntil, tap } from 'rxjs';
import { CameraZoom } from '../camera-zoom.interface';
import { UpdateCameraPosition, UpdateCameraZoom } from '../states/actions/camera.action';
import { CameraState } from '../states/camera.state';

enum MoveInitiator {
  MOUSE,
  WHEEL,
  KEYBOARD,
}

@Directive({
  selector: '[yameCamera]',
  providers: [DestroyLifecycle],
})
export class CameraDirective {
  @Input('yameCamera') set id(value: string) {
    if (this._id === value) return;
    this.zone.runOutsideAngular(() => {
      this.end();
      this._id = value;
      this.idChange$.next(this._id);
      this.init();
    });
  }

  get id(): string {
    return this._id ?? '';
  }

  /**
   * Determines whether the movement session is active.
   */
  get moving(): boolean {
    return this.prevPos !== null;
  }

  @HostBinding('style.cursor')
  get cursor(): string | null {
    return this.moving ? 'grabbing !important' : null;
  }

  /**
   * Selector for the camera move button.
   */
  @Select(SettingsState.value('camera.moveType')) moveButton$!: Observable<number>;

  /**
   * The mouse button to be pressed for moving the camera.
   */
  private mouseMoveButton = 1;

  private _id?: string;

  private idChange$ = new Subject<string>();

  private zoom: CameraZoom = { value: 1, min: 0, max: 5, step: 0.01, target: { x: 0, y: 0 } };
  private position: IPoint = { x: 0, y: 0 };

  private camPos: IPoint | null = null;
  private prevPos: IPoint | null = null;
  private moveInitiator: MoveInitiator = MoveInitiator.MOUSE;
  private lastMousePosition: IPoint = { x: 0, y: 0 };

  private onWheelBound = this.onWheel.bind(this);
  private onPointerDownBound = this.onPointerDown.bind(this);
  private onPointerMoveBound = this.onPointerMove.bind(this);
  private onPointerUpBound = this.onPointerUp.bind(this);
  private onPointerEnterBound = this.onPointEnter.bind(this);
  private cacheMousePosition = (e: PointerEvent) => (this.lastMousePosition = this.getMousePosition(e));

  constructor(
    private el: ElementRef<HTMLElement>,
    private store: Store,
    private actions: Actions,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private destroy$: DestroyLifecycle
  ) {
    this.idChange$.subscribe(() => {
      this.end();
      this.el.nativeElement.removeEventListener('wheel', this.onWheelBound);
      this.el.nativeElement.removeEventListener('pointerdown', this.onPointerDownBound);
      this.el.nativeElement.removeEventListener('pointerenter', this.onPointerEnterBound);
      this.el.nativeElement.removeEventListener('pointermove', this.cacheMousePosition);
    });
    this.destroy$.subscribe(() => {
      this.idChange$.next(this.id);
      this.idChange$.complete();
    });
  }

  /**
   * Initializes the camera event & state listeners.
   */
  private init(): void {
    const element = this.el.nativeElement;
    element.addEventListener('wheel', this.onWheelBound, { capture: true });
    element.addEventListener('pointerdown', this.onPointerDownBound);
    element.addEventListener('pointerenter', this.onPointerEnterBound);

    const state = this.store.selectSnapshot(_ => _.camera);
    const zoom = CameraState.zoom(this._id!)(state);
    const position = CameraState.position(this._id!)(state);
    this.zoom = { ...zoom };
    this.position = { x: position.x, y: position.y };

    merge(
      this.actions.pipe(
        ofActionSuccessful(UpdateCameraZoom, UpdateCameraPosition),
        tap((action: UpdateCameraZoom | UpdateCameraPosition) => {
          if (!this._id || action.id !== this._id) return;
          if (action instanceof UpdateCameraZoom) {
            this.zoom = { ...this.zoom, ...action.zoom } as CameraZoom;
          } else if (action instanceof UpdateCameraPosition) {
            this.position = { x: action.position.x, y: action.position.y };
          }
        })
      ),
      this.actions.pipe(ofActionSuccessful(Keydown, Keyup)).pipe(
        tap((_: Keydown | Keyup) => {
          if (!this._id) return;
          _.event.preventDefault();
          _.event.stopImmediatePropagation();
          if (_ instanceof Keydown) {
            if (_.shortcut.id !== 'camera.move' || this.moving) return;
            this.moveInitiator = MoveInitiator.KEYBOARD;
            this.begin(this.lastMousePosition);
          } else if (_ instanceof Keyup) {
            if (_.shortcut.id === 'camera.move' && this.moving && this.moveInitiator === MoveInitiator.KEYBOARD)
              this.end();
          }
        })
      ),
      this.moveButton$.pipe(tap(val => (this.mouseMoveButton = val)))
    )
      .pipe(takeUntil(this.idChange$), takeUntil(this.destroy$))
      .subscribe();
  }

  /**
   * Returns the actual mouse position relative to the currently bound element.
   *
   * @param event The mouse event.
   */
  private getMousePosition(event: PointerEvent | WheelEvent): IPoint {
    const canvas = this.el.nativeElement;
    const rect = this.el.nativeElement.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / (rect.right - rect.left)) * canvas.clientWidth,
      y: ((event.clientY - rect.top) / (rect.bottom - rect.top)) * canvas.clientHeight,
    };
  }

  /**
   * Begins the camera movement session.
   */
  begin(position: IPoint): void {
    if (this.moving) return;
    this.prevPos = position;
    this.camPos = { x: this.position.x, y: this.position.y };
    window.addEventListener('pointermove', this.onPointerMoveBound);
    this.el.nativeElement.removeEventListener('pointermove', this.cacheMousePosition);
    this.cdr.markForCheck();
  }

  /**
   * Ends the camera movement session.
   */
  end(): void {
    this.prevPos = null;
    window.removeEventListener('pointermove', this.onPointerMoveBound);
    window.removeEventListener('pointerup', this.onPointerUpBound);
    this.onPointEnter(); // start position caching again
    this.cdr.markForCheck();
  }

  /**
   * Handles the wheel event, which causes the camera to zoom.
   *
   * @param event The triggered mouse wheel event.
   */
  onWheel(event: WheelEvent): void {
    if (!this._id) return;
    event.preventDefault();
    event.detail;
    const isTrackPad = Math.abs(event.deltaY) <= 120 && event.deltaMode === 0;
    if (isTrackPad && !event.ctrlKey) {
      if (!this.moving) this.moveInitiator = MoveInitiator.WHEEL;
      this.store.dispatch(
        new UpdateCameraPosition(this._id, {
          x: this.position.x + event.deltaX * 2,
          y: this.position.y + event.deltaY * 2,
        })
      );
    } else {
      if (this.moving && this.moveInitiator === MoveInitiator.WHEEL) this.end();
      const step = isTrackPad ? -event.deltaY / 100 : -this.zoom.step * Math.sign(event.deltaY);
      const value = Math.min(this.zoom.max, Math.max(this.zoom.min, this.zoom.value + step));
      this.store.dispatch(
        new UpdateCameraZoom(this.id, {
          value,
          target: this.getMousePosition(event),
        })
      );
    }
  }

  /**
   * Handles the pointer down event, which starts a camera move, if the proper button has been pressed.
   *
   * @param event The triggered pointer event.
   */
  onPointerDown(event: PointerEvent): void {
    if (!this._id) return;
    if (this.moving && this.moveInitiator === MoveInitiator.WHEEL) this.end();
    if (event.button !== this.mouseMoveButton) return; // Only listen for registered button
    event.preventDefault();
    event.stopImmediatePropagation();
    window.addEventListener('pointerup', this.onPointerUpBound);
    this.moveInitiator = MoveInitiator.MOUSE;
    this.begin(this.getMousePosition(event));
  }

  /**
   * Handles the pointer up event, which resets the internal data.
   */
  onPointerUp(): void {
    if (!this._id) return;
    if (!this.moving || this.moveInitiator !== MoveInitiator.MOUSE) return; // Only listen for right click
    this.end();
  }

  /**
   * Handles the mouse up event, which makes the camera move.
   *
   * @param event The triggered mouse move event.
   */
  onPointerMove(event: PointerEvent): void {
    if (!this._id) return;
    if (!this.moving || this.moveInitiator === MoveInitiator.WHEEL) return this.end(); // Only listen for right click
    event.preventDefault();
    event.stopPropagation();
    if (this.moveInitiator === MoveInitiator.KEYBOARD) event.stopImmediatePropagation();
    const pos = this.getMousePosition(event);
    this.store.dispatch(
      new UpdateCameraPosition(this._id, {
        x: this.camPos!.x + (pos.x - this.prevPos!.x),
        y: this.camPos!.y + (pos.y - this.prevPos!.y),
      })
    );
  }

  /**
   * Handles the pointer enter event, which starts caching the mouse position.
   */
  onPointEnter(): void {
    if (!this._id) return;
    this.el.nativeElement.addEventListener('pointermove', this.cacheMousePosition);
  }
}
