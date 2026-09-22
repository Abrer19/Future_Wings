# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of FutureWings and its user data seriously. If you discover a vulnerability, please do NOT create a public issue on GitHub.

### How to Report
1. Email your report to **security@futurewings.org** or contact the repository administrators privately.
2. Include details of the vulnerability:
   - Type of issue (e.g. CSRF, XSS, token leakage, authentication bypass)
   - Step-by-step instructions or proof-of-concept to reproduce
   - Potential impact
3. We will acknowledge receipt within 48 hours and work towards resolving it before any public disclosure.

## Security Practices in Place
- **Claims-based Authorization**: Protected endpoints extract user identifiers directly from cryptographically signed JWT tokens (`ClaimTypes.NameIdentifier`).
- **Password Protection**: Passwords are encrypted with BCrypt hashing including automatic salting.
- **Problem Details Specification**: Error responses conform to RFC 7807 problem details to prevent leaking internal stack traces.
- **SQL Injection Prevention**: All database access utilizes Entity Framework Core parameterized queries.
