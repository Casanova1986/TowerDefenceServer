"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// RxJS v6+
const rxjs_1 = require("rxjs");
//emit 0 after 1 second then complete, since no second argument is supplied
const source = rxjs_1.timer(5000);
//output: 0
const subscribe = source.subscribe(val => console.log(val));
//# sourceMappingURL=timer.js.map