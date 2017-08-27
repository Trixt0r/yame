import { AbstractComponent } from '../component/abstract';
import { Injectable } from '@angular/core';

import * as keyboardJS from 'keyboardjs';
import { KeyEvent as KeyboardJSKeyEvent } from 'keyboardjs';
import * as _ from 'lodash';
import * as $ from 'jquery';

interface ComponentHash {
  component: AbstractComponent;
  handler: (eventObject?: JQueryEventObject) => any;
}

interface KeyEvent extends KeyboardJSKeyEvent, KeyboardEvent {}

interface Callback { (e?: KeyEvent): void; }

/**
 * The keyboard service is meant to define keyboard short cuts for different components.
 * A component can register itself to the keyboad service and define keyboard combinations.
 * The component will receive the keyboard events if it is focused, i.e. if the user clicked or tabbed (focused) the
 * component.
 *
 * Usage should be as follows
 * <code>
 *  keyboardService.register('myId', myComponent)
 *                  .begin('myId')
 *                  .bind('ctrl + c', myCopyFn)
 *                  .bind('ctrl + v', myPasteFn) // ... more bindings
 *                  .end();
 * </code>
 *
 * Notice, that the whole service is basically a wrapper around keyboardjs.
 * This means, if you want to bind keyboard events regardless of the component context, use the 'global' id
 * when beginning your binding.
 *
 * @export
 * @class KeyboardService
 */
@Injectable()
export class KeyboardService {

  private inBindingMode = false;
  private context: string = 'global';
  private components: { [id: string] : ComponentHash } = { };

  constructor() {
    $(window).on('click focus', e => {
      let found = _.findKey(this.components, (component: ComponentHash, id) =>
        e.target == component.component.elementRef.nativeElement || component.component.$el.has(e.target).length);
      let ctx = 'global'
      if (found)
        ctx = found;
      this.context = ctx;
      keyboardJS.setContext(ctx);
    });
  }

  /**
   * Registers keyboard handling for the given component.
   *
   * @param {string} id The id to map the component to.
   * @param {AbstractComponent} component The component to register the bindings for.
   * @returns {KeyboardService}
   */
  register(id: string, component: AbstractComponent): KeyboardService {
    if (id == 'global') throw 'The "global" id is reserved!';
    if (this.components[id]) throw `A component with the id "${id}" is already registered!`;
    this.components[id] = {
      component: component,
      handler: e => {
        this.context = id;
        keyboardJS.setContext(id);
        e.stopPropagation();
      }
    };
    component.$el.on(<any>'click focus', this.components[id].handler);
    return this;
  }

  /**
   * Removes the keyboard handling for the given component.
   * All previously bound event handlers for the component will be unbound.
   *
   * @param {AbstractComponent} component
   * @returns {KeyboardService}
   */
  unregister(component: AbstractComponent): KeyboardService {
    let found = this.findId(component);
    if (found) {
      component.$el.off(<any>'click focus', <any>this.components[found].handler);
      delete this.components[found];
      if (found === this.context) {
        this.context = 'global';
        keyboardJS.setContext(this.context);
      }
    }
    return this;
  }

  /**
   * @param {AbstractComponent} component
   * @returns {string} The id for the given component.
   */
  findId(component: AbstractComponent): string {
    return _.findKey(this.components, (el: any) => el.component == component);
  }

  /**
   * Begins a binding session for the given context.
   * Call this before actually binding keyboard combinations.
   *
   * @param {(string | AbstractComponent)} context
   * @returns {KeyboardService}
   */
  begin(context: string | AbstractComponent): KeyboardService {
    if (this.inBindingMode)
      throw 'Call end() before beginning a new binding session!';
    let ctx: string = <any>context;
    if (context instanceof AbstractComponent) {
      ctx = this.findId(context);
      if (!ctx)
        throw 'The given component is not registered yet';
    }
    keyboardJS.setContext(ctx);
    this.inBindingMode = true;
    return this;
  }

  /**
   * Ends the binding mode. Call this if you are finished with binding combinations to your component.
   * @returns {KeyboardService}
   */
  end(): KeyboardService {
    if (!this.inBindingMode) return;
    keyboardJS.setContext(this.context);
    this.inBindingMode = false;
    return this;
  }

  /**
   * Binds a keyCombo to specific callback functions.
   * @param keyCombo String of keys to be pressed to execute callbacks.
   * @param pressed Callback that gets executed when the keyComboState is 'pressed', can be null.
   * @param released Callback that gets executed when the keyComboState is 'released'
   * @param preventRepeatByDefault Whether or not to prevent repeat by default. Defaults to false.
   * @returns {KeyboardService}
   */
  bind(keyCombo: string | string[],
        pressed: Callback,
        released?: Callback,
        preventRepeatByDefault?: boolean): KeyboardService {
    if (!this.inBindingMode) throw 'Call begin() before binding any combination!';
    keyboardJS.bind(keyCombo, pressed, released, preventRepeatByDefault);
    return this;
  }

  /**
   * Unbinds a keyCombo completely or only specific pressed & released callback combos.
   * @param keyCombo String of keys to be pressed to execute callbacks.
   * @param pressed Callback that gets executed when the keyComboState is 'pressed', can be null.
   * @param released Callback that gets executed when the keyComboState is 'released', can be null.
   * @returns {KeyboardService}
   */
  unbind(keyCombo: string | string[], pressed?: Callback, released?: Callback): KeyboardService {
    if (!this.inBindingMode) throw 'Call begin() before binding any combination!';
    keyboardJS.unbind(keyCombo, pressed, released);
    return this;
  }

}
