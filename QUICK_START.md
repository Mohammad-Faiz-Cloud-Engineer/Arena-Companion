# Arena Companion - Quick Start Guide

## 🚀 Getting Started

### Installation
1. Load extension in Chrome (`chrome://extensions/`)
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the Arena Companion folder

### First Time Setup
1. Click the extension icon in Chrome toolbar
2. Side panel opens with Arena.AI

---

## 🔐 How to Login (Important!)

### ⚠️ Cannot Login Directly in Extension
Due to security restrictions, you **cannot** login directly within the extension's iframe.

### ✅ Simple 3-Step Login Process

```
Step 1: Open https://arena.ai/ in a new tab
   ↓
Step 2: Login on the website (Google OAuth)
   ↓
Step 3: Return to extension → Click refresh button
   ↓
✅ You're logged in!
```

### Detailed Steps:

**1. Open Website**
- Open new browser tab
- Go to: **https://arena.ai/**

**2. Complete Login**
- Click login/sign-in on website
- Complete Google OAuth
- Verify you're logged in

**3. Sync Extension**
- Return to Arena Companion side panel
- Click the **refresh button** (🔄 top-right corner)
- Extension now shows you logged in!

---

## 🎯 Quick Tips

### Using the Extension
- **Refresh Button:** 🔄 Reload Arena.AI interface
- **Login Button:** 👤 Opens Arena.AI in new tab for login
- **Side Panel:** Persists across tabs and windows

### Why This Login Method?
- ✅ **Security:** Prevents clickjacking attacks
- ✅ **OAuth Compliance:** Follows Google's security requirements
- ✅ **Session Sharing:** Chrome shares cookies between website and extension
- ✅ **Standard Practice:** Used by many professional extensions

---

## 🔧 Troubleshooting

### Not Logged In After Refresh?
- ✅ Verify you logged in at **https://arena.ai/** (exact URL)
- ✅ Clear browser cache and try again
- ✅ Check cookies are enabled

### Login Button Not Working?
- ✅ Use manual method (login on website first)
- ✅ Reload extension from `chrome://extensions/`

### "Content is Blocked" Error?
- ✅ This is expected when trying to login in iframe
- ✅ Follow the 3-step process above instead

---

## 📚 More Help

- **Detailed Guide:** See `LOGIN_GUIDE.md`
- **Full Documentation:** See `README.md`
- **Technical Details:** See `DOCUMENTATION_UPDATE_SUMMARY.md`

---

## ⚡ Quick Reference

| Action | How To |
|--------|--------|
| Open Extension | Click extension icon in toolbar |
| Refresh | Click 🔄 button (top-right) |
| Login | Login at https://arena.ai/ first, then refresh |
| Alternative Login | Click 👤 button (opens new tab) |

---

## 🎉 You're All Set!

Once logged in, your session persists across:
- ✅ Browser tabs
- ✅ Browser windows  
- ✅ Browser restarts (until you logout)

**Enjoy using Arena Companion!**

---

**Need Help?** Check `LOGIN_GUIDE.md` for comprehensive troubleshooting.
