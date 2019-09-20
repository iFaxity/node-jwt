describe('sign', () => {
  const assert = require('assert').strict;
  const sign = require('../src/sign');
  const decode = require('../src/sign');
  const secret = 'notsosecret';

  // Favoring string values because parseTime function
  // gets checked in another test

  it('sign, no options', async () => {
    const token = await sign({}, secret);
    assert(typeof token == 'string');
  });

  it('sign, few options', async () => {
    const token = await sign({}, secret, {
      expiresIn: '1h',
      notBefore: '1m',
    });

    assert(typeof token == 'string');
  });

  it('sign, extensive options', async () => {
    const token = await sign({}, secret, {
      algo: 'HS512',
      audience: ['hello', 'world'],
      issuer: 'me, duh',
      keyId: 'thisisjustadummyid',
      expiresIn: '1h',
      notBefore: '1m',
      issuedAt: 1000,
      encoding: 'base64',
      timestamp: false,
    });

    assert(typeof token == 'string');
  });
});
