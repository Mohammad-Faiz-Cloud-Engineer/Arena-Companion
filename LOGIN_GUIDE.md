# Arena Companion - Login Guide

## How to Login to Arena.AI in the Extension

### The Issue
You may notice that clicking login buttons directly within the extension's side panel doesn't work. This shows an error message like "This content is blocked" or "Redirect is not allowed for a preflight request."

### Why This Happens
- **Security Restriction**: Google OAuth and most authentication providers block login forms from loading inside iframes
- **Content Security Policy**: This is a standard security measure to prevent clickjacking attacks
- **Browser Protection**: Chrome enforces these restrictions to keep your accounts safe

### ✅ Solution: Login via Website First

Follow these simple steps:

#### Step 1: Open Arena.AI Website
1. Open a new browser tab
2. Navigate to **[https://arena.ai/](https://arena.ai/)**

#### Step 2: Complete Login
1. Click the login/sign-in button on the website
2. Complete the Google OAuth process (or your preferred login method)
3. Verify you are successfully logged in on the website

#### Step 3: Return to Extension
1. Go back to the Arena Companion extension (side panel)
2. Click the **refresh button** (circular arrow icon in the top-right)
3. The extension will now show you as logged in!

### How It Works
- Chrome shares cookies and session data between the website and the extension
- Once you login on the main website, the extension automatically inherits your logged-in session
- This is a secure and standard approach used by many browser extensions

### Visual Guide

```
┌─────────────────────────────────────┐
│  Step 1: Open https://arena.ai/    │
│  in a regular browser tab           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 2: Complete login on website │
│  (Google OAuth or other method)     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  Step 3: Return to extension and   │
│  click the refresh button           │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│  ✅ You're now logged in!           │
└─────────────────────────────────────┘
```

### Alternative: Use the Login Button

The extension also includes a **Login button** (user icon) in the side panel that:
1. Opens Arena.AI in a new tab automatically
2. Lets you complete the login process
3. Automatically refreshes the extension when you're done
4. Closes the login tab for you

This provides a more streamlined experience!

### Troubleshooting

**Problem:** Still not logged in after refreshing
- **Solution:** Make sure you completed the login on https://arena.ai/ (not a different Arena domain)
- **Solution:** Try clearing your browser cache and cookies, then login again
- **Solution:** Make sure cookies are enabled in Chrome settings

**Problem:** Login button doesn't appear
- **Solution:** Make sure you're using the latest version of the extension
- **Solution:** Try reloading the extension from chrome://extensions/

**Problem:** Extension shows "This content is blocked"
- **Solution:** This is expected when trying to login directly in the iframe
- **Solution:** Follow the steps above to login via the website first

### Security Note

This approach is actually **more secure** than allowing login within an iframe because:
- ✅ Prevents clickjacking attacks
- ✅ Ensures you're on the real Arena.AI website
- ✅ Protects your Google account credentials
- ✅ Follows OAuth security best practices

### Need Help?

If you continue to experience issues:
1. Check that you're using Chrome 114 or later
2. Verify the extension has proper permissions
3. Try disabling other extensions that might interfere
4. Open the browser console (F12) and check for error messages

---

**Remember:** Always login at **https://arena.ai/** first, then use the extension!

This is a one-time process - once logged in, your session will persist across browser restarts.
