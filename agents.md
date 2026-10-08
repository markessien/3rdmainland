# 3rdmainland project instructions

- Production domain: https://3rdmainland.start.ng.
- Game name: 3rd Mainland Biker. Keep the header free of the bridge/Lagos location label and decorative arrow beside the name.
- Keep the game plain HTML, CSS, and JavaScript. Three.js may be used as a local graphics library.
- Do not introduce React, Vite, other frameworks, bundlers, or a build step.
- All publicly served game files belong in `public/`. `public/index.html` is the entry point.
- Use working relative asset and module paths. The public folder must run directly on a static web server without compilation or dependency installation.
- Do not add Cloudflare Workers or Wrangler deployment configuration.
- Support mobile and desktop: responsive layout, touch controls, keyboard controls, resizing, and orientation changes.
- Keep tests, debug menus, local servers, development tools, project memory, credentials, and private files outside `public/`. Production must not expose debug checkpoints.
- This GitHub repository is public. Never commit or push passwords, API keys, tokens, private keys, cookies, environment secrets, personal/private data, logs, or other sensitive files. Never print secret values during checks.
- Keep secrets and private local files ignored. Inspect all staged paths and scan for secrets before every commit or push. If sensitive material is found, stop publication and remove it from the staged changes; do not publish it or overwrite remote history without authorization.
- Verify the game locally, including static asset/module loading, mobile and desktop behavior, and relevant gameplay tests before committing changes.
- Commit and push requested verified changes to the GitHub repository's `main` branch. Confirm the remote commit matches the local commit.
- Preserve the correction-log rules in `.mebasic/instructions.md`; do not rewrite that file unless explicitly requested.

- Do not display gameplay hint or instruction overlays during riding (lane directions, obstacle warnings, control reminders, or acceleration prompts). Keep controls and game stats visible.

- Auto-increment the patch version once per commit containing game changes. Keep package.json and the landing-page version label synchronized using node dev/bump-version.mjs. Enable the repository hook with git config core.hooksPath dev/git-hooks. Do not bump for no-op requests or documentation-only changes. Always state the current completed game version in the final reply.
- Version every CSS entry, JavaScript entry, and local module import URL with the release number. Update these via the release helper so browser/CDN caches cannot mix releases.
