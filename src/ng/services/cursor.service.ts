import { Injectable, NgZone } from '@angular/core';

/**
 * The cursor service can be used to display an image at the current mouse position
 * instead of the limited css cursor options.
 *
 * You can set any src on the image reference and style it to your needs.
 *
 * __Usage__
 * ```ts
 * // Start showing a custom cursor
 * cursorService.begin(myHtmlElement);
 * cursorService.image.src = 'uri/to/image';
 * cursorService.image.style.transform = `rotate(${myRotation}rad)`;
 *
 * // Restore to the previous cursor
 * cursorService.end();
 * ```
 */
@Injectable({ providedIn: 'root' })
export class CursorService {

  /**
   * The image reference, which gets displayed instead of the cursor.
   */
  public readonly image: HTMLImageElement;

  /**
   * The currently bound html target.
   */
  protected target: HTMLElement | null = null;

  /**
   * The cached cursor string, for restoring the old cursor on end.
   */
  protected cachedCursor: string | null = null;

  /**
   * Bound mousemove handler.
   */
  protected boundOnMousemove = this.onMousemove.bind(this);

  constructor(protected zone: NgZone) {
    this.image = document.createElement('img');
    this.image.style.position = 'absolute';
    this.image.style.pointerEvents = 'none';
  }

  /**
   * Begin a cursor session.
   * Will attach the image reference to the dom and display it at the current mouse position.
   * The css cursor will not be displayed, until `end` gets called.
   *
   * @param target The target from which to memorize the current css cursor.
   */
  begin(target: HTMLElement): void {
    if (this.target === target) return;
    const attached = !!this.target;
    if (this.target) this.end(false);
    if (target.style.cursor && target.style.cursor !== 'none') this.cachedCursor = target.style.cursor;
    target.style.cursor = 'none';
    this.target = target;
    if (attached) return;
    document.body.appendChild(this.image);
    this.zone.runOutsideAngular(() => window.addEventListener('mousemove', this.boundOnMousemove));
  }

  /**
   * Ends the current cursor session and restores the cursor of the previously bound html element.
   *
   * @param remove Optional flag which can be set to prevent removal of the image reference.
   */
  end(remove = true): void {
    if (!this.target) return;
    if (this.cachedCursor) this.target.style.cursor = this.cachedCursor;
    this.target = null;
    if (!remove) return;
    this.image.style.removeProperty('transform');
    this.image.src = '';
    document.body.removeChild(this.image);
    this.zone.runOutsideAngular(() => window.removeEventListener('mousemove', this.boundOnMousemove));
  }

  /**
   * Handles the mousemove event on the window.
   *
   * @param event The triggered event.
   */
  onMousemove(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!this.image.src) {
      target.style.cursor = '';
    } else {
      this.image.style.left = `${event.clientX}px`;
      this.image.style.top = `${event.clientY}px`;
    }
  }

}
