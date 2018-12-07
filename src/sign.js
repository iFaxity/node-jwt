// Module for signing and verifying JWT tokens
const jws = require('jws');
const createModel = require('./lib/model');
const { TokenError } = require('./lib/error');

const { ALGORITHMS } = jws;
const PAYLOAD_CLAIMS = {
  nbf: 'notBefore',
  aud: 'audience',
  iss: 'issuer',
  sub: 'subject',
  jti: 'jwtId',
};

// Factory function to model options
const optionsModel = createModel({
  algo: {
    type: String,
    validator: value => ALGORITHMS.includes(value),
    default: 'HS256'
  },

  // Payload claims
  audience: [String, Array],
  issuer: String,
  subject: String,
  keyId: String,
  expiresIn: Number,
  notBefore: Number,
  issuedAt: Number,

  encoding: {
    type: String,
    default: 'utf8'
  },
  timestamp: {
    type: Boolean,
    default: true,
  }
});

function setClaims(payload, opts) {
  for (const [ claim, prop ] of Object.entries(PAYLOAD_CLAIMS)) {
    if (prop in opts) {
      payload[claim] = opts[prop];
    }
  }
}
/**
* Creates a JWT token
* @param {Object} payload - The payload to send
* @param {String} secret - The crypto secret
* @param {Object} [opts] - Options to pass to the function
* @returns {Promise} - If resolved the result is a generated JWT token.
*/
module.exports = function (payload, secret, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Set & validate the options
      opts = optionsModel(opts);
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
    const timestamp = Math.floor(Date.now() / 1000);
    if (opts.timestamp) {
      payload.iat = opts.issuedAt || timestamp;
    }
    if (opts.expiresIn) {
      payload.exp = opts.expiresIn + timestamp;
    }
    setClaims(payload, opts);

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
