# Abdullah Portfolio

A responsive, single-page portfolio for Abdullah Layth. It is built with plain HTML, CSS, and JavaScript—no build step or framework is required.

## Run locally

Open `index.html` directly, or serve the folder with a local static server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Project structure

```text
.
├── assets/          # Approved logo assets
├── scripts/main.js  # Navigation, reveal motion, mobile menu, ambient particles
├── styles/main.css  # Tokens, layout, responsive rules, and motion
├── index.html       # Page content and sections
└── README.md
```

## Updating content

- Add a project by duplicating a `.case-file` card in the **Work** section of `index.html`.
- Add a skill by duplicating a `.tool-card` in the **Skills** section.
- Keep the original files in `assets/` unchanged.
- Keep motion optional: the site already reduces ambient motion for users who request it.

## Publishing with GitHub Pages

1. Create a GitHub repository and upload these files to the default branch.
2. In repository settings, open **Pages**.
3. Deploy from the default branch and `/ (root)` folder.
4. Add a custom domain only after confirming the generated Pages URL works.

## Checks before publishing

- Confirm every external link and email address.
- Test desktop, tablet, mobile portrait, and mobile landscape.
- Check `prefers-reduced-motion` once.
- Do not publish personal information that you do not want publicly visible.
