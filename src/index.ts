type Config<T> = {
  let_: (value: T, continuation: ((value: T) => T)) => T,
}

export function letAnything<T>(config: Config<T>) {
  return (gen: () => Generator<T>) => {
    const context = gen()

    const compose: (step: IteratorResult<T>) => T = (step) => step.done
      ? step.value
      : config.let_(step.value, value => compose(context.next(value)))

    return compose(context.next())
  }
}
