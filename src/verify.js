// Module for signing and verifying JWT tokens
const jws = require('jws');
const decode = require('./decode');
const { parseTime } = require('./lib/util');
const createModel = require('./lib/model');
const { TokenError, TokenExpiredError, TokenNotBeforeError } = require('./lib/errors');

const { ALGORITHMS } = jws;

// Factory function to model the options
const parseModel = createModel({
  algos: {
    type: Array,
    validator: value => value.every(n => ALGORITHMS.includes(n)),
  },
  audience: [String, RegExp, Array],
  issuer: [String, Array],
  subject: String,
  nonce: {
    type: String,
    validator: value => value.trim() !== '',
  },
  maxAge: {
    type: [Number, String],
    default: 0,
  },
  clockTimestamp: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
  clockTolerance: {
    type: [Number, String],
    default: 0,
  },
  ignoreExpire: {
    type: Boolean,
    default: false,
  },
  ignoreNotBefore: {
    type: Boolean,
    default: false,
  },
});

// Validates the optional claims
function validateClaims(payload, opts) {
  const timestamp = opts.clockTimestamp;
  const clockTolerance = parseTime(opts.clockTolerance, 'clockTolerance');

  // Audience claim
  if (opts.audience) {
    const audience = Array.isArray(opts.audience) ? opts.audience : [opts.audience];
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const strMatch = (reg, str) => reg instanceof RegExp ? reg.test(str) : reg === str;

    if (!aud.some(b => audience.some(a => strMatch(a, b)))) {
      throw new TokenError('Audience(s) not matched');
    }
  }

  // Issuer claim
  if (opts.issuer) {
    const issuers = Array.isArray(opts.issuer) ? opts.issuer : [opts.issuer];

    if (!issuers.includes(payload.iss)) {
      throw new TokenError('Issuer(s) not matched');
    }
  }

  // Subject claim
  if (opts.subject && opts.subject != payload.sub) {
    throw new TokenError('Subject not matched');
  }
  // JWT ID claim
  if (opts.jwtId && opts.jwtId != payload.jti) {
    throw new TokenError('JWT ID not matched');
  }
  // Nonce claim
  if (opts.nonce && opts.nonce != payload.nonce) {
    throw new TokenError('Nonce not matched');
  }

  // Check expiration last. Makes it easier to catch expiration errors for token renewing.

  // Not before claim
  if (payload.nbf && !opts.ignoreNotBefore) {
    if (typeof payload.nbf != 'number') {
      throw new TokenError('Invalid notBefore value');
    } else if (payload.nbf > timestamp + clockTolerance) {
      throw new TokenNotBeforeError('Token not active', new Date(payload.nbf * 1000));
    }
  }

  // Expiry claim
  if (payload.exp && !opts.ignoreExpire) {
    if (typeof payload.exp != 'number') {
      throw new TokenError('Invalid expire value');
    } else if(timestamp >= payload.exp + clockTolerance) {
      throw new TokenExpiredError('Token expired', new Date(payload.exp * 1000));
    }
  }

  // Check if claim is within the specified max age
  if(opts.maxAge) {
    if (typeof payload.iat != 'number') {
      throw new TokenError('Payload iat required when maxAge is set');
    }

    const maxAge = parseTime(opts.maxAge, 'maxAge');

    if (timestamp >= (payload.iat + maxAge + clockTolerance)) {
      throw new TokenExpiredError('MaxAge exceeded', new Date(maxAge * 1000));
    }
  }
}


/**
* Verifies the token's validity
* @param {string} token - JWT token to validate
* @param {string} secret - The crypto secret
* @param {object} [opts] - Options to pass to the function
* @returns {Promise} - If resolved the result is the payload.
*/
module.exports = function(token, secret, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Type check the options & set defaults
      opts = parseModel(opts);

      // Validate the token
      if(!token) {
        throw new TokenError('Token undefined');
      } else if(typeof token != 'string') {
        throw new TokenError('Token is not of correct typestring');
      }

      // Verify token format
      const parts = token.split('.');
      if (parts.length != 3) {
        throw new TokenError('Token format invalid');
      }

      // Decode the token
      const decodedToken = decode(token, true);
      if (!decodedToken) {
        throw new TokenError('Token invalid');
      }

      // Validate signature & secret
      const hasSign = parts[2].trim() !== '';
      if (!hasSign && secret) {
        throw new TokenError('Token no signature');
      } else if (hasSign && !secret) {
        throw new TokenError('Secret undefined');
      } else if (!hasSign && !secret) {
        opts.algos = ['none'];
      }

      // Limit algorithms
      if (!opts.algos) {
        const key = secret.toString();

        if (key.includes('BEGIN CERTIFICATE') || key.includes('BEGIN PUBLIC KEY')) {
          opts.algos = ['RS256', 'RS384', 'RS512', 'ES256', 'ES384', 'ES512'];
        } else if (key.includes('BEGIN RSA PUBLIC KEY')) {
          opts.algos = ['RS256', 'RS384', 'RS512'];
        } else {
          opts.algos = ['HS256', 'HS384', 'HS512'];
        }
      }

      // Check if we can validate the token
      const { header, payload } = decodedToken;
      if (!opts.algos.includes(header.alg)) {
        throw new TokenError('Invalid algorithm');
      }

      // Now verify the JWT token
      jws.createVerify({
        algorithm: header.alg,
        signature: token,
        secret,
      })
      .once('done', valid => {
        if (!valid) {
          return reject(new TokenError('Invalid signature'));
        }

        try {
          // Validate payload claims against options
          validateClaims(payload, opts);
          resolve(payload);
        } catch (ex) {
          reject(ex);
        }
      })
      .once('error', reject);
    } catch (ex) {
      reject(ex);
    }
  });
};
