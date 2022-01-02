import { State, NgxsOnInit, StateContext, Store, Action } from '@ngxs/store';
import { HotkeyService } from 'ng/services/hotkey.service';
import { Injectable, NgZone } from '@angular/core';

export interface Shortcut {
  /**
   * The unique id of the shortcut.
   */
  id: string;

  /**
   * The name of the shortcut.
   */
  label: string;

  /**
   * Any further description for the shortcut.
   */
  description?: string;

  /**
   * The keys to be pressed.
   */
  keys?: string[];
}

export class Keydown {
  static readonly type = '[Hotkey] Keydown';
  constructor(public readonly shortcut: Shortcut, public readonly event: KeyboardEvent) {}
}

export class Keyup {
  static readonly type = '[Hotkey] Keyup';
  constructor(public readonly shortcut: Shortcut, public readonly event: KeyboardEvent) {}
}

export class AddShortcut {
  static readonly type = '[Hotkey] Add shortcut';
  constructor(public readonly shortcut: Shortcut) {}
}

export interface IHotkeyState {
  shortcuts: Shortcut[];
}

@State<IHotkeyState>({
  name: 'hotkey',
  defaults: {
    shortcuts: [
      {
        id: 'save',
        label: 'Save',
        keys: [`${HotkeyService.commandOrControl}.s`],
      },
      {
        id: 'save.as',
        label: 'Save',
        keys: [`${HotkeyService.commandOrControl}.shift.s`],
      },
      {
        id: 'open',
        label: 'Open',
        keys: [`${HotkeyService.commandOrControl}.o`],
      },
      {
        id: 'undo',
        label: 'Undo',
        keys: [`${HotkeyService.commandOrControl}.z`],
      },
      {
        id: 'redo',
        label: 'Redo',
        keys: [`${HotkeyService.commandOrControl}.y`, `${HotkeyService.commandOrControl}.shift.z`],
      },
      {
        id: 'copy',
        label: 'Copy',
        keys: [`${HotkeyService.commandOrControl}.c`],
      },
      {
        id: 'paste',
        label: 'Paste',
        keys: [`${HotkeyService.commandOrControl}.v`],
      },
      {
        id: 'cut',
        label: 'Cut',
        keys: [`${HotkeyService.commandOrControl}.x`],
      },
      {
        id: 'remove',
        label: 'Remove',
        keys: ['delete', 'backspace'],
      },
    ],
  },
})
@Injectable()
export class HotkeyState implements NgxsOnInit {
  constructor(protected hotkeys: HotkeyService, protected store: Store, protected zone: NgZone) {}

  /**
   * Registers the given shortcut via the hotkey service.
   *
   * @param shortcut The shortcut to register.
   */
  protected registerShortcut(shortcut: Shortcut): void {
    this.zone.runOutsideAngular(() => {
      this.hotkeys
        .register({ keys: shortcut.keys, event: 'keydown' })
        .subscribe(event => this.store.dispatch(new Keydown(shortcut, event)));
      this.hotkeys
        .register({ keys: shortcut.keys, event: 'keyup' })
        .subscribe(event => this.store.dispatch(new Keyup(shortcut, event)));
    });
  }

  /**
   * @inheritdoc
   */
  ngxsOnInit(ctx?: StateContext<IHotkeyState>) {
    ctx?.getState().shortcuts.forEach(it => {
      if (!it.keys) return;
      this.registerShortcut(it);
    });
  }

  @Action(AddShortcut)
  addShortcut(ctx: StateContext<IHotkeyState>, action: AddShortcut): void {
    const shortcuts = ctx.getState().shortcuts.slice();
    shortcuts.push(action.shortcut);
    this.registerShortcut(action.shortcut);
    ctx.patchState({ shortcuts });
  }
}
