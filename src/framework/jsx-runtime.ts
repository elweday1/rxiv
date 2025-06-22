import { Subscription } from "rxjs";
import { RxNode, RxProp } from "./types";
import { BaseControl } from "./core/control";

export type ElementProps<T> = {
    [K in keyof Omit<T, 'children' | 'style'>]?: T[K] extends Function
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

export {
    createElement as jsx,
    createElement as jsxs,
    fragmentComponent as Fragment
} from "./framework"