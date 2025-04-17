# Fuzzing Tests for auth0.js

This directory contains fuzzing tests for auth0.js using fast-check, a property-based testing library.

## What is Fuzzing?

Fuzzing (or fuzz testing) is an automated software testing technique that involves providing invalid, unexpected, or random data as inputs to a program. The program is then monitored for exceptions such as crashes, failing built-in code assertions, or potential memory leaks.

## Test Organization

Our fuzzing tests are organized systematically:

1. **Auth Configuration Tests** (`01-auth-configuration-fuzz.js`): Tests for configuration parameters, connection handling, and initialization.

2. **Token Validation Tests** (`02-token-validation-fuzz.js`): Tests for token parsing, validation, and error handling.

3. **Cryptography Tests** (`03-cryptography-fuzz.js`): Tests for cryptographic operations including:

   - JWT token validation
   - Signature verification
   - Token algorithm handling
   - Nonce validation
   - JWK key rotation handling

4. **Security Flow Tests** (`04-security-flows-fuzz.js`): Tests for security vulnerabilities in authentication flows including:

   - Cross-origin authentication
   - Redirect handling
   - CSRF protection
   - MFA (Multi-factor Authentication) security

5. **Enterprise Integration Tests** (`05-enterprise-integration-fuzz.js`): Tests for enterprise-specific features:
   - Enterprise SSO and session management
   - SAML and identity provider integration
   - Organization ID validation for multi-tenant applications
   - Audience validation for enterprise APIs
   - Delegation token exchange

## Running Fuzzing Tests

```bash
npm run fuzz
```

To run in watch mode:

```bash
npm run fuzz:watch
```
