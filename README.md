# Developer Portfolio Site

A responsive portfolio site built with plain HTML, CSS, and JavaScript. It avoids frontend frameworks so the DOM state, rendering flow, GitHub API integration, form handling, and responsive layout decisions are visible in the source.

The site presents project work while also demonstrating careful client-side behavior: loading states, error handling, rate-limit messaging, theme persistence, form validation, and accessible semantic structure.

https://shannonlee-dev.github.io/developer-portfolio-site/

## Stack

- HTML5 semantic markup
- CSS variables, Flexbox, Grid, responsive layout
- JavaScript ES6+, DOM API, `fetch`, `async`/`await`, `localStorage`
- GitHub REST API
- Formspree contact form integration

## Features

- Responsive navigation
- Dark mode with persisted preference
- GitHub repository cards loaded from the GitHub API
- Language filtering for project cards
- Contact form validation and submit handling
- Scroll-based navigation styling
- Intersection Observer section reveal behavior

## Run

```bash
python3 -m http.server 5500
```

Open `http://localhost:5500`.

## Project Structure

```text
.
├── index.html
├── css/
├── js/
├── images/
├── screenshots/
└── docs/
```

## Implementation Notes

- The page uses semantic sections so the document structure remains clear outside visual styling.
- UI state is held in JavaScript objects and rendered through dedicated functions.
- GitHub API states are separated into loading, success, empty, and error paths.
- Form validation updates field-level errors before submission.
- CSS variables keep color and theme changes centralized.

## Screenshots

- Desktop: `screenshots/desktop.png`
- Mobile: `screenshots/mobile.png`
- Dark mode: `screenshots/dark-mode.png`
