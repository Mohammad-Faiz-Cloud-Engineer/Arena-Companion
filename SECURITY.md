# Security Policy

## Supported Versions

We take security seriously. The following versions of Arena Companion are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.5.x   | :white_check_mark: |
| 1.4.x   | :white_check_mark: |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :x:                |
| 1.1.x   | :x:                |
| < 1.1   | :x:                |

## Security Features

Arena Companion implements enterprise-grade security measures:

### 1. Input & Injection Safety
- **Context-Aware Text Insertion**: Prompt text is inserted with `textContent` or form values rather than HTML sinks
- **Prototype Pollution Prevention**: Blocks `__proto__`, `constructor`, and `prototype` keys in storage operations
- **Input Validation**: Stored user data and runtime message payloads are validated before processing

### 2. Data Protection
- **Sensitive Data Redaction**: Automatic masking of emails, phone numbers, tokens, API keys, and passwords in logs
- **RFC 5322 Email Validation**: Industry-standard email format validation
- **Storage Quota Management**: Prevents storage overflow attacks
- **Length Limits**: Enforced maximum lengths for all string inputs

### 3. Secure Communication
- **Content Security Policy**: Restrictive CSP on extension pages
- **Sandbox Attributes**: Iframe sandboxing with only the permissions needed to render Arena.AI
- **HTTPS Only**: All external communications use HTTPS
- **No External Dependencies**: Zero third-party libraries to minimize attack surface

### 4. Chrome Extension Security
- **Manifest V3**: Uses latest Chrome Extension manifest version
- **Minimal Permissions**: Only requests necessary permissions
- **declarativeNetRequest**: Professional header modification without webRequest
- **Service Worker Architecture**: Modern, secure background script implementation

## Reporting a Vulnerability

We appreciate responsible disclosure of security vulnerabilities.

### How to Report

**Please DO NOT open public GitHub issues for security vulnerabilities.**

Instead, please report security issues via:

1. **Private Contact**: Use a verified maintainer contact method (private security advisory, verified repository email, or another non-public channel)
2. **Subject Line**: "Arena Companion Security Vulnerability"
3. **Include**:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
   - Your contact information

### What to Expect

- **Acknowledgment**: Within 48 hours of your report
- **Initial Assessment**: Within 5 business days
- **Status Updates**: Every 7 days until resolution
- **Fix Timeline**: Critical issues within 7 days, high priority within 14 days, medium/low within 30 days
- **Credit**: We'll credit you in the CHANGELOG (unless you prefer to remain anonymous)

### Security Update Process

1. **Verification**: We verify and reproduce the reported vulnerability
2. **Fix Development**: Develop and test a security patch
3. **Release**: Deploy the fix in a new version
4. **Disclosure**: Publish security advisory after users have had time to update
5. **Credit**: Acknowledge the reporter (with permission)

## Security Best Practices for Users

### Installation
- Only install from official sources (Chrome Web Store or official GitHub releases)
- Verify the extension ID matches the official one
- Check permissions before installation

### Usage
- Keep the extension updated to the latest version
- Review the CHANGELOG for security updates
- Report suspicious behavior immediately

### Development
- Never commit `.pem` files (private keys)
- Use environment variables for sensitive data
- Follow the security guidelines in this document
- Run security audits before releases

## Security Audit History

| Date       | Version | Auditor        | Result | Notes                           |
|------------|---------|----------------|--------|---------------------------------|
| 2026-04-28 | 1.5.0   | Internal       | A+     | Version synchronization         |
| 2026-02-07 | 1.4.0   | Internal       | A+     | Enhanced XSS prevention         |
| 2026-02-07 | 1.3.0   | Internal       | A      | Text action security review     |
| 2026-02-01 | 1.1.0   | Internal       | A+     | Major security update           |
| 2026-01-15 | 1.0.0   | Internal       | B+     | Initial security implementation |

## Known Security Considerations

### OAuth Limitations
- Google OAuth cannot be performed directly in iframes due to security restrictions
- Users must authenticate on arena.ai in a regular tab first
- This is a security feature, not a vulnerability

### Frame Embedding
- The extension removes frame-blocking headers only for `arena.ai` subframes embedded inside the extension
- This is done using `declarativeNetRequest`
- It does not alter the direct website response for ordinary top-level browsing

### Storage
- User data is stored locally using chrome.storage.local
- No data is transmitted to external servers
- All stored data is sanitized before storage

## Compliance

Arena Companion follows:
- **OWASP Top 10**: Protection against common web vulnerabilities
- **Chrome Extension Security Best Practices**: Official Google guidelines
- **WCAG 2.1 AA**: Accessibility compliance
- **RFC 5322**: Email validation standard
---

**Last Updated**: Apr 28, 2026  
**Version**: 1.5.0  
**Security Posture**: Reviewed
