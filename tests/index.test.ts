import {letAnything} from '../src/index'

class Result<T> {
  value: T
  constructor(value: T) {
    this.value = value;
  }

  flatMap<B>(fn: (value: T) => Result<B>) {
    return fn(this.value);
  }

  flatMapOk<B>(fn: (value: T) => Result<B>): Ok<B> | Err<T> {
    if (this instanceof (Ok as any)) {
      const newValue = fn(this.value);

      if (newValue instanceof Result) return newValue;
      else {
        throw new TypeError(
          "You should return a new Result from flatMap received instead the value above"
        );
      }
    } else {
      return this;
    }
  }

  mapOkWithDefault<B>(defaultValue: T, fn: ((value: T) => B )) {
    if (this instanceof (Ok as any)) {
      return fn(this.value);
    } else {
      return defaultValue;
    }
  }

  tap(fn: ((value: T) => void)) {
    fn(this.value);
    return this;
  }
}

class Ok<T> extends Result<T> {}
class Err<T> extends Result<T> {}

const ok = <T>(value: T) => new Ok(value);
const err = <T>(value: T) => new Err(value);

const letResultAsync = letAnything<Result<any>>({
 let_: (value, continuation) => { return value.flatMapOk(continuation) }
});

function* stuff() {
  const value = yield ok("d");
  const anotherValue = yield ok("e");
  const anotherAnother = yield err("bug");

  return Promise.resolve(new Ok(value + anotherValue + anotherAnother));
}

letResultAsync(stuff)
