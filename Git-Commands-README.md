# MEGG Projects - Git Commands Guide

This guide contains all the essential Git commands for managing the MEGG Kiosk and Web projects.

## 📁 Project Structure

```
MEGG-FINAL/
├── kiosk-next-frontend/     # MEGG Kiosk Frontend (megg-kiosk)
└── web-next/                # MEGG Web Next (megg-web)
```

## 🚀 Repository URLs

- **Kiosk Frontend**: `https://github.com/YOUR_USERNAME/megg-kiosk.git`
- **Web Next**: `https://github.com/YOUR_USERNAME/megg-web.git`

---

## 🔧 Kiosk Next Frontend (megg-kiosk)

### Navigate to Project
```bash
cd E:\MEGG-FINAL\kiosk-next-frontend
```

### Check Status
```bash
git status
```

### Add Changes
```bash
# Add all changes
git add .

# Add specific file
git add app/page.tsx

# Add multiple files
git add app/page.tsx app/components/camera-preview.tsx
```

### Commit Changes
```bash
# Commit with message
git commit -m "Your commit message here"

# Examples:
git commit -m "Fix camera mirroring issue"
git commit -m "Add loading indicator to save button"
git commit -m "Update configuration modal design"
```

### Push Changes
```bash
# Push to main branch
git push origin main

# Push and set upstream (first time)
git push -u origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

### View Commit History
```bash
git log --oneline
```

### Create New Branch
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Switch to existing branch
git checkout main
```

### Merge Branch
```bash
# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/new-feature

# Delete feature branch after merge
git branch -d feature/new-feature
```

---

## 🌐 Web Next (megg-web)

### Navigate to Project
```bash
cd E:\MEGG-FINAL\web-next
```

### Check Status
```bash
git status
```

### Add Changes
```bash
# Add all changes
git add .

# Add specific file
git add app/(auth)/register/page.js

# Add multiple files
git add app/(auth)/login/page.js app/utils/accountId.js
```

### Commit Changes
```bash
# Commit with message
git commit -m "Your commit message here"

# Examples:
git commit -m "Add account ID generation to registration"
git commit -m "Update Google login with account ID creation"
git commit -m "Fix account ID validation logic"
```

### Push Changes
```bash
# Push to main branch
git push origin main

# Push and set upstream (first time)
git push -u origin main
```

### Pull Latest Changes
```bash
git pull origin main
```

### View Commit History
```bash
git log --oneline
```

### Create New Branch
```bash
# Create and switch to new branch
git checkout -b feature/new-feature

# Switch to existing branch
git checkout main
```

### Merge Branch
```bash
# Switch to main branch
git checkout main

# Merge feature branch
git merge feature/new-feature

# Delete feature branch after merge
git branch -d feature/new-feature
```

---

## 🔄 Daily Workflow

### 1. Start Working
```bash
# Navigate to project
cd E:\MEGG-FINAL\kiosk-next-frontend  # or web-next

# Pull latest changes
git pull origin main
```

### 2. Make Changes
- Edit your files
- Test your changes

### 3. Commit Changes
```bash
# Check what changed
git status

# Add changes
git add .

# Commit with descriptive message
git commit -m "Describe what you changed"
```

### 4. Push Changes
```bash
git push origin main
```

---

## 🚨 Common Issues & Solutions

### Issue: "Your branch is ahead of origin/main"
```bash
# Solution: Push your changes
git push origin main
```

### Issue: "Your branch is behind origin/main"
```bash
# Solution: Pull latest changes
git pull origin main
```

### Issue: "Merge conflicts"
```bash
# 1. Open conflicted files and resolve conflicts
# 2. Add resolved files
git add .

# 3. Complete the merge
git commit -m "Resolve merge conflicts"
```

### Issue: "Nothing to commit, working tree clean"
```bash
# This means no changes to commit - you're up to date!
```

### Issue: "Permission denied"
```bash
# Check if you're logged into GitHub
# Or use personal access token instead of password
```

---

## 📝 Commit Message Guidelines

### Good Commit Messages:
- `"Fix camera mirroring issue"`
- `"Add loading indicator to save button"`
- `"Update configuration modal design"`
- `"Add account ID generation to registration"`

### Bad Commit Messages:
- `"fix"`
- `"update"`
- `"changes"`
- `"work"`

### Format:
```
<type>: <description>

Examples:
feat: Add new camera preview component
fix: Resolve account ID validation bug
style: Update button colors and spacing
docs: Add README for Git commands
```

---

## 🔗 Quick Reference

### Essential Commands:
```bash
git status          # Check current status
git add .           # Add all changes
git commit -m "msg" # Commit changes
git push origin main # Push to GitHub
git pull origin main # Pull from GitHub
```

### Navigation:
```bash
cd E:\MEGG-FINAL\kiosk-next-frontend  # Go to kiosk project
cd E:\MEGG-FINAL\web-next             # Go to web project
```

### Check Which Project You're In:
```bash
pwd  # Shows current directory
```

---

## 🎯 Pro Tips

1. **Always pull before starting work** to get latest changes
2. **Commit often** with small, focused changes
3. **Write descriptive commit messages** that explain what changed
4. **Test your changes** before committing
5. **Use branches** for experimental features
6. **Keep main branch stable** and working

---

## 📞 Need Help?

If you encounter issues:
1. Check `git status` to see current state
2. Try `git pull origin main` to sync
3. Check this README for common solutions
4. Ask for help with specific error messages

---

**Last Updated**: $(date)
**Projects**: MEGG Kiosk Frontend & MEGG Web Next
