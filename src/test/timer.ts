// RxJS v6+
import { timer } from 'rxjs';

//emit 0 after 1 second then complete, since no second argument is supplied
const source = timer(5000);
//output: 0
const subscribe = source.subscribe(val => console.log(val));