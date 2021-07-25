import { Injectable, InjectionToken, Injector } from '@angular/core';
import { ActionType, NgxsNextPluginFn, NgxsPlugin } from '@ngxs/store';
import { Type } from 'common/type';
import { from, isObservable, Observable } from 'rxjs';

/**
 * Options to be passed to the `OnBeforeActionHandler`.
 */
interface OnBeforeActionOptions {
  /**
   * Whether to abort the action dispatch, if the handler happens to fail.
   */
  abortOnError?: boolean;
}

/**
 * Handler executed right before the given action is being dispatched.
 * Can be synchronous or asynchronous.
 */
interface OnBeforeActionHandler {
  (state: any, action: any): Promise<any> | Observable<any> | any;
}

const METADATA_ON_BEFORE_ACTION_KEY = '__onBeforeActionMetadata';

interface OnBeforeActionMetadata {
  /**
   * Methods to be called on the `on before action` class instance.
   */
  configs: { [key: string]: [string, OnBeforeActionOptions?][] };
}

/**
 * Definition for a class with `on before action` metadata.
 */
export interface OnBeforeActionClass extends Type {
  /**
   * Metadata for an `on before action` handler.
   */
  [METADATA_ON_BEFORE_ACTION_KEY]: OnBeforeActionMetadata;

  /**
   * Injection token for this class, if any.
   */
  injectionToken?: InjectionToken<unknown>;
}

const onBeforeActionClasses: OnBeforeActionClass[] = [];

function ensureOnBeforeMetadata(target: any): OnBeforeActionClass {
  if (!target[METADATA_ON_BEFORE_ACTION_KEY]) {
    const value: OnBeforeActionMetadata = {
      configs: {},
    };
    Object.defineProperty(target, METADATA_ON_BEFORE_ACTION_KEY, { value });
    onBeforeActionClasses.push(target);
  }

  return target;
}

// Internal handler map
const handlerRegistry = new Map<string, [OnBeforeActionHandler, OnBeforeActionOptions?][]>();

/**
 * Returns a function for registering an `OnBeforeAction` handler.
 * Such a handler is called right before the given actions being dispatched.
 * This allows modules to modify the action
 * before it is being sent to the responsible state service, updating the store.
 *
 * Example usage 1:
 * ```ts
 * @Injectable()
 * class Handler {
 *  @OnBeforeAction(MyAction1, MyAction2)
 *  onBeforeAction(state, action: MyAction1 | MyAction2) {
 *    // ... process ...
 *  }
 * }
 * ```
 *
 * Example usage 2:
 * ```ts
 * OnBeforeAction(MyAction1, MyAction2)
 *  (async (state, action: MyAction1 | MyAction2) => { ... });
 * ```
 *
 * @param actions The actions to register the handler on.
 * @todo Check why this function does not work as a decorator in AOT mode.
 */
export function OnBeforeAction(actions: ActionType | ActionType[], options?: OnBeforeActionOptions) {
  const types = Array.isArray(actions) ? actions : [actions];
  const fn = function (handler: any, key?: string): any {
    types.forEach((actionType) => {
      if (!handlerRegistry.has(actionType.type)) handlerRegistry.set(actionType.type, []);
      if (typeof handler === 'function') {
        const handlers = handlerRegistry.get(actionType.type);
        handlers!.push([handler, options]);
      } else if (key) {
        const meta = ensureOnBeforeMetadata(handler.constructor)[METADATA_ON_BEFORE_ACTION_KEY];
        if (!meta.configs[actionType.type]) meta.configs[actionType.type] = [];
        meta.configs[actionType.type].push([key, options]);
      }
    });
    return fn;
  };
  return fn;
}

@Injectable()
export class OnBeforePlugin implements NgxsPlugin {
  constructor(protected injector: Injector) {
    this.decorateInstances();
  }

  /**
   * @inheritdoc
   */
  protected decorateInstances(): void {
    onBeforeActionClasses.forEach((clazz) => {
      const instance = this.injector.get(clazz.injectionToken ?? clazz) as any;
      if (!instance) return;
      const meta = clazz[METADATA_ON_BEFORE_ACTION_KEY];
      Object.keys(meta.configs).forEach((type) => {
        const configs = meta.configs[type];
        if (!handlerRegistry.has(type)) handlerRegistry.set(type, []);
        const handlers = handlerRegistry.get(type);
        configs.forEach((config) => {
          const fn = function () {
            return instance[config[0]].apply(instance, arguments);
          };
          handlers!.push([fn, config[1]]);
        });
      });
    });
  }

  /**
   * @inheritdoc
   */
  handle(state: any, action: unknown, next: NgxsNextPluginFn) {
    const proto = Object.getPrototypeOf(action).constructor as ActionType;
    const actionHandlers = handlerRegistry.get(proto.type);

    // Skip async overhead, if no handlers exist
    if (!actionHandlers || actionHandlers.length === 0) return next(state, action);

    let abortOnError = false;
    const proms = actionHandlers.map(async (handler) => {
      if (!abortOnError) abortOnError = handler[1]?.abortOnError ?? false;
      const re = handler[0](state, action);
      return isObservable(re) ? re.toPromise() : re;
    });

    let error: unknown;
    return from(
      Promise.all(proms)
        .catch((err) => {
          error = abortOnError === true ? err : null;
          if (!error) console.warn(err);
        })
        .then(() => {
          if (!error) return next(state, action);
          else console.error(error);
        })
    );
  }
}
