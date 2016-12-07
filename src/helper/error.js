function buildResponse(error, description) {
  return {
    error: error,
    errorDescription: description
  };
}

function invalidJwt(description) {
  return buildResponse('invalid_token', description);
}

module.exports = {
  buildResponse: buildResponse,
  invalidJwt: invalidJwt
};
