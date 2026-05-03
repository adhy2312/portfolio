# Sanity CMS Editing Workflow

## Visual Overview

```
YOU → Sanity Studio → Your Website
(Edit)   (CMS)        (Live Updates)
```

---

## Step-by-Step: Edit Your Portfolio

### 1. Open Sanity Studio
```
http://localhost:3000/studio
or
http://localhost:3333
```

### 2. Select Content Type from Sidebar
You'll see these options:
```
📑 Desk
  ├── 🦸 Hero Section
  ├── 📖 About Section  
  ├── 🛠️ Skills
  ├── 💼 Project
  ├── 🏆 Achievements
  ├── 📸 Testimonials
  ├── 🖼️ Photo
  ├── 🤝 Trusted By
  ├── 📞 Contact
  └── 🔗 Footer
```

### 3. Click on Document to Edit

**Example: Editing Hero Section**

```
HERO SECTION
═══════════════════════════════════════

□ Greeting
  Hey there!

□ Name  
  Your Name Here

□ Hero Heading
  Full-Stack Developer & Creator

□ Role Title
  Electronics Engineer | React Developer | IoT Enthusiast

□ Bio Description
  [Text area for your bio]

□ Tech Stack (Array)
  + React
  + Node.js
  + Python
  + MongoDB
  [+ Add More]

□ Stats (Array of objects)
  ┌─────────────────────────────┐
  │ Value: 5+                   │
  │ Label: Years Coding         │
  │ [Delete]                    │
  └─────────────────────────────┘

□ Hero Image
  [Upload Image]
  
□ Resume PDF URL
  https://example.com/resume.pdf

[Save Button - Auto-saves]
```

---

## Content Type Reference

### 🦸 HERO SECTION
What appears: Large animated name with gradient background
Edit:
- Greeting text
- Your name
- Main heading
- Role/title
- Technologies
- Hero image

### 📖 ABOUT SECTION  
What appears: Your story section with photo
Edit:
- Bio paragraphs (up to 3)
- Location
- Experience years
- Stats with icons
- Profile photo

### 🛠️ SKILLS
What appears: Organized skill categories
Edit:
- Skill category names
- Skills within each category
- Category icons
- Category colors (optional)

**Example Structure:**
```
Frontend
├── React
├── TypeScript
├── Tailwind CSS
└── Framer Motion

Backend
├── Node.js
├── Python
├── MongoDB
└── Express
```

### 💼 PROJECTS
What appears: Project cards in portfolio
For each project, edit:
- Title
- Description
- Tags (technologies)
- Project screenshot
- GitHub link
- Live demo link

### 🏆 ACHIEVEMENTS
What appears: Achievements section
Edit:
- Title
- Description
- Date achieved
- Icon name
- Category

### 📸 TESTIMONIALS
What appears: What people say about you
Edit:
- Person's name
- Their role/company
- Quote/message
- Their photo
- Rating (1-5 stars)

### 📸 PHOTOGRAPHY
What appears: Photo gallery
Edit:
- Upload image
- Title
- Category
- Description

### 🤝 TRUSTED BY
What appears: Companies you've worked with
Edit:
- Company name
- Logo
- Description

### 📞 CONTACT
What appears: Contact section
Edit:
- Contact methods (email, phone, social)
- Icons for each method
- Section heading
- CTA button text

### 🔗 FOOTER
What appears: Footer content
Edit:
- Copyright text
- Footer links
- Description
- Social media links

---

## Array Fields (Adding Multiple Items)

Some fields are **arrays** (lists of items). Here's how to manage them:

```
✏️ Tech Stack (Array of strings)
┌─────────────────────────────────┐
│ + React                   [✕]   │
│ + Node.js                 [✕]   │
│ + Python                  [✕]   │
└─────────────────────────────────┘
  [+ Add Item]

To add: Click "+ Add Item"
To remove: Click [✕]
To reorder: Drag items
```

```
✏️ Stats (Array of objects)
┌─────────────────────────────────┐
│ Value: "5+"                     │
│ Label: "Years Coding"           │
│ Icon: "FiAward"                 │
│ [Remove]                        │
├─────────────────────────────────┤
│ Value: "20+"                    │
│ Label: "Projects Built"         │
│ Icon: "FiCode"                  │
│ [Remove]                        │
└─────────────────────────────────┘
  [+ Add Item]
```

