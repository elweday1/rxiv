import { Subscription } from "rxjs";
import { RxNode, RxProp } from "./types";
import { BaseControl } from "./core/control";
import { createElement, fragmentComponent } from "./framework";

export type ElementProps<T> = {
    [K in keyof Omit<T, 'children' | 'style' | 'key'>]?: T[K] extends Function
    ? T[K]
    : RxProp<T[K]>;
} & {
    class?: RxProp<string>;
    children?: RxNode;
    control?: BaseControl;
    style?: RxProp<string>;
};



// This is where we define the global JSX namespace that TypeScript uses.
declare global {
    namespace JSX {
        type Element = RxNode;

        interface ElementChildrenAttribute {
            children: {};
        }
        type IntrinsicElements = {
            [K in keyof HTMLElementTagNameMap]: ElementProps<HTMLElementTagNameMap[K]>;
        };
    }

    interface Node {
        _subscriptions?: Subscription[];
    }
}

// The build tool looks for `jsx` and `jsxs` exports.
function jsx(tag: any, props: { [key: string]: any }): any {
    // The new runtime passes children inside the props object.
    const { children, ...restProps } = props;
    
    // We adapt this signature to our core rxCreateElement function.
    const childrenArray = children === undefined ? [] : Array.isArray(children) ? children : [children];
    
    return createElement(tag, restProps, ...childrenArray);
  }
  
export { jsx, jsx as jsxs, fragmentComponent as Fragment };
