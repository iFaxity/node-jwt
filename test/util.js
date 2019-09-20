describe('util', () => {
  const assert = require('assert').strict;
  const { TokenError } = require('../src/lib/errors');
  const { parseTime } = require('../src/lib/util');

  it('parseTime with string', () => {
    // Test different values
    assert.equal(parseTime('30m'), 60 * 30);
    assert.equal(parseTime('1h'), 60 * 60);
    assert.equal(parseTime('15d'), 60 * 60 * 24 * 15);
  });

  it('parseTime with number', () => {
    // Should return the input
    assert.equal(parseTime(100), 100);
  });

  it('parseTime with negative string', () => {
    assert.throws(() => parseTime('-1h'), TokenError);
  });

  it('parseTime with negative number', () => {
    assert.throws(() => parseTime(-100), TokenError);
  });
});
