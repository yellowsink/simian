import getOriginal from "./getOriginal";
import PatchChain from "./patchChain";
import removePatch from "./removePatch";

type PatchType = "AFTER" | "BEFORE" | "INSTEAD";

let patchIds = new Set<number>();
const generatePatchId = () => {
    let x: number;
    while (!x || patchIds.has(x)) {
        x = Math.floor(Math.random() * 1e10);
    }

    patchIds.add(x);
    return x;
};

export default class Patcher {
    // why not allow the patcher to be called something other than simian?
    #embeddedName;
    #id; // unique per name

    #patched; // to cleanup all patches with

    constructor(embeddedName: string, id: number) {
        this.#embeddedName = embeddedName;
        this.#id = id;
        this.#patched = new Set<any>();
    }

    get patcherId() {
        return this.#embeddedName.toUpperCase() + "_" + this.#id;
    }

    #patch(t: PatchType, funcName: string, obj: any, patch: Function) {
        const orig: Function = obj[funcName];
        if (orig === undefined || typeof orig !== "function")
            throw new Error(`${funcName} is not a function on ${obj}`);

        // prepare to patch
        const id = generatePatchId();

        if (obj[`_$$_${this.patcherId}`] === undefined)
            obj[`_$$_${this.patcherId}`] = {};

        // create patch func
        let patchFunction: (ctx: unknown, func: Function, args: any[]) => any;
        switch (t) {
            case "AFTER":
                patchFunction = (ctx, func, args) => {
                    let ret = func.apply(ctx, args);
                    const newRet = patch.apply(ctx, [args, ret]);
                    if (typeof newRet !== "undefined") ret = newRet
                    return ret;
                };

                break;

            case "BEFORE":
                patchFunction = (ctx, func, args) => {
                    let finalArgs = args;
                    const newArgs = patch.apply(ctx, [args]) ?? args;
                    if (Array.isArray(newArgs)) finalArgs = newArgs;
                    return func.apply(ctx, finalArgs);
                };
                break;

            case "INSTEAD":
                patchFunction = (ctx, func, args) =>
                    patch.apply(ctx, [args, func.bind(ctx)]);
                break;
            default:
                break;
        }

        // add to patch chain
        let patchChain: PatchChain = obj[`_$$_${this.patcherId}`][funcName];
        if (patchChain === undefined)
            patchChain = new PatchChain(id, orig, patchFunction);
        else patchChain = new PatchChain(id, patchChain, patchFunction);

        obj[`_$$_${this.patcherId}`][funcName] = patchChain;

        // inject patch!
        //obj[funcName] = patchChain.data.func;
        obj[funcName] = function () {
            return patchChain.data.func(this, ...arguments);
        };

        // i read thru Cumcord patcher src to find this one lol
        // attach original function props to patched function
        Object.assign(obj[funcName], orig);

        this.#patched.add(obj);

        return () => removePatch(obj, funcName, id, this.patcherId);
    }

    after(
        funcName: string,
        obj: unknown,
        patch: (args: any[], ret: any) => any
    ) {
        return this.#patch("AFTER", funcName, obj, patch);
    }

    before(funcName: string, obj: unknown, patch: (args: any[]) => any) {
        return this.#patch("BEFORE", funcName, obj, patch);
    }

    instead(
        funcName: string,
        obj: unknown,
        patch: (args: any[], func: Function) => any
    ) {
        return this.#patch("INSTEAD", funcName, obj, patch);
    }

    cleanupAll() {
        for (const obj of this.#patched) {
            for (const funcName in obj[`_$$_${this.patcherId}`]) {
                const orig = getOriginal(this.patcherId, obj, funcName);
                obj[funcName] = orig;
                obj[`_$$_${this.patcherId}`][funcName] = undefined;
            }

            obj[`_$$_${this.patcherId}`] = undefined;
            delete obj[`_$$_${this.patcherId}`];
        }
        this.#patched.clear();
    }
}
