# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

A Jekyll-based personal portfolio site deployed to `sunmeet.ca` via GitHub Pages. The repo also contains a secondary project: an interior design dashboard for an apartment at Zwyssigstrasse 11, Zürich. These two sub-sites share the same repository and deployment.

## Commands

```bash
# Serve locally (hot reload, localhost:4000)
jekyll serve

# Build for production
jekyll build
```

No test suite, no linter, no package manager. Deployment happens automatically on push to the default branch via GitHub Pages.

## Architecture

### Two distinct sub-sites, two design systems

**Home page** (`index.html`): Dark/cyber aesthetic — charcoal background, gold accents, animated starfield, glass-morphism cards. Five content sections: identity, bio, investment thesis, interests, contact. Includes a hidden Marvin (Paranoid Android) floating Easter egg.

**Interior design dashboard** (`design/index.html`): Warm, minimal palette — sand, sage, bronze. A project-management dashboard for the apartment renovation: tracks five workstreams, budget, and room-by-room furniture sourcing checklists.

### Layouts

- `_layouts/default.html` — wraps the home page
- `_layouts/design.html` — wraps the design dashboard
- Jekyll `_config.yml` sets the `minima` theme, but both layouts are fully custom; the theme's CSS is essentially overridden.

### Data files (design project)

- `design/layout.yml` — semantic apartment layout: room names, dimensions in cm, SVG bounding-box pixel coords, wall orientations, adjacent spaces, fixed elements, windows
- `design/furniture.yml` — per-room furniture: x/y placement in cm from room origin, dimensions, type, status (`purchased` / `planned` / `considering`)

The dashboard HTML reads these YAML files via Jekyll Liquid to render room cards and furniture checklists. When adding or moving furniture, edit `furniture.yml`, not the HTML directly.

### CSS

All styles are inlined in each HTML file (no external stylesheets). CSS variables are declared at the top of each `<style>` block and define the color and spacing system for that page. There are no shared stylesheets between the two sub-sites.

## Known Issues

`index.html` contains an unresolved git merge conflict (look for `<<<<<<< HEAD` around lines 100–125). This should be resolved before any further work on the home page.

## Study Materials (root level)

The repository root also contains Zürich naturalization study materials (`grundkenntnis.pdf`, `grundkenntnis_questions.pdf`, `grundkenntnis.txt`) — these are reference documents, not part of the website build.
