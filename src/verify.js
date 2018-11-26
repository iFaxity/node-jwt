// Module for signing and verifying JWT tokens
const jws = require('jws');
const decode = require('./decode');
const createModel = require('./lib/model');

const { TokenError, TokenExpiredError, TokenNotBeforeError } = require('./lib/error');
const { ALGORITHMS } = jws;

// Factory function to model the options
const optionsModel = createModel({
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
    type: Number,
    default: 0,
  },

  clockTimestamp: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
  clockTolerance: {
    type: Number,
    default: 0,
  },
  ignoreExpire: {
    type: Boolean,
    default: false,
  },
});

// Validates the optional claims
function validateClaims(payload, opts) {
  const timestamp = opts.clockTimestamp;

  // Audience claim
  if (opts.audience) {
    const audience = Array.isArray(opts.audience) ? opts.audience : [opts.audience];
    const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
    const strMatch = (reg, str) => reg instanceof RegExp ? reg.test(str) : reg === str;

    if (!aud.some(b => audience.some(a => strMatch(a, b)))) {
      throw new TokenError('Audience(s) invalid');
    }
  }

  // Issuer claim
  if (opts.issuer) {
    const issuers = Array.isArray(opts.issuer) ? opts.issuer : [opts.issuer];

    if (!issuers.includes(payload.iss)) {
      throw new TokenError('Issuer(s) invalid');
    }
  }

  // Subject claim
  if (opts.subject && opts.subject != payload.sub) {
    throw new TokenError('Subject invalid');
  }
  // JWT ID claim
  if (opts.jwtId && opts.jwtId != payload.jti) {
    throw new TokenError('JWT Id invalid');
  }
  // Nonce claim
  if (opts.nonce && opts.nonce != payload.nonce) {
    throw new TokenError('Nonce invalid');
  }

  // Check expiration last. Makes it easier to catch expiration errors for token renewing.

  // Not before claim
  if (payload.nbf && !opts.ignoreNotBefore) {
    if (typeof payload.nbf != 'number') {
      throw new TokenError('Invalid not before value');
    } else if(payload.nbf > timestamp + opts.clockTolerance) {
      throw new TokenNotBeforeError('Token not active', new Date(payload.nbf * 1000));
    }
  }

  // Expiry claim
  if (payload.exp && !opts.ignoreExpire) {
    if (typeof payload.exp != 'number') {
      throw new TokenError('Invalid expire value');
    } else if(timestamp >= payload.exp + opts.clockTolerance) {
      throw new TokenExpiredError('Token expired', new Date(payload.exp * 1000));
    }
  }

  // Check if claim is within the specified max age
  if(opts.maxAge) {
    if (typeof payload.iat != 'number') {
      throw new TokenError('Payload iat required when maxAge is set');
    }

    const maxAge = opts.maxAge + payload.iat + opts.clockTolerance;
    if (timestamp >= maxAge) {
      throw new TokenExpiredError('Token maxAge exceeded', new Date(maxAgeTimestamp * 1000));
    }
  }
}


/**
* Verifies the token's validity
* @param {String} token - JWT token to validate
* @param {String} secret - The crypto secret
* @param {Object} [opts] - Options to pass to the function
* @returns {Promise} - If resolved the result is the payload.
*/
module.exports = function(token, secret, opts = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Type check the options & set defaults
      opts = optionsModel(opts);

      // Validate the token
      if(!token) {
        throw new TokenError('No token provided');
      } else if(typeof token != 'string') {
        throw new TokenError('Token needs to be a string');
      }

      // Verify token format
      const parts = token.split('.');
      if (parts.length != 3) {
        throw new TokenError('Token format not valid');
      }

      // Decode the token
      const decodedToken = decode(token, true);
      if (!decodedToken) {
        throw new TokenError('Token is not valid');
      }


      // Validate signature & secret
      const hasSign = parts[2].trim() !== '';
      if (!hasSign && secret) {
        throw new TokenError('JWT signature is required');
      } else if (hasSign && !secret) {
        throw new TokenError('Secret is required');
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
      if (!jws.verify(token, header.alg, secret)) {
        throw new TokenError('Invalid signature');
      }

      // Validate payload claims against options
      validateClaims(payload, opts);
      resolve(payload);
    } catch (ex) {
      reject(ex);
    }
  });
};
