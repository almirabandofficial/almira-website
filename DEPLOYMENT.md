# GitHub and Cloudflare Pages deployment review

Nothing has been committed, pushed, or published.

## Recommended repository layout

Use this `almira` folder as the GitHub repository root. Commit `dist/`, `.gitignore`, and this guide. The existing README contains historical implementation notes and can be omitted from the public repository. `.openai/` is legacy Sites metadata; it is ignored and is not needed by Cloudflare Pages.

The public website directory is:

`C:\Users\Orrin\Documents\Codex\2026-09-30\files-pasted-by-the-user-build\outputs\almira\dist`

Do not upload the enclosing chat workspace, `work/`, screenshots, archives, or the local preview server.

## Cloudflare Pages settings

For a GitHub repository whose root is this `almira` folder:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Production branch | main (when creating the repository) |
| Root directory | Leave blank (repository root) |
| Build command | exit 0 |
| Build output directory | dist |
| Environment variables | None |
| Functions / Worker entrypoint | None |

No compilation, dependency installation, package.json, or Node runtime is required to serve this site. `exit 0` is a no-op build command.

## Routing and asset review

- `/` uses `dist/index.html`.
- `/merch` uses `dist/merch/index.html`. Pages directory-index handling may canonicalize to `/merch/`; direct opening and refreshing are supported without the local preview server or a client-side router.
- `/merch` links use origin-root paths, so they work on a Pages domain or a custom domain. This setup assumes deployment at the domain root, not a GitHub Pages repository subdirectory.
- All referenced images, scripts, and styles are included. Fonts are system fonts; no font files or font API are needed.
- Instagram, YouTube, and mailto links contain the configured official destinations.
- Intro, film scratches, and pinned burn/fade run entirely in browser JavaScript; no backend or external animation dependencies are needed.
- Public text source was scanned for localhost URLs, Windows paths, credentials, and private-key markers; none were found. The deliberate public contact email is included.
- No development server, provider manifest, source-map files, or environment files are inside `dist/`.
- `dist/assets/bucky.jpg` is an unused earlier background, not a runtime dependency. It is ordinary image content; remove it from a future publishing copy if you do not want it publicly accessible. It was retained to avoid deleting user artwork during this review.

## Verification limits

All browser scripts passed syntax checks; local asset references were checked for missing files. These checks establish static-host compatibility, not a new end-to-end browser acceptance pass. Prior browser-control timeouts prevented final verification of the homepage merch click and browser Back. The link is a native same-tab `/merch` anchor with click-through decorative overlays; a successful live click/Back check remains recommended before public launch.

## Sources

- https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/configuration/serving-pages/
