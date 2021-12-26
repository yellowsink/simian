# Simian

Flexible JS monkey-patching simple enough for monkey brains!

---

## What does Simian do?

Monkey-patches JS functions on-the-fly.

So if you have a function that is being used, and you want to hijack it to run your code, Simian can do that.

You can apply multiple patches to any given function, and can undo the patches in any order.

## Why?

Originally cause I wanted to try make a patcher without looking at existing patchers for the challenge, but also now to be used in one of my friends' projects.

## How do I use it?

```ts
// 1: import it
import initPatcher from "simian";
// 2: create a patcher
const patcher = initPatcher();
// 3: some functions to patch!
function wintest(a) { return a * a }
const obj = { objtest: (a, b) => a / b };
wintest(5); // 25
obj.objtest(10, 3); // 3.3333333333333335
// 4: get patching
const unpatchWin = patcher.after("wintest", window, (args, returnVal) => args[0] + returnVal);
const unpatchObj = patcher.after("objtest", obj, ([a, b]), ret) => (ret + b) * a)
// 5: the functions are now patched
wintest(5); // 30
obj.objtest(10, 3); // 63.33333333333334
// 6: remove a patch
unpatchObj();
obj.objtest(10, 3); // 3.3333333333333335
// 7: clean up all patches
// also removes any data stores attached to objects not part of the patcher
patcher.cleanupAll();
wintest(5); // 25
```

### Types of patches: after

`after` patches attach on the end of functions, and allow you to modify the return value of the function (or not! - simply don't return anything!). The original function is first called as usual, then your code is passed the args as an array, and the return value, which you can modify.

```ts
patcher.after: (funcName: string, obj: unknown, patch: (args: any[], ret: any) => any) => () => void
```

### Types of patches: before

`before` patches attach on the front of functions, and allow you to modify the arguments of the function, before sending them on to the original function. Your code is first given the args as an array, and you simply return the args to pass to the original function, again as an array. Then the original function is called as usual with your new args.

```ts
patcher.before: (funcName: string, obj: unknown, patch: (args: any[]) => any[]) => () => void
```

### Types of patches: instead

`instead` patches replace the function entirely, taking control over the args, return value, and side effects. However, if you wish to use the original function for anything (including calling it!), you are also passed it, though of course you don't need to take it as an arg - `(args, orig) => {}`, `args => {}` are both valid.

```ts
patcher.instead: (funcName: string, obj: unknown, patch: (args: any[], func: Function) => any): () => void
```

### Note on `initPatcher`

You can also pass a string to `initPatcher` to modify the name of the patcher's data stores (some of them are attached to the parent of the function being patched!). This is **<u>NOT</u>** necessary for using multiple patchers at once, they all have unique IDs.

So for example with `initPatcher()`, the side effect stores may be `obj._$$_SIMIAN_123456`, but with `initPatcher("myCoolLib")`, the side effect stores may be `obj._$$_MYCOOLLIB_123456`.

## Type delcarations?

Simian is written in TS, so providing type decls is a no-brainer. Just import as usual and go, Typescript decls included.

No flow types unless I get bored at some point, but probably just use flowgen.

## What's up with the name?

Cause monkey patching, and monkeys are simians, and, uh, yeah I'm not good at names... 😅

And as for monkey patching itself, according to wikipedia, it comes from the earlier term *"guerrilla patch"*, as in stealth, and which sounds like *"gorilla"*.