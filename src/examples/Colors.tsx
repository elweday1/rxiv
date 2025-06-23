import { of, scan } from "rxjs";
import { control, Each, multiControl } from "../framework";

const checkboxes = multiControl(() => control({
    value: {
        event: "change",
        prop: "checked",
        initialValue: false
    }
}));

checkboxes.values$.pipe(
    scan((acc, {key, value}) =>  ({...acc, [key]: value}),
     { red: false, green: false, blue: false}
    )
);


export const ColorDemo = () => (
    <Each keyFn={(color) => color} items$={["red", "green", "blue"]} >
        {(c)=><input type="checkbox"control={checkboxes.at(c)} />}
    </Each>
)
