# 3rd Mainland Biker

A plain HTML, CSS, and JavaScript motorbike game inspired by Third Mainland Bridge in Lagos. Production domain: https://3rdmainland.start.ng.

## Serve the game

Serve **public/** as the web root. **public/index.html** is the entry point. Every game asset and browser module is inside this folder; asset paths are relative. No build, framework, package installation, Workers, or Wrangler configuration is required. Three.js is vendored locally with its MIT license in public/vendor/.

For local testing with Node.js:

```sh
node dev/server.mjs
```

Open http://127.0.0.1:5173/. This optional development server only serves public/. Any ordinary static web server can host the same folder in production.

## Controls

- Desktop: Left/Right or A/D steer, Up accelerates, Down brakes to the starting speed, Space jumps, P/Escape pauses.
- Mobile: touch arrows steer, JUMP jumps, hold ACCELERATE to accelerate, hold BRAKE to slow down. Swiping also steers.
- After winning the race, the first brake press restores normal cruising speed.
- In side view, Space jumps between truck platforms and Down/BRAKE descends faster.
- Jump to grab the plane; press Space/JUMP after clearing the burning truck to drop back down.

The 11 km route includes traffic, a median escape, police pursuit, an oncoming convoy, racers, dispatch riders, an underwater ramp jump, overhead lane puzzles, running sellers, six moving truck types, a plane ride, a turtle and mermaid, and a lightning/puddle challenge. The distance counter reaches zero to win. Names and best scores stay in browser local storage.

## Development checks

```sh
node verify.mjs
node verify-finale.mjs
node dev/verify-static.mjs
```

Debug checkpoints and scene hooks live in dev/ and are not part of the production site. To use them locally:

```sh
node dev/server.mjs --debug
```

Open http://127.0.0.1:5173/debug/. Production serving must expose only public/, not the repository root or dev/.

## Public repository rules

See agents.md. Never commit secrets, credentials, private data, environment files, logs, or browser profiles. Keep private local files ignored. Inspect staged paths and scan for secrets before pushing to main.

## Release version

The landing page displays the release version from package.json. Enable automatic patch increments for commits that change public/ with `git config core.hooksPath dev/git-hooks`. Run `node dev/bump-version.mjs` before local release verification; the hook is idempotent relative to the previous commit. This is a development helper, not a build step. Static hosting still serves public/ directly.
