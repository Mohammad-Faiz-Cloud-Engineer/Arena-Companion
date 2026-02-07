# Security Policy

## Supported Versions

We take security seriously. The following versions of Arena Companion are currently supported with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.3.x   | :white_check_mark: |
| 1.2.x   | :white_check_mark: |
| 1.1.x   | :x:                |
| < 1.1   | :x:                |

## Security Features

Arena Companion implements enterprise-grade security measures:

### 1. Multi-Layer XSS Prevention
- **5-Layer Sanitization**: Script tag removal, HTML tag stripping, javascript: protocol blocking, event handler removal, dangerous character filtering
- **Prototype Pollution Prevention**: Blocks `__proto__`, `constructor`, and `prototype` keys in storage operations
- **Input Validation**: All user inputs are validated and sanitized before processing

### 2. Data Protection
- **Sensitive Data Redaction**: Automatic masking of emails, phone numbers, tokens, API keys, and passwords in logs
- **RFC 5322 Email Validation**: Industry-standard email format validation
- **Storage Quota Management**: Prevents storage overflow attacks
- **Length Limits**: Enforced maximum lengths for all string inputs

### 3. Secure Communication
- **Content Security Policy**: Strict CSP headers in manifest
- **Sandbox Attributes**: Iframe sandboxing with minimal required permissions
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

1. **Email**: [Your security email - e.g., security@yourdomain.com]
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
| 2026-02-07 | 1.3.1   | Internal       | A+     | Enhanced XSS prevention         |
| 2026-02-07 | 1.3.0   | Internal       | A      | Text action security review     |
| 2026-02-01 | 1.1.0   | Internal       | A+     | Major security update           |
| 2026-01-15 | 1.0.0   | Internal       | B+     | Initial security implementation |

## Known Security Considerations

### OAuth Limitations
- Google OAuth cannot be performed directly in iframes due to security restrictions
- Users must authenticate on arena.ai in a regular tab first
- This is a security feature, not a vulnerability

### Frame Embedding
- The extension removes X-Frame-Options headers to embed arena.ai
- This is done using declarativeNetRequest (the professional, secure method)
- Only applies to arena.ai domains, not other websites

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

## Contact

For security-related questions or concerns:
- **Security Email**: [Your security email]
- **GitHub**: [Your GitHub profile]
- **Response Time**: Within 48 hours

---

**Last Updated**: February 7, 2026  
**Version**: 1.3.1  
**Security Grade**: A+
