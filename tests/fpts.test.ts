import {either} from 'fp-ts'
import {letAnything} from '../src/index'

const letEither = letAnything<either.Either<any, any>>({
  let_: (value, continuation) => either.chain(continuation)(value)
});

const stuff = letEither<string>(function*() {
  const value = yield either.right("d");
  const anotherValue = yield either.right("e");
  const anotherAnother = yield either.right("bug");

  return either.right(value + anotherValue + anotherAnother);
})


console.log(
  either.getOrElse(error => `Something went wrong: ${error}`)(stuff)
)
