# ⚡ Sanity CMS Quick Reference Card

## 🚀 Start Here (3 Steps)

```
1. npm start                           (in portfolio folder)
2. cd studio && npm start              (in new terminal)
3. http://localhost:3000/studio        (open in browser)
```

---

## 📑 Content Types & Shortcuts

### All Available Content Types:

```
🦸 HERO           → Your intro, name, role, tech stack
📖 ABOUT          → Bio, experience, stats, photo
🛠️ SKILLS         → Technical skills by category
💼 PROJECT        → Portfolio projects (add multiple)
🏆 ACHIEVEMENTS   → Awards and accomplishments
💬 TESTIMONIALS   → What people say about you
🖼️ PHOTO          → Photography gallery
🤝 TRUSTED BY     → Companies/clients worked with
📞 CONTACT        → Contact info and methods
🔗 FOOTER         → Footer content & links
```

---

## ✏️ Quick Edit Patterns

### Add Something New
```
1. Click content type on left
2. Click [Create] or [+]
3. Fill required fields (marked with *)
4. Auto-saves automatically ✓
```

### Update Existing
```
1. Click content type
2. Click the document
3. Edit fields
4. Auto-saves automatically ✓
```

### Add to an Array
```
[Existing Item 1]
[Existing Item 2]
[+ Add Item]  ← Click here
[New Item Form appears]
```

### Remove from Array
```
[Item 1]
[Item 2] [✕] ← Click ✕ to delete
[Item 3]
```

---

## 🎯 Most Important Fields by Section

### HERO Section
```
□ Name             (Your name)
□ Role             (Your job title)
□ Tech Stack       (React, Node, etc.)
□ Hero Image       (Professional photo/cutout)
```

### ABOUT Section
```
□ Bio Paragraphs   (2-3 paragraphs about you)
□ Profile Image    (Your professional photo)
□ Stats            (Key numbers)
```

### PROJECT Section (repeat for each project)
```
□ Title            (Project name)
□ Description      (What it does)
□ Tags             (Technologies used)
□ Image            (Screenshot)
□ GitHub Link      (Repository URL)
□ Live Link        (Deployed URL)
```

---

## 🎨 Icon Names Cheat Sheet

```
🔤 Development
   FiCode          FiGithub         FiBriefcase
   FiDownload      FiExternalLink   FiSettings

📱 Contact
   FiMail          FiPhone          FiMapPin
   FiLinkedin      FiGithub         FiUser

⭐ Other
   FiAward         FiCalendar       FiStar
   FiCheckCircle   FiXCircle
```

**How to use**: Type the icon name exactly as shown in icon fields.

[Full list: feathericons.com](https://feathericons.com/)

---

## 📸 Image Tips

```
✅ Good:
   - Professional photos
   - Clear, well-lit
   - Relevant to content
   - Under 2MB each
   - PNG (for transparency)
   - JPG (for photos)

❌ Avoid:
   - Blurry images
   - Too large files (>5MB)
   - Irrelevant images
   - Low resolution
```

---

## 🔗 URL Format

```
Valid URLs:
✅ https://github.com/yourname/project
✅ https://example.com
✅ mailto:email@example.com
✅ https://example.com/resume.pdf

Invalid:
❌ github.com/yourname          (missing https://)
❌ www.example.com              (should be https://www.example.com)
```

---

## 🆚 Field Types at a Glance

| Type | Example | Used For |
|------|---------|----------|
| String | "John Doe" | Names, titles |
| Text | "Long bio..." | Longer content |
| Number | 5 | Years, counts |
| URL | "https://..." | Links |
| Image | [Upload] | Photos |
| Array | [Item1, Item2] | Lists, multiple items |
| Object | {name, role} | Complex data |

---

## ⌨️ Keyboard Tricks

```
Ctrl/Cmd + S    →    Save current document
Escape          →    Close editor panel
Tab             →    Jump to next field
Shift + Tab     →    Jump to previous field
Ctrl/Cmd + K    →    Search documents
```

---

## 🔄 Data Flow

```
┌──────────────────────────────────────┐
│    You Edit in Sanity Studio        │
└────────────┬─────────────────────────┘
             │ Auto-save
             ↓
┌──────────────────────────────────────┐
│    Sanity saves to database          │
└────────────┬─────────────────────────┘
             │ API call
             ↓
┌──────────────────────────────────────┐
│    React fetches from Sanity API     │
└────────────┬─────────────────────────┘
             │ Updates state
             ↓
┌──────────────────────────────────────┐
│    Website shows new content ✨      │
└──────────────────────────────────────┘
```

---

## 🐛 Quick Troubleshooting

```
Problem                    Solution
─────────────────────────────────────────────────
Changes not showing       → Ctrl+F5 (hard refresh)
Image won't upload        → Check size < 5MB
Can't login to Sanity     → Verify credentials
Sanity won't open         → npm install → npm start
React app won't run       → npm install → npm start
Icons not showing         → Check spelling exactly
Links not working         → Verify full URLs with https://
```

---

## 📊 Content Checklist

Minimum content to get started:

```
✓ HERO
  ✓ Name
  ✓ Role
  ✓ Tech stack (3-5 items)

✓ ABOUT
  ✓ Bio paragraphs
  ✓ Profile photo

✓ SKILLS
  ✓ 2-3 skill categories
  ✓ 5+ skills total

✓ PROJECTS
  ✓ At least 3 projects

✓ CONTACT
  ✓ Email
  ✓ At least 1 social link

✓ FOOTER
  ✓ Copyright text
  ✓ Social links
```

---

## 🎬 Common Workflows

### Add a New Project
```
Sanity Studio
  → Click "Project"
  → Click "Create"
  → Fill title, description, image, links
  → Save
  → Done! Website updates instantly
```

### Update Hero
```
Sanity Studio
  → Click "Hero Section"
  → Edit fields
  → Auto-saves
  → Website updates
```

### Add Multiple Skills
```
Sanity Studio
  → Click "Skills"
  → Click category
  → Click "+ Add"
  → Type skill name
  → Repeat
```

---

## 🌐 Access Points

```
Development:
  React App:     http://localhost:3000
  Sanity Studio: http://localhost:3000/studio
  Sanity Alt:    http://localhost:3333

Production:
  Your Domain:   https://yoursite.com
  Sanity API:    https://[projectid].sanity.io
```

---

## 📁 File Locations

```
portfolio/
├── src/
│   ├── components/        ← React components
│   ├── sanity.js          ← Sanity client config
│   └── App.js             ← Main component
├── studio/
│   ├── schemas/           ← Content schemas
│   └── sanity.config.js   ← Studio config
└── SANITY_*.md            ← Guides (read these!)
```

---

## 🎓 Help Resources

```
📖 Full Guide        → README_SANITY_SETUP.md
🎨 Visual Guide      → SANITY_EDITING_GUIDE.md
📚 Reference         → SANITY_GUIDE.md
✅ Checklist         → SETUP_CHECKLIST.md
⚡ This Card         → You are here!

🔗 External:
   Sanity Docs:    www.sanity.io/docs
   Icons:          feathericons.com
```

---

## ⚡ Remember

```
✓ Auto-save is ON - no need to click save
✓ Changes appear instantly on your site
✓ No need to deploy code for content changes
✓ You can always undo from revision history
✓ Ask Sanity docs if stuck
```

---

**You've got this!** 🚀

Start with Hero Section, then move through each type.

5 minutes per section, then your site is fully customized!

---

**Quick Start Command**:
```bash
npm start
# (in new terminal)
cd studio && npm start
# Then visit: http://localhost:3000/studio
```

Happy editing! ✨
