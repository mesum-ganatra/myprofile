# Dynamic Personal Portfolio Website

A sleek, premium, minimalist single-page portfolio website driven entirely by `resume.json`. Built with semantic **HTML5**, **JavaScript (ES6+)**, and **Tailwind CSS (via CDN)** with custom **glassmorphism**, **ambient glows**, and a dedicated **print stylesheet**.

---

## 🌟 Key Features

- **100% Dynamic & Data-Driven**: Zero hardcoded personal details. All sections, titles, and links are dynamically rendered by fetching `resume.json`.
- **Zero Build Step**: Runs directly in any modern browser via Tailwind CDN and Font Awesome CDN.
- **Strict Data Hiding**: If any section or array in `resume.json` is missing or empty, that section and its corresponding header navigation link are automatically hidden.
- **Glassmorphism & Neon Glow**: Frosted-glass cards, subtle neon cyan/teal accents, smooth hover transitions, and status indicators.
- **Light & Dark Mode**: Defaults to dark mode, with a light/dark toggle button in the header that persists user preference in `localStorage`.
- **Responsive Layout**: Fluid grids and flex layouts optimized for mobile, tablet, and desktop devices.
- **Print to PDF Ready**: Includes a clean, media-specific print stylesheet (`@media print`) that removes navigation, buttons, and decorative glow to output an elegant, employer-ready resume.

---

## 📁 Project Structure

```text
myportfolio/
├── index.html          # Semantic HTML structure & CDN link imports
├── styles.css          # Glassmorphism, neon effects, transitions & print styles
├── app.js              # Fetch logic, dynamic DOM rendering & theme management
├── resume.json         # Single source of truth for all portfolio data
├── README.md           # Documentation, local server guide & deployment
└── certificates/       # Folder for certificate previews and PDFs
    ├── odoo-bootcamp.png
    └── odoo-bootcamp.pdf
```

---

## 🚀 How to Run Locally

> ⚠️ **Important Note on `fetch()`**:  
> Modern browsers enforce security restrictions (CORS) that block `fetch('resume.json')` when you double-click `index.html` (which opens via the `file:///` protocol).  
> To run the portfolio, you need a lightweight local HTTP server.

Choose any of the simple options below:

### Option 1: Python (Recommended - Built into most systems)
Open a terminal in the project directory (`myportfolio`) and run:

```bash
# If using Python 3
python -m http.server 8000

# Or on some systems
python3 -m http.server 8000
```
Then open your browser at **[http://localhost:8000](http://localhost:8000)**.

---

### Option 2: Node.js (`npx`)
If you have Node.js installed, run:

```bash
npx serve .
```
or
```bash
npx http-server -p 8000
```
Then navigate to the URL provided in the terminal output.

---

### Option 3: VS Code "Live Server" Extension
1. Open the `myportfolio` folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey) if not already installed.
3. Right-click on `index.html` and select **"Open with Live Server"**.

---

### Option 4: PHP
If you have PHP installed, run:

