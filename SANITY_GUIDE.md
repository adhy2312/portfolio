# How to Edit Your Portfolio Through Sanity CMS

## Getting Started

### 1. Access the Sanity Studio
- Go to: `http://localhost:3000/studio` (if running locally)
- Or visit your deployed Sanity Studio URL
- You'll need your Sanity account credentials

### 2. Dashboard Overview
When you log in, you'll see the Sanity Studio with all your content types on the left sidebar:
- Hero Section
- About Section
- Skills
- Projects
- Achievements
- Photography
- Testimonials
- Trusted By
- Footer
- Contact Section

---

## Editing Each Section

### Hero Section
**File**: Sanity Document `hero`

Edit your hero section (the animated background with particles):

1. Click **Hero Section** in the sidebar
2. Update these fields:
   - **Greeting**: Text displayed above your name (e.g., "Hey there!")
   - **Name**: Your full name
   - **Hero Heading**: Main headline
   - **Role Title**: Your job title/role
   - **Bio Description**: Brief description
   - **Tech Stack**: Array of technologies you use (add/remove items)
   - **Stats**: Key statistics with value and label
   - **Highlights**: Main highlights with title, description, and icon names
   - **Resume PDF URL**: Link to your resume PDF
   - **Hero Image**: Upload a cutout image (removes background)

**Icon Names**: Use Feather Icons format (e.g., `FiCode`, `FiGithub`, `FiLinkedin`)

---

### About Section
**File**: Sanity Document `about`

Tell your story:

1. Click **About Section** in the sidebar
2. Edit:
   - **Location Text**: Where you're based (e.g., "Kerala, India")
   - **Bio Paragraphs**: Multiple paragraphs about yourself
   - **Years of Experience**: Experience level (e.g., "2+", "3+")
   - **Stats**: Career stats with icons
   - **Profile Image**: Your professional photo

---

### Skills Section
**File**: Sanity Document `skillCategory`

Manage your technical skills:

1. Click **Skills** in the sidebar
2. Create/edit skill categories with:
   - **Category Name**: (e.g., "Frontend", "Backend", "Tools")
   - **Skills**: Array of individual skills
   - **Icon Name**: Icon for the category
   - **Color**: Category color (optional)

---

### Projects (My Works)
**File**: Sanity Document `project`

Showcase your work:

1. Click **Project** in the sidebar
2. Click **Create** to add a new project
3. Fill in:
   - **Title**: Project name
   - **Description**: What the project does
   - **Tags**: Technologies used (e.g., "React", "Node.js")
   - **Image**: Project screenshot with hotspot selection
   - **GitHub Link**: Link to repository
   - **Live Link**: Deployed project URL

---

### Photography Section
**File**: Sanity Document `photo`

Display your photography:

1. Click **Photo** in the sidebar
2. Upload photos with:
   - **Image**: The photo file
   - **Title**: Photo title
   - **Category**: Photography type/genre
   - **Alt Text**: Description for accessibility

---

### Achievements
**File**: Sanity Document `achievement`

Add your accomplishments:

1. Click **Achievements** in the sidebar
2. Create entries with:
   - **Title**: Achievement name
   - **Description**: Details
   - **Date**: When achieved
   - **Icon Name**: Feather icon
   - **Category**: Achievement type

---

### Testimonials
**File**: Sanity Document `testimonial`

Add social proof:

1. Click **Testimonials** in the sidebar
2. Add testimonials with:
   - **Name**: Person's name
   - **Role**: Their title/company
   - **Message**: What they said
   - **Image**: Their photo
   - **Rating**: Star rating (1-5)

---

### Trusted By
**File**: Sanity Document `trustedBy`

Show companies/clients you've worked with:

1. Click **Trusted By** in the sidebar
2. Add entries with:
   - **Company Name**: Name
   - **Logo**: Company logo
   - **Description**: Brief description

---

### Footer Section
**File**: Sanity Document `footer`

Update footer content:

1. Click **Footer** in the sidebar
2. Edit:
   - **Copyright Text**: © Your Name
   - **Quick Links**: Social links, contact info
   - **Description**: Footer tagline
   - **Links**: Array of footer navigation links

---

### Contact Section
**File**: Sanity Document `contact`

Manage contact information:

1. Click **Contact** in the sidebar
2. Update:
   - **Heading**: Section title
   - **Subheading**: Description
   - **Contact Methods**: Email, phone, social media with icons
   - **CTA Button Text**: Call-to-action text
   - **Button Link**: Where the button links to

---

## Tips & Best Practices

### Images
- **Hotspot**: When uploading images, use the hotspot tool to focus on important areas
- **Formats**: Use JPG for photos, PNG for logos/graphics
- **Size**: Keep images under 2MB for faster loading

### Text Fields
- **Rich Text**: Some fields support formatting (bold, italics, links)
- **Paragraphs**: Use line breaks to separate thoughts
- **Length**: Keep descriptions concise and engaging

### Arrays
- **Adding Items**: Click the "+" button to add new items
- **Deleting Items**: Use the trash icon to remove items
- **Reordering**: Drag items to change order

### Icons
Common Feather icons:
- `FiCode` - Code
- `FiGithub` - GitHub
- `FiLinkedin` - LinkedIn
- `FiMail` - Email
- `FiPhone` - Phone
- `FiMapPin` - Location
- `FiAward` - Award
- `FiCalendar` - Calendar
- `FiDownload` - Download
- `FiExternalLink` - External Link

[Full Feather Icons List](https://feathericons.com/)

---

## Publishing Changes

1. **Auto-Save**: Sanity auto-saves as you type
2. **Live Updates**: Once saved, changes appear on your site within seconds
3. **Drafts**: You can save as draft if you want to review before publishing
4. **Revisions**: Sanity keeps revision history - you can revert changes

---

## Troubleshooting

**Changes not appearing?**
- Clear your browser cache (Ctrl+Shift+Delete)
- Refresh the website (Ctrl+F5)
- Check browser console for errors

**Images not uploading?**
- Check file size (should be < 5MB)
- Ensure file format is supported (JPG, PNG, GIF, WebP)
- Try a different browser

**Need help with Sanity?**
- [Sanity Documentation](https://www.sanity.io/docs)
- [Sanity Community](https://www.sanity.io/community)

---

## Your Sanity Project Details

- **Project ID**: uefti8ya
- **Dataset**: production
- **API Version**: 2023-05-03

All your data is synced and live! ✨
