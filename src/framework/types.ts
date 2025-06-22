import { Observable, Subscription } from "rxjs";
import { BaseControl } from "./core/control";


/**
 * The main recursive type. It transforms an object type `T` into the shape
 * created by our `deepUnwrap` function.
 */
export type DeepUnwrapped<T> =
  // It's an intersection of two things:
  // 1. The nested, unwrappable objects.
  {
    [K in keyof T as T[K] extends RxNode ? never : K]: T[K] extends Record<string, any> ? DeepUnwrapped<T[K]> : T[K];
  } &
  // 2. The `$` suffixed observables for every property.
  {
    [K in keyof T as `${string & K}$`]: Observable<T[K]>;
  };
// --- Type Definitions and Helpers ---
export interface ComponentThunk {
  _isComponentThunk: true;
  tag: (props: any) => any;
  props: { [key: string]: any };
}
export type DOMNode = Node;
export type RxNode = DOMNode | Observable<any> | string | number | boolean | null | undefined | RxNode[];

// A helper type to make props reactive.
export type RxProp<T> = T | Observable<T>;

