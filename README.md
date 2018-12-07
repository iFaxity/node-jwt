@ifaxity/jwt
============

## The json web token package for modern Node.js environments.
Minimal dependencies & code is cut down to not take so much space.

Node 6 or above is required as ES6 is needed.
Using promises or async await syntax if you are in Node 7.6 or above

Code heavily based on Auth0's [jsonwebtoken package](https://github.com/auth0/node-jsonwebtoken)

---------------
## Installation

`npm install @ifaxity/jwt --save`

or if you use yarn

`yarn add @ifaxity/jwt`

--------
## Usage

To use the module just require it like this

`const jwt = require('@ifaxity/jwt');`

------
## API

### [jwt.sign(payload, secret [, opts])](#sign)
Signs a JWT token with a payload and a secret key.

Returns a string with the signed JWT Token.

#### Parameters
* `payload {Object}` - The jwt payload. If you have no additional payload information just leave it as an empty object.
* `secret {String}` - JWT Secret. Must be set if `algo` option is not 'none'.
* `opts {Object}` - Optional options. If any of the optional options is not of a valid type or if its value is not valid then a `TokenError` will be thrown.

  * `algo {String}` - Algorithm to sign the token with. Default value is `HS256`. Algorithms available are exported as `ALGORITHMS` in the module.

  * `audience {String|Array}` - Which audience the token is intended for.

  * `issuer {String}` - The name of the issuer of the token.

  * `subject {String}` - The token's subject i.e. it's use case.

  * `keyId {String}` - Useful for when you have multiple keys to sign the tokens with.

  * `expiresIn {Number}` - The duration for which the token is valid (in seconds).

  * `notBefore {Number}` - Time before the token is valid (in seconds).

  * `issuedAt {Number}` - Time which the token was issued (in seconds). Will be automatically set if not assigned a value and if 'timestamp' is not false.

  * `encoding {String}` - Encoding of the full signed JWT. Default value is `utf8`. Available encodings are defined in the [Nodejs documentation](https://nodejs.org/api/buffer.html#buffer_buffers_and_character_encodings)

  * `timestamp {Boolean}` - If false then the issued claim wont be set. Default value is true.

#### Basic Usage

```js
const jwt = require('@ifaxity/jwt');

// Empty payload with secret
jwt.sign({}, 'a secret key');

// User defined payload with secret key
jwt.sign({ name: 'Foo bar' }, 'a secret key');

// Sign with expiration date
jwt({ name: 'Foo bar' }, 'a secret key', {
  expiresIn: 60*60, // 1 hour
  issuer: '`mywebsite.com',
});
```



### [jwt.verify(token, secret [, opts])](#verify)

Verifies a JWT token's validity. Optional claims can be used to make the verification stricter. Making the verification more secure in a sense.

Returns the jwt payload if it was ok. If it was not ok then a `TokenError` will be thrown.

#### Parameters
* `payload {Object}` - The jwt payload. If you have no additional payload information just leave it as an empty object.
* `secret {String}` - JWT Secret. Must be set if `algo` option is not 'none'.
* `opts {Object}` - Optional options. If any of the optional options is not of a valid type or if its value is not valid then a `TokenError` will be thrown.

  * `algos {Array}` - Algorithms to accept. By default it accepts all available algorithms.

  * `audience {String|RegExp|Array}` - Audiences to accept. The array can be an array of strings and/or an array of regular expressions.

  * `issuer {String|Array}` - Issuer(s) to accept.

  * `subject {String}` - The subject to accept.

  * `nonce {String}` - Nonce to check against. Nonce is used in the OpenID tokens. Is really just optional to add.

  * `maxAge {Number}` - The maxAge of the token to accept. To increase security (in seconds). Default value is 0.

  * `clockTimestamp {Number}` - The time in which to compare to the timer claims such as `maxAge` and `issued at`. Default value is the current time in seconds.

  * `clockTolerence {Number}` - The amount of deadtime where its ok for the `clockTimestamp` to be overdue. Default value is 0.

  * `ignoreExpire {Boolean}` - if `true` then expiration checking will be disabled and will accept tokens that are overdue. Not very secure to ignore so use carefully. Default value is `false`.

  * `ignoreNotBefore {Boolean}` - if `true` then `not before` checking if the token is activated will be disabled. Not recommended to ignore so use carefully. Default value is `false`.

#### Basic Usage

```js
const jwt = require('@ifaxity/jwt');
const token = '<insert-token-here>';

// Checks signature and expiration if it exists.
jwt.verify(token, 'a secret key');

// Also define some other claims
jwt.verify(token, 'a secret key', {
  issuer: 'example.com',
  audience: ,
  maxAge: 60*60, // 1 hour
});
```


### [jwt.decode(token [, complete])](#decode)

Decodes a token and return its parts.
This function is not recommended and is insecure to use.
Use the `verify` function as it checks all claims and checks the signature for validity.

However you can use this function when you dont want to verify the validity of the token for example when you are debugging.

Returns the tokens payload as an object or if 'complete' is true then it returns the headers & signature aswell.

#### Parameters

* `token {String}` - The jwt token to decode.
* `complete {Boolean}` - If true the function returns headers & signature aswell.

#### Basic Usage

```js
const jwt = require('@ifaxity/jwt');
const token = '<insert-token-here>';

const decodedPayload = jwt.decode(token);

// or

const decoded = jwt.decode(token, true);
/* Returns header & signature aswell
{
  header: Object,
  payload: Object,
  signature: String,
}
*/
```

--------------
## Error Types

### All errors are exported from the index module like so:

```js
const { TokenError, TokenExpiredError, TokenNotBeforeError } = require('@ifaxity/jwt');
```

And they can be used to capture specific errors thrown by the `jwt.sign` and `jwt.verify` function.


### `TokenError` inherits from `Error`

Just a general token error, used to seperate a normal error from a specific token error. Has a `message` property like a normal error object has.

### `TokenExpiredError` inherits from `TokenError`

An error for the the token has expired.
Has a property `expiredAt` which is a `Date` object for when the token did expire.


### `TokenNotBeforeError` inherits from `TokenError`

An error for when token is not yet active.
Has a property `date` which is a `Date` object for when the token is activated.
