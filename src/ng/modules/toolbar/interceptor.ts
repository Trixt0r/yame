import { InjectionToken, Provider, Type } from '@angular/core';
import { from, Observable } from 'rxjs';
import { Tool } from './tool';

export interface ToolEvent<E, T extends Tool = Tool> extends Record<string | symbol | number, any> {
  origin: E;
  tool: T;
}

export type ToolResult<T> = void | Promise<T> | Observable<T>;

export type ToolHandler<E, T extends Tool = Tool> = (toolEvent: ToolEvent<E, T>) => ToolResult<any>;

// export const TOOL_INTERCEPTORS = new InjectionToken<ToolInterceptor[]>('YAME_TOOL_INTERCEPTORS')>

export abstract class ToolInterceptor<E, T extends Tool> {
  private static readonly tokens: Map<Type<Tool>, InjectionToken<ToolInterceptor<unknown, Tool>>> = new Map();

  static tokenFor<T extends Tool>(toolType: Type<T>): InjectionToken<ToolInterceptor<unknown, T>> | undefined {
    return this.tokens.get(toolType);
  }

  static forTool<T extends Tool>(toolType: Type<T>, interceptor: Type<ToolInterceptor<unknown, T>>): Provider {
    let token = ToolInterceptor.tokenFor(toolType);
    if (!token) this.tokens.set(toolType, (token = new InjectionToken(`YAME_TOOL_INTERCEPTORS_${toolType.name}`)));

    return {
      provide: token,
      useClass: interceptor,
      multi: true,
    };
  }

  abstract intercept<R>(event: ToolEvent<E, T>, next: ToolHandler<E, T>): ToolResult<R>;
}

type OriginType<T> = T extends (event: ToolEvent<infer E>) => void ? E : unknown;

declare global {
  interface Function {
    /**
     * Binds the function to the given `this` scope and injects the given interceptors into the execution path of the original function.
     *
     * @param this The type of the function.
     * @param thisArg The scope to bind the function to.
     * @param interceptors The interceptors to inject.
     */
    withToolInterceptors<T>(
      this: T,
      thisArg: Tool,
      interceptors?: ToolInterceptor<unknown, Tool>[]
    ): (event: OriginType<T>) => void;
  }
}

(Function.prototype as any).withToolInterceptors = function <T extends Function>(
  this: T,
  thisArg: Tool,
  interceptors?: ToolInterceptor<unknown, Tool>[]
): (event: OriginType<T>) => void {
  // Bind this function to the correct scope
  const fn = this.bind(thisArg);

  // Create a new wrapper function
  return function (...args: unknown[]) {
    const toolEvent: ToolEvent<unknown> = { origin: args[0], tool: thisArg };

    // Execute each interceptor as they are registered and pass the next handler to the current interceptor.
    // The last handler will always be the original tool handler.
    const re = (interceptors?.slice().reverse() ?? []).reduce(
      (next: ToolHandler<unknown>, interceptor: ToolInterceptor<unknown, Tool>) => {
        return (ev: ToolEvent<unknown>) => {
          const re = interceptor.intercept(ev, next);
          if (re instanceof Promise) return from(re);
          else if (re instanceof Observable) return re;
          else return re;
        };
      },
      fn
    )(toolEvent);

    let obs: Observable<unknown> | undefined;

    if (re instanceof Promise) obs = from(re);
    else if (re instanceof Observable) obs = re;

    obs?.subscribe();
  };
};
