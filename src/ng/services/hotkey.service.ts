import { Injectable, Inject } from '@angular/core';
import { EventManager } from '@angular/platform-browser';
import { Observable, merge, Subscriber } from 'rxjs';
import { DOCUMENT } from '@angular/common';

export interface HotkeyOptions {
  element: HTMLElement;
  keys: string | string[];
  event: string;
}

@Injectable({ providedIn: 'root' })
export class HotkeyService {

  defaults: Partial<HotkeyOptions> = {
    element: this.document.body,
    event: 'keydown'
  };

  /**
   * Internal registry for keeping track of which observers to unsubscribe, if necessary.
   */
  protected registry: { element: HTMLElement, eventName: string, observer: Subscriber<KeyboardEvent> }[] = [];

  constructor(private eventManager: EventManager,
              @Inject(DOCUMENT) private document: Document) { }

  /**
   * Registers hotkeys and returns an observable for it, so you can subscribe and unsubscribe to.
   *
   * @param options Options for registering hotkeys.
   * @return The observable to subscribe or unsubscribe to.
   */
  register(options: Partial<HotkeyOptions>): Observable<KeyboardEvent> {
    const merged = { ...this.defaults, ...options };
    const keys = Array.isArray(merged.keys) ? merged.keys : [merged.keys];

    const observables = keys.map(combination => {
      const eventName = `${merged.event}.${combination}`;
      return new Observable<KeyboardEvent>(observer => {
        this.registry.push({ element: merged.element, eventName, observer });
        const handler = (event: KeyboardEvent) => {
          event.preventDefault();
          event.stopImmediatePropagation();
          observer.next(event);
        };
        const dispose = this.eventManager.addEventListener(merged.element, eventName, handler);
        return () => dispose();
      });
    });
    return merge(observables).mergeAll();
  }

  /**
   * Removes the previously bound hotkeys based on the given options.
   *
   * This will unsubscribe all observers matching the given options.
   *
   * @param options Options under which the hotkeys were registered.
   */
  unregister(options: Partial<HotkeyOptions>): void {
    const merged = { ...this.defaults, ...options };
    const keys = Array.isArray(merged.keys) ? merged.keys : [merged.keys];
    keys.forEach(combination => {
      const eventName = `${merged.event}.${combination}`;
      this.registry.slice().forEach(it => {
        if (it.element !== merged.element || it.eventName !== eventName) return;
        it.observer.unsubscribe();
        const idx = this.registry.indexOf(it);
        if (idx >= 0) this.registry.splice(idx, 1);
      });
    });
  }
}
