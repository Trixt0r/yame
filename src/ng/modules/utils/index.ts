import { InjectionToken, ValueProvider } from '@angular/core';

/**
 * Injection token for providing decorated classes.
 */
export const DECORATOR_TOKEN = new InjectionToken('DECORATOR_TOKEN');

/**
 * Creates a provider for the given arguments,
 * which are injected under the `DECORATOR_TOKEN`.
 *
 * Can be used, if classes are decorated, but are only used on demand.
 *
 * @param values The values to provide.
 */
export function provideAsDecorated(...values: unknown[]): ValueProvider {
  return {
    provide: DECORATOR_TOKEN,
    useValue: values,
    multi: true,
  };
}

export { ResizableComponent } from './component/resizable';
export { PointInputComponent } from './components/point-input/point-input.component';
export { ColorPipe } from './pipes/color.pipe';
export { UtilsModule } from './utils.module';
