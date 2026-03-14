# peusepage-astro

A personal portfolio website built with **Astro + Pixi.js + Svelte**, designed for GitHub Pages. Features a retro CRT monitor landing page and an interactive CSS-art office scene with pop-up windows.

**Live site (example):** `https://astro.peuserik.de/`

---

## ✨ Features

- **Landing page** — animated screensaver inside a CRT bezel (three themes: 🔥 Embers, 🌌 Starfield, 👾 Matrix)
- **Office scene** — Pixi.js 2D room with clickable objects (monitor, nameplate, shelf, corkboard)
- **Retro OS pop-ups** — draggable windows for CV, Hobbies, Pinboard, Main Menu
- **Theme switching** — warm / cool / mono × dark / light
- **Language toggle** — English / German
- **Single config file** — all personal content lives in `src/data/config.yml`

---

## 🛠️ Tech stack

| Layer | Technology |
|---|---|
| Static site generator | [Astro](https://astro.build) v5 |
| 2D rendering | [Pixi.js](https://pixijs.com) v8 |
| UI components | [Svelte](https://svelte.dev) v5 |
| Hosting | GitHub Pages (via GitHub Actions) |
| Node | 22+ (managed via nvm) |

---

## ⚙️ Updating your content

All personal content is in **one file**: `src/content/data/config.yml`

```yaml
person:
  name: "Your Name"
  title: "Your Job Title"
  tagline: "A short tagline about you."

social:
  linkedin: "https://linkedin.com/in/your-handle"
  github:   "https://github.com/your-handle"
  email:    "you@example.com"
  xing:     ""          # leave empty to hide
  x_handle: "@you"      # Twitter/X handle
  threads_handle: "@you"

cv_summary: >
  A paragraph or two about your background.
  Separate sentences become bullet points in the CV pop-up.

hobbies:
  - icon: "🎮"
    label_en: "Gaming"
    label_de: "Gaming"
    description_en: "Short description in English."
    description_de: "Kurze Beschreibung auf Deutsch."
  # add up to 6 hobbies for the 2×3 grid

pinboard:
  currently_working_on:
    - label: "Project Name"
      percent: 75          # 0–100
  latest_events:
    - "Something you attended or achieved"
```

Translations (button labels, popup titles, etc.) are in `src/content/data/translations.yml`.

---

## 🚀 Local development

```bash
# Requires Node >=22.12.0 (nvm recommended)
nvm use 22

npm install
npm run dev        # http://localhost:4321/
npm run build      # production build → ./dist/
npm run preview    # preview the build locally
```

---

## 🌐 Deploying to GitHub Pages

### 1. Repository settings

1. Push to GitHub
2. Go to **Settings → Pages**
3. Set **Source** to `GitHub Actions`

The workflow at `.github/workflows/deploy.yml` builds and deploys automatically on every push to `main`.

### 2. Custom domain

1. Add a `CNAME` file to the `public/` folder containing just your domain:
   ```
   yourdomain.com
   ```
2. In your DNS provider, add:
  - For a **subdomain** (recommended), use a **CNAME**:
    - `astro` → `<your-username>.github.io`
  - For an **apex/root domain** (`yourdomain.com`), use **A records**:
     ```
     185.199.108.153
     185.199.109.153
     185.199.110.153
     185.199.111.153
     ```
3. In **Settings → Pages**, enter your custom domain and tick **Enforce HTTPS**.

GitHub automatically provisions a **Let's Encrypt SSL certificate** once DNS propagates (can take up to 24 hours). No manual cert management needed.

> **Note:** When using a custom domain, update `site` in `astro.config.mjs` to your domain and set `base: '/'` (no subdirectory needed):
> ```js
> export default defineConfig({
>   site: 'https://yourdomain.com',
>   base: '/',
>   // ...
> });
> ```
>
> Example for this project:
> ```js
> export default defineConfig({
>   site: 'https://astro.peuserik.de',
>   base: '/',
>   // ...
> });
> ```

### 3. Troubleshooting custom domain

If the page loads but appears blank and the browser console shows 404s for paths like `/peusepage-astro/_astro/...`, the deployment is still using a subdirectory base.

Checklist:
- `astro.config.mjs` must use `base: '/'` and your correct `site` URL.
- `public/CNAME` must exactly match the hostname you open in the browser (for example `astro.peuserik.de`).
- Push to `main` and wait for `.github/workflows/deploy.yml` to finish successfully.
- Hard refresh after deploy (or use a private window) to avoid stale cached HTML.

### 4. Subdirectory deployment (project pages)

Use this only when deploying to a repository subpath like `https://<username>.github.io/peusepage-astro/`:

```js
export default defineConfig({
  site: 'https://<username>.github.io',
  base: '/peusepage-astro',
  // ...
});
```

---

## 📁 Project structure

```
src/
├── content/data/
│   ├── config.yml          ← ✏️  Edit this to update your content
│   └── translations.yml    ← ✏️  Edit this to update UI strings
├── components/
│   ├── MonitorBezel.astro  CRT plastic frame (used on both pages)
│   ├── Controls.svelte     Theme / lang / mode buttons
│   ├── LandingCanvas.svelte  Pixi screensavers + transition
│   ├── OfficeScene.svelte  Pixi office room + interactive zones
│   ├── MainMenuPopup.svelte
│   ├── CVPopup.svelte
│   ├── HobbiesPopup.svelte
│   └── PinboardPopup.svelte
├── pages/
│   ├── index.astro         Landing page
│   └── office.astro        Office / main page
├── stores/
│   ├── settings.ts         theme, darkMode, lang (localStorage)
│   └── popup.ts            activePopup store
├── lib/
│   └── config.ts           YAML loader (build-time)
└── styles/
    └── global.css          CSS custom properties for all 9 theme combos
public/
└── CNAME                   ← Add your custom domain here
.github/workflows/
└── deploy.yml              GitHub Actions build + deploy
```

