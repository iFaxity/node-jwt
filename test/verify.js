describe('verify', () => {
  const assert = require('assert').strict;
  const sign = require('../src/sign');
  const verify = require('../src/verify');
  const secret = 'asecretiguess';

  it('verify, no options', async () => {
    const token = await sign({}, secret);
    const res = await verify(token, secret);

    assert(res);
  });

  it('verify, few options', async () => {
    const token = await sign({}, secret);
    const res = await verify(token, secret);

    assert(res);
  });

  it('verify, extensive options', async () => {
    const token = await sign({}, secret);
    const res = await verify(token, secret);

    assert(res);
  });
});
