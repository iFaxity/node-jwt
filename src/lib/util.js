const ms = require('ms');
const { TokenError } = require('./errors');

exports.parseTime = function parseTime(time, claim) {
  let seconds = time;

  if (typeof time == 'string') {
    seconds = Math.floor(ms(time) / 1000);
  } else if (typeof time != 'number') {
    throw new TokenError(`Invalid ${claim} value`);
  }

  if (seconds < 0) {
    throw new TokenError(`Invalid ${claim} value, negative numbers are invalid`);
  }

  return seconds;
}
