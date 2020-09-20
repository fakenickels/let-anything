type Config<T> = {
  let_: (value: T, continuation: ((value: T) => T)) => T,
}

interface LetAnything<T> {
  (gen: () => Generator<T, any, any>): T;
  <TNext>(gen: () => Generator<T, any, TNext>): T;
}

export function letAnything<T>(config: Config<T>): LetAnything<T> {
  return (gen: () => Generator<T, any, any>) => {
    const context = gen()

    const compose: (step: IteratorResult<T>) => T = (step) => step.done
      ? step.value
      : config.let_(step.value, value => compose(context.next(value)))

    return compose(context.next())
  }
}
