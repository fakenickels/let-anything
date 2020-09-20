<p align="center">
  <br />
  <img src="./assets/banner.png" width="700" />
</p>

It allows you to create monadic syntax for all sorts of monad-y values, heavily inspired by [OCaml's shiny new syntax](https://jobjo.github.io/2019/04/24/ocaml-has-some-new-shiny-syntax.html) and the name is inspired by [Jared's let-anything](https://github.com/jaredly/let-anything)


# Installation
```
yarn add @fakenickels/let-anything
```

# Quick usage

<details>
  <summary>Show async/await demo</summary>

[Run in CodeSandbox](https://codesandbox.io/s/wizardly-hopper-n1n1f?file=/src/index.ts)

```js
import {letAnything} from '@fakenickels/let-anything';

// define a context, in this case we are creating our own async-await!
const letPromise = letAnything({
  let_: (value, continuation) => value.then(continuation),
});

async function main() {
  const userName = yield Promise.resolve("Subaru-kun")
  const deathCount = yield Promise.resolve(12909238409382)

  return Promise.resolve(`User ${userName} has a death count of ${deathCount}`)
}

letPromise(main).then(console.log).catch(console.log)
// User Subaru-kun has a death count of 12909238409382
```

</details>

<details>
  <summary>Show `fp-ts/either` demo</summary>

[Run in CodeSandbox](https://codesandbox.io/s/wizardly-hopper-n1n1f?file=/src/index.ts)

```js
import {either} from 'fp-ts'
import {letAnything} from '@fakenickels/let-anything'

// You could say I'm not a very good with TS types
const letEither = letAnything<either.Either<any, any>>({
  let_: (value, continuation) => either.chain(continuation)(value)
});

function* stuff() {
  const value = yield either.right("d");
  const anotherValue = yield either.right("e");
  const anotherAnother = yield either.right("bug");

  return either.right(value + anotherValue + anotherAnother);
}


console.log(
  either.getOrElse(error => `Something went wrong: ${error}`)(letEither(stuff))
)
// debug
```

</details>

<details>
  <summary>Railway programming with `fp-ts` and promises</summary>

[Run in CodeSandbox](https://codesandbox.io/s/exciting-cloud-d4141?file=/src/index.ts)

```js
import {either} from 'fp-ts'
import {letAnything} from '@fakenickels/let-anything'

// You could say I'm not a very good with TS types, I'm more of a ReasonML guy so help would be appreciated!

// Here we'll provide the context to combine both Either and Promises together
const letEither = letAnything<either.Either<any, any>>({
  let_: (value, continuation) => {
    return value.then(eitherValue => {
      return either.fold(
        error => Promise.resolve(either.left(error)),
        continuation,
      (eitherValue)
    })
  }
});

function* stuff() {
  const value = yield Promise.resolve(either.right("d"));
  const anotherValue = yield Promise.resolve(either.right("e"));
  const anotherAnother = yield Promise.resolve(either.right("bug"));

  return Promise.resolve(either.right(value + anotherValue + anotherAnother));
}

letEither(stuff)
  .then(either.getOrElse(error => `Something went wrong: ${error}`))
  .then(finalValue => {
    document.getElementById("app").innerHTML = finalValue
  })
```

</details>

# Why?

If you ever had to deal with error handling in JS with async/await you know how painful it can get.

You can do it with try-catch

```js
async function checkoutPurchase({productId, userId}) {
  try {
    const product = await Product.findOne(productId);
    const user = await User.findOne(userId)
    const card = await CreditCards.findOneByUserId(userId)

    await Charge.create({
      customerId: user.customerId,
      source: card.source,
      price: product.price,
    });

    return {success: true}
  } catch(e) {
    console.log(e.message) // not very helpul
    return {error: "Oopsie! Something went wrong and we have no clue about it!"}
  }
}
```

A lot of things can go wrong there and try catch will just make it very hard to determine what.

Some attempts to make that process better to handle have been offered by the community, like [eres](http://npmjs.com/eres) inspired by Go's way of handling with errors.

```js
async function checkoutPurchase({productId, userId}) {
  const [productErr, product] = await eres(Product.findOne(productId));

  if(productErr) {
    return {error: "Coulnd't find that product"}
  }

  const [userErr, user] = await eres(User.findOne(userId));

  if(userErr) {
    return {error: "User not found"}
  }

  const [cardErr, card] = await eres(CreditCards.findOneByUserId(userId));

  if(cardErr) {
    return {error: "User not found"}
  }

  const [chargeErr,] = await eres(Charge.create({
    customerId: user.customerId,
    source: card.source,
    price: product.price,
  }));

  if(chargeErr) {
    return {error: "Failed to charge user"}
  }

  return {success: true}
}
```

Well even though now we have a much more fine grained and correct error handling that's very awful and boilerplate-y and now our main logic is mixed with error handling making the code much harder to read.
Looks like there is no way around that if we want to be good coders and handle our damn exceptions, or is it? *plays VSauce soung*
Actually there is a much better way. And those FP smartass jerks (_just kidding peeps_) have been hiding it for themselves all along.

## A better way
In the FP world there is a being called `result` and with it you can box values with two branches: the sucess branch and the error branch.

```js
import {either} from 'fp-ts'

// now this will have the type Promise<Either<any, any>> and we are not bound by the weird laws of Promise's .catch!
async function findOne(id) {
  try {
    const value = await originalFindOne(id)

    return either.right(value)
  } catch(e) {
    return either.left({type: 'product/findOneErr', error: e.message})
  }
}
// ... Charge.create will be changed to the same thing and for all the other repos ...
```

Now we can create a monadic context with `let-anything` and behold the power of FP with async/await easy to understand syntax!

```js
import {either} from 'fp-ts'
import {letAnything} from '@fakenickels/let-anything'

// You could say I'm not a very good with TS types, I'm more of a ReasonML guy so help would be appreciated!

// Here we'll provide the context to combine both Either and Promises together
const letAsyncEither = letAnything<Promise<either.Either<any, any>>>({
  let_: (value, continuation) => {
    return value.then(eitherValue => {
      return either.fold(
        error => Promise.resolve(either.left(error)),
        continuation,
      )(eitherValue)
    })
  }
});

function* checkoutPurchase({productId, userId}) {
  const product = yield Product.findOne(productId);
  const user = yield User.findOne(userId)
  const card = yield CreditCards.findOneByUserId(userId)

  yield Charge.create({
    customerId: user.customerId,
    source: card.source,
    price: product.price,
  });

  return Promise.resolve(either.right({success: true}))
}

letAsyncEither(either)
  // we just got the error handling out of the way!
  .then(either.getOrElse(error => {
    switch(error.type) {
     // Just an idea, create your own abstraction for it. In ReasonML I do it with polymorphic variants.
     case 'user/findOneErr': return {error: 'Invalid user'}
     case 'product/findOneErr': return {error: 'Invalid product'}
     case 'card/findOneErr': return {error: 'Invalid card'}
     case 'charge/createErr': return {error: 'Failed to charge'}
     default: return {error: 'Something went terribly wrong'}
    }
  }))
```

Basically if you build your code around those following some juice mathmagical laws you get better error handling for free.
You could even create an async/await now for something like [Fluture](https://github.com/fluture-js/Fluture) which are much better than JS promises.
