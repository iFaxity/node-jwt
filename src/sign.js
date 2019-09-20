// Module for signing and verifying JWT tokens
const jws = require('jws');
const { parseTime } = require('./lib/util');
const createModel = require('./lib/model');
const { TokenError } = require('./lib/errors');

const { ALGORITHMS } = jws;
const PAYLOAD_CLAIMS = {
  aud: 'audience',
  iss: 'issuer',
  sub: 'subject',
  jti: 'jwtId',
};

// Factory function to model options
const parseModel = createModel({
  algo: {
    type: String,
    validator: value => ALGORITHMS.includes(value),
    default: 'HS256'
  },
  audience: [String, Array],
  issuer: String,
  subject: String,
  keyId: String,
  expiresIn: [Number, String],
  notBefore: [Number, String],
  issuedAt: [Number, String],
  encoding: {
    type: String,
    default: 'utf8'
  },
  timestamp: {
    type: Boolean,
    default: true,
  },
});

/**
* Creates a JWT token
* @param {object} payload - The payload to send
* @param {string} secret - The crypto secret
* @param {object} [opts] - Options to pass to the function
* @param {string} [opts.algo=HS256] - Algorithm to sign the token with.
* @param {string|Array} [opts.audience] - Which audience the token is intended for.
* @param {string} [opts.issuer] - The name of the issuer of the token.
* @param {subject} [opts.subject] - The token's subject i.e. it's use case.
* @param {string} [opts.keyId] - Useful for when you have multiple keys to sign the tokens with.
* @param {number|string} [opts.expiresIn] - The duration for which the token is valid (in seconds).
* @param {number|string} [opts.notBefore] - Time before the token is valid (in seconds).
* @param {number|string} [opts.issuedAt] - Time which the token was issued (in seconds). Will be automatically set if not assigned a value and if timestamp is not false.
* @param {string} [opts.encoding=utf8] - Encoding of the full signed JWT. Default value is utf8. Available encodings are defined in the Nodejs documentation
* @param {boolean} [opts.timestamp=true] - If false then the issued claim wont be set. Default value is true.
* @returns {Promise} - If resolved the result is a generated JWT token.
*/
module.exports = function (payload, secret, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Set & validate the options
      opts = parseModel(opts);
      // Copy the payload
      payload = Object.assign({}, payload);

      if (!secret && opts.algo != 'none') {
        throw new TokenError(`Secret undefined`);
      } else if (typeof payload != 'object') {
        throw new TokenError('Payload is not an object');
      }
    } catch (ex) {
      return reject(ex);
    }

    // Set payload claims
    const now = Math.floor(Date.now() / 1000);
    if (opts.timestamp) {
      payload.iat = opts.issuedAt ? parseTime(opts.issuedAt, 'issuedAt') : now;
    }
    if (opts.expiresIn) {
      payload.exp = now + parseTime(opts.expiresIn, 'expiresIn');
    }
    if (opts.notBefore) {
      payload.nbf = parseTime(opts.notBefore, 'notBefore');
    }

    // Set shorthanded props
    for (const [ claim, key ] of Object.entries(PAYLOAD_CLAIMS)) {
      if (opts.hasOwnProperty(key)) {
        payload[claim] = opts[key];
      }
    }

    // Sign the token
    jws.createSign({
      payload, secret,
      encoding: opts.encoding,
      header: {
        typ: 'JWT',
        alg: opts.algo,
        kid: opts.keyId,
      },
    }).once('error', reject).once('done', resolve);
  });
};
