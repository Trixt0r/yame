/**
 * @description
 *
 * Represents a type.
 *
 * An example of a `Type` is `MyCustomComponent` class, which in JavaScript is be represented by
 * the `MyCustomComponent` constructor function.
 */
export declare const Type: FunctionConstructor;

export declare interface Type<T> extends Function {
    new (...args: any[]): T;
}
