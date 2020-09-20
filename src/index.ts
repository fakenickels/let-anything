type Config<T> = {
  let_: (value: T, continuation: ((value: T) => T)) => T,
}

export function letAnything<T>(config: Config<T>) {
  interface LetAnything {
    (gen: () => Generator<T, any, any>): T;
    <TNext>(gen: () => Generator<T, any, TNext>): T;
  }

  const lettified: LetAnything = (gen: () => Generator<T, any, any>) => {
    const context = gen()

    const compose: (step: IteratorResult<T>) => T = (step) => step.done
      ? step.value
      : config.let_(step.value, value => compose(context.next(value as any))) // TODO: remove any

    return compose(context.next())
  }

  return lettified
}
