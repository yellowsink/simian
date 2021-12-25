// singly linked list storing patches to make it easy to un/apply them
// a nuance to this class: prev is:
//  - a `function` if the last node in the chain
//  - a `PatchChain` otherwise

export default class PatchChain {
    constructor(id, prev, func) {
        this.data = {
            id,
            func: (...args) =>
                func(
                    typeof this.prev === "function"
                        ? this.prev
                        : this.prev.data.func,
                    args
                ),
        };
        this.prev = prev;
    }

    data;
    prev;
}
