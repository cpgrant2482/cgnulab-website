# CGNU Lab · Quarto Website (Concept B)

A working first full-site implementation for the Grant Neutrino Research Group at Boston University, based on the **left-aligned, immersive Concept B** design. The site is not connected to `cgnulab.com` yet.

## 1. Look at the site first (no software installation)

1. Download and unzip `CGNU_Lab_Concept_B_Full_Site.zip`.
2. Open the extracted `cgnu-lab-full-design` directory.
3. Double-click **`OPEN_PREVIEW.html`** (or `preview/index.html`). This browser-ready preview lets you navigate all six pages and see the animated hero.
4. The preview is a generated snapshot. If you edit `.qmd` files, rebuild with Quarto before expecting changes in a browser.

The actual GitHub website is built by Quarto, not by uploading the `preview/` directory.

## 2. What's built

- Home: immersive dark-blue **Concept B**, left-aligned text, light particle overlay, project highlights, news, and team teaser.
- Research: dedicated sections for the four current focus areas only: KamLAND2-Zen, KamLAND-Zen, CUPID, and Eos.
- People: current group members and alumni, with replaceable initials-based photo placeholders.
- Publications: your selected 17 physics papers, linked to journals, plus your full INSPIRE record.
- News: selected recent milestones connected to the four current research areas, not speculative announcements.
- Contact: BU address, email, links, and the tagged public CV PDF.
- Quarto source, responsive stylesheet, animation script, GitHub Pages Actions workflow, and browser-ready preview.

Content is based on your latest CV and selected papers as of November 2026. Review roster, affiliation, CV, and publication selections before replacing your public site. Original abstract artwork is **not real detector data**.

## 3. Replace the hero with your photograph

1. Place a properly licensed and approved photograph in `images/`, for example `images/kamland-hero.jpg`.
2. Open `styles.css` in a text editor (VS Code or any text editor).
3. Find this line, near the heading `Full Concept B direction`:

   ```css
   .hero--detector { --hero-photo: url('images/detector-portal.svg'); ... }
   ```

4. Replace only `url('images/detector-portal.svg')` with `url('images/kamland-hero.jpg')`.
5. Rebuild the site, or commit/push the change so GitHub rebuilds it.

If the photo subject falls on the wrong side, adjust the CSS `background-position` in `.hero--detector .detector-bg` (currently `66% center`). For a very large source image, exporting a ~2000–2600 pixel wide optimized JPEG or WebP is usually sufficient. The text and gradient sit on the left so the photo is visible on the center/right. Always confirm permission and attribution for collaboration imagery.

## 4. Edit the content

| File | What to change |
| --- | --- |
| `index.qmd` | Home headline, introduction, research cards, highlight items |
| `research.qmd` | Current research descriptions, links, project dates |
| `people.qmd` | Names, roles, alumni and placeholder portraits |
| `publications.qmd` | Selected publications and DOI links |
| `news.qmd` | Public news and milestones |
| `contact.qmd` | Email, address, links |
| `cv/Christopher_Grant_Public_CV.pdf` | Tagged public CV PDF |
| `styles.css` | Hero image, colors, fonts, card styling |
| `scripts/particle-field.js` | Decorative animation behavior |

For now the text pages use ordinary HTML inside Quarto `.qmd` files, allowing expressive layouts but requiring care with HTML tags. Quarto's Markdown syntax is also available for future plain-content pages.

## 5. View edits locally with Quarto (Mac)

Install [Quarto](https://quarto.org/docs/download/). Open Terminal and run:

```bash
cd ~/Documents/cgnu-lab-full-design
quarto preview
```

Use the actual path wherever you unzipped it. Quarto should open a browser with the live development site. After making changes, it updates the output. To create the complete HTML version manually: `quarto render`.

## 6. Put the site on GitHub Pages (test address first)

1. Install [GitHub Desktop](https://desktop.github.com/) and sign into GitHub.
2. In GitHub Desktop choose **File → Add local repository** and choose the unzipped `cgnu-lab-full-design` folder. If GitHub Desktop says it is not a repository, choose **Create a repository here**, and name it `cgnu-lab-site`.
3. Commit all files to `main`, then **Publish repository**. If using free GitHub Pages, set the repository **Public**. Check that no private documents are included in the repository.
4. In the GitHub repository go to **Settings → Pages**. Under **Build and deployment → Source**, choose **GitHub Actions**.
5. The bundled `.github/workflows/publish.yml` is configured to build the Quarto website and deploy it after you push changes. Open **Actions** to verify a successful run. If the workflow ran before you set Pages, trigger **Run workflow** in Actions.
6. Your testing address will look like `https://YOUR-USERNAME.github.io/cgnu-lab-site/`.

Only after reviewing the test address should you point your existing domain at it. **Do not change DNS or cancel Weebly yet.** Your domain registration can remain where it is. When ready, configure the custom domain in GitHub Pages and follow [GitHub's official custom domain instructions](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site). Preserve existing email-related DNS records.

## 7. Technical and accessibility notes

- Quarto native navigation is responsive, with a mobile menu. The no-install browser preview has its own simple mobile menu.
- The animated particles are decorative, use no tracking, and honor `prefers-reduced-motion`. The hero still works without JavaScript.
- Content uses semantic headings and meaningful link text. The contact page links to your accessibility-tagged CV.
- Project artwork and member initials are placeholders, not experimental photography or actual event displays.
- GitHub Pages Actions uses Quarto's official `quarto-dev/quarto-actions/setup@v2` and GitHub's Pages deployment actions.
- This environment did not have the Quarto compiler or network access to download it. The site was checked using static previews and browser tests, but **the initial GitHub Actions build remains the final Quarto compilation check**.

See [Quarto websites](https://quarto.org/docs/websites/), [Quarto page layouts](https://quarto.org/docs/output-formats/page-layout.html), [Quarto on GitHub Pages](https://quarto.org/docs/publishing/github-pages.html), and [GitHub Pages documentation](https://docs.github.com/en/pages).
