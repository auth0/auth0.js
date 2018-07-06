function buildResponse(error, description) {
  return {
    error: error,
    errorDescription: description
  };
}

function invalidToken(description) {
  return buildResponse('invalid_token', description);
}

export default {
  buildResponse: buildResponse,
  invalidToken: invalidToken
};
