const jws = require('jws');

/**
* Gets the payload from a JWT token
* @param {String} token - JWT token to decode
* @param {Boolean} [complete] - Also returns header and signature
*/
module.exports = function decode(token, complete = false) {
  // Force json parsing (so we dont need to do one later)
  const decoded = jws.decode(token, { json: true });
  return decoded && !complete ? decoded.payload : decoded;
};
