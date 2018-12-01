
/*
 * Code heavily based on jsonwebtoken package on npm
 * https://github.com/auth0/node-jsonwebtoken
*/
const { TokenError, TokenExpiredError, TokenNotBeforeError } = require('./src/lib/error');
const { ALGORITHMS } = require('jws');

module.exports = {
  sign: require('./src/sign'),
  verify: require('./src/verify'),
  decode: require('./src/decode'),
  TokenError,
  TokenExpiredError,
  TokenNotBeforeError,
  ALGORITHMS,
};