```bash
php -S localhost:8000
```
Then visit **[http://localhost:8000](http://localhost:8000)**.

---

## ✏️ How to Edit `resume.json`

The website renders whatever is inside `resume.json`. You can update, add, or remove information by editing this file directly:

### 1. `basics` (Hero & Contact)
- `name`: Your full name (also updates page title and header brand).
- `label`: Your title or role (e.g., `"BSCS Student"`).
- `headline`: A short tagline or summary sentence.
- `location`: An object with `region` and `country` (e.g., `{"region": "Karachi", "country": "Pakistan"}`).
- `email`: Your contact email. Automatically wires up the `"Contact Me"` hero button and the email card in the Contact section.
- `availability`: A short status string (e.g., `"Currently part of GU Tech since June 2026"`). Renders with a glowing status pulse.
- `leadershipNote`: A quote or work ethic endorsement highlighted in the About section.
- `profiles`: An array of social/code profiles. Each entry accepts:
  - `network`: e.g. `"LinkedIn"` or `"GitHub"`
  - `url`: Direct link to your profile
  - `icon`: Font Awesome icon classes (e.g., `"fa-brands fa-linkedin-in"`, `"fa-brands fa-github"`)

### 2. `about`
- `intro`: An array of paragraphs describing your background and goals.
- `strengths`: An array of string bullet points highlighting your key attributes.

### 3. `education`
An array of education history items. Each object supports:
- `institution`: School / University name.
- `studyType`: Degree or level (e.g., `"BSCS"`, `"A Levels"`, `"O Levels"`).
- `area`: Field of study (e.g., `"Computer Science"`, `"Pre-Engineering"`).
- `startDate` & `endDate`: Timeframe (e.g., `"2026"` - `"2030"`).
- `detailsLabel` & `details`: Optional subject/coursework list (e.g. `detailsLabel: "Subjects"` and `details: ["Physics", "Chemistry", "Mathematics"]`).

### 4. `skills`
An array of skill groups without arbitrary percentages:
- `category`: Category name (e.g. `"Languages"`, `"Frameworks"`, `"Tools"`).
- `items`: An array of skill names (e.g. `["Python", "C"]`).

### 5. `certificates`
An array of certificate cards:
- `name`: Certificate title.
- `issuer`: Issuing body or platform (e.g. `"Odoo"`).
- `image`: Path to the certificate image preview (e.g. `"certificates/odoo-bootcamp.png"`).
- `url`: Path or link to the full document/PDF (e.g. `"certificates/odoo-bootcamp.pdf"`).

### 6. `languages`
An array of spoken/written languages:
- `language`: Language name (e.g. `"English"`, `"Urdu"`).
- `fluency`: Fluency tag (e.g. `"Fluent"`, `"Native"`).

> 💡 **Auto-Hide Rule**:  
> To hide any section (such as `certificates` or `languages`), simply remove the key or set it to an empty array `[]` in `resume.json`. The section and its corresponding header navigation link will completely vanish from the page.

---

## 🌐 How to Deploy (Free Hosting)

Since this project has no build step and consists of static HTML, CSS, and JS, it can be deployed to any static host in seconds:

### Option A: GitHub Pages (Recommended)
1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial portfolio commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo-name>.git
   git push -u origin main
   ```
2. On GitHub, go to your repository **Settings** > **Pages**.
3. Under **Branch**, select `main` and root `/ (root)`, then click **Save**.
4. Your site will be live at `https://<your-username>.github.io/<your-repo-name>/`.

### Option B: Netlify
1. Go to [Netlify](https://www.netlify.com/).
2. Drag and drop the `myportfolio` folder into the **Netlify Drop** dashboard, or connect your GitHub repository.
3. Netlify will deploy your site instantly with a free SSL certificate.

### Option C: Vercel
1. Install Vercel CLI: `npm i -g vercel` (or link your GitHub repository on [vercel.com](https://vercel.com)).
2. In the project directory, run:
   ```bash
   vercel
   ```
3. Follow the CLI prompts to deploy.

---

## 🖨️ Exporting to PDF (Resume Mode)

You can generate a PDF version of your resume anytime:
1. Click the **"Print to PDF"** button in the header or footer (or press `Ctrl + P` / `Cmd + P`).
2. In the browser print dialog:
   - Set **Destination** to **"Save as PDF"**.
   - Ensure **Background graphics** is checked.
   - Click **Save**.
The print stylesheet will automatically strip out all navigation bars, dark backgrounds, theme toggles, and buttons to give you a pristine, high-contrast document.

---

## 📝 Blog & Admin CMS

A static blog with a private admin dashboard and rich editor. The site stays plain HTML/CSS/JS (no framework, no serverless functions): everything backend-like is **Firebase** (login + Firestore data) and **Cloudinary** (images).

| URL | What it is |
|---|---|
| `/blog` | Public list: search, tag filter, "Load more" after 9 posts |
| `/blog/<slug>` | A published post (SEO tags, share buttons) |
| `/admin/login` | Admin sign-in (Firebase email + password, one admin UID) |
| `/admin` | Dashboard: all posts, counts, search, publish/unpublish, delete |
| `/admin/editor` | Rich editor (Tiptap): headings, lists, tables, code, images, YouTube, preview |

**Security:** only the admin UID can write; the public can read only `published` posts (see `firestore.rules`, which is a reference copy: live rules are edited in the Firebase console). Post HTML is sanitized with DOMPurify on save and on display. Admin pages send `X-Robots-Tag: noindex`.

**Keep private:** the Cloudinary upload preset name (`assets/cloudinary-config.js`) is unsigned, so anyone who learns it can upload to the account. Firebase web config values are public by design.

**Add another admin:** add their UID to `ADMIN_UIDS` in `assets/admin/guard.js` **and** to the list in the Firestore rules.

**Custom domain:** add it in Vercel and under Firebase → Authentication → Settings → Authorized domains, then update `SITE` in `assets/blog-data.js`.

**Rebuild the bundles** (only if you change `tools/editor/src` or upgrade a package):

```bash
cd tools/editor && npm install && npm run build
```

**Known limits:** WhatsApp/Facebook show the generic site preview for shared posts (fixing it needs a server function); deleting a post does not delete its Cloudinary images.
