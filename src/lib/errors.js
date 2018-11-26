exports.TokenError = class TokenError extends Error {
  constructor(message) {
    super(message);

    if(Error.captureStackTrace) {
      Error.captureStackTrace(this, TokenError);
    }
  }
}

exports.TokenExpiredError = class TokenExpiredError extends TokenError {
  constructor(message, expiredAt) {
    super(message);
    this.expiredAt = expiredAt;
  }
}

exports.TokenNotBeforeError = class TokenNotBeforeError extends TokenError {
  constructor(message, date) {
    super(message);
    this.date = date;
  }
}