---

## Images in Sanity

### Uploading
```
[Upload Image]
  ↓
[Drag file or click to browse]
  ↓
[Hotspot tool - Click to focus area]
  ↓
[Image uploaded!]
```

### Hotspot Tool
When you see the **hotspot** option:
1. Click on the important area of the image
2. Drag to select the focus area
3. This ensures the important part always shows

---

## Rich Text Fields

Some fields support formatting:
```
┌─────────────────────────────────┐
│ Your text here                  │
│                                 │
│ [B] [I] [Link] [List]           │
│                                 │
│ Formatting options above ☝️      │
└─────────────────────────────────┘
```

- **[B]** = Bold
- **[I]** = Italic  
- **[Link]** = Add hyperlink
- **[List]** = Bullet points

---

## Publishing & Saving

```
As you type/edit:
┌─────────────────────────┐
│  ✓ Changes saved ✓      │ ← Auto-save indicator
└─────────────────────────┘
```

**Timeline:**
1. You edit in Sanity
2. Auto-saved (2-3 seconds)
3. Your website updates live
4. Changes visible instantly

---

## Important Field Types

### TEXT (Single line)
```
Your Name
```

### STRING (Code-like values)
```
FiCode
https://example.com
```

### TEXT AREA (Multiple lines)
```
This is a longer description
that can span multiple lines
and paragraphs.
```

### NUMBER
```
5
3.5
```

### URL
```
https://github.com/yourprofile
```

### IMAGE
```
[Upload area]
```

### ARRAY
```
[Item 1]
[Item 2]
[Item 3]
```

### OBJECT
```
{
  name: "John",
  role: "Designer"
}
```

---

## Common Mistakes to Avoid

❌ **DON'T**: Leave required fields empty
✅ **DO**: Fill all fields marked with *

❌ **DON'T**: Upload images larger than 5MB
✅ **DO**: Resize images before uploading

❌ **DON'T**: Use invalid URLs
✅ **DO**: Use full URLs (https://...)

❌ **DON'T**: Forget to use correct icon names
✅ **DO**: Check [feathericons.com](https://feathericons.com/) for correct names

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Save | Ctrl+S |
| Close panel | Esc |
| Search docs | Ctrl+K |
| Add item | + Button or Ctrl+Alt+A |

---

## Browser Tips

### Clear Cache (if changes don't show)
```
Windows/Linux: Ctrl + Shift + Delete
Mac: Cmd + Shift + Delete
```

### Hard Refresh
```
Windows/Linux: Ctrl + F5
Mac: Cmd + Shift + R
```

---

## Real World Example: Updating Your Project

**Scenario**: You built a new project and want to add it to your portfolio

**Step 1**: Open Sanity Studio
```
http://localhost:3000/studio
```

**Step 2**: Click on "Project" in sidebar

**Step 3**: Click "Create Project" button

**Step 4**: Fill in the form
```
Title: My Amazing Web App
Description: A beautiful weather app built with React
Tags: React, API, Weather, Responsive
Image: [Upload screenshot.png]
GitHub Link: https://github.com/yourname/weather-app
Live Link: https://weather-app-demo.vercel.app
```

**Step 5**: Auto-saves automatically ✓

**Step 6**: Refresh your website
```
http://localhost:3000
```

**Result**: Your new project appears in the portfolio! 🎉

---

## Getting Help

**In Sanity Studio**:
- Hover over field labels for descriptions
- Look for help icons (?)
- Check field validation messages

**Online Resources**:
- [Sanity Docs](https://www.sanity.io/docs)
- [Feather Icons](https://feathericons.com/)
- Project README files

---

## Summary

```
┌─────────────────────────────────────┐
│    Your Sanity CMS Workflow         │
├─────────────────────────────────────┤
│ 1. Open Sanity Studio               │
│ 2. Select content type              │
│ 3. Click document to edit           │
│ 4. Make changes                     │
│ 5. Auto-saves                       │
│ 6. Website updates live ✨          │
└─────────────────────────────────────┘
```

**You're ready to edit your portfolio! 🚀**
