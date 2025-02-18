import { ScrcpyOptions2_3 } from "./2_3/index.js";

export class ScrcpyOptions2_3_1<
    TVideo extends boolean,
> extends ScrcpyOptions2_3<TVideo> {
    constructor(init: ScrcpyOptions2_3.Init<TVideo>, version = "2.3.1") {
        super(init, version);
    }
}

export namespace ScrcpyOptions2_3_1 {
    export type Init<TVideo extends boolean = boolean> =
        ScrcpyOptions2_3.Init<TVideo>;
}
