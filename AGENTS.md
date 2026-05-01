# Repository Guidelines

## Project Structure & Module Organization

This repository is a React app for an interactive Ho Chi Minh Thought globe visualization. Application code lives in `src/`, with React components in `src/components/`, shared helpers in `src/utils/`, global state in `src/state.js`, configuration in `src/config.js`, and timeline content in `src/data/hcm_data.json`. Static files and image assets live in `public/`, including `public/image/`. Build and deployment files are at the root: `Dockerfile`, `docker-compose.yml`, `nginx.conf`, and `package.json`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm start`: run the local development server at `http://localhost:3000`.
- `npm run build`: create the production build in `build/`.
- `docker-compose up -d`: build and run the app behind the included Nginx container setup.
- `docker build -t hcm-thought-globe .`: build the Docker image manually.

There is currently no `npm test` script in `package.json`; add one before documenting test automation as a required workflow.

## Coding Style & Naming Conventions

Follow the existing React and JavaScript style. Use 2-space indentation, LF line endings, UTF-8 encoding, final newlines, and trimmed trailing whitespace as defined in `.editorconfig`. Keep components in lowercase file names matching the current pattern, such as `src/components/timeline-bar.js`, and use PascalCase for exported React component names. Prefer focused component changes over broad refactors. ESLint extends React and TypeScript recommended rules, with React prop-types disabled.

## Testing Guidelines

No test files or test runner are currently configured. For new tests, prefer React Testing Library/Jest compatibility with `react-scripts`, place tests next to the code they cover as `*.test.js`, and focus on data rendering, component behavior, and utility functions. Always run `npm run build` before submitting changes because it is the available verification command.

## Commit & Pull Request Guidelines

Recent history uses short imperative messages and occasional Conventional Commit prefixes, for example `feat: Add initial HCM data file` and `Refactor docker-compose.yml for clarity and updates`. Use concise, present-tense messages; prefer `feat:`, `fix:`, `refactor:`, or `docs:` when helpful. Pull requests should include a short summary, verification steps, linked issues when applicable, and screenshots or screen recordings for visible UI changes.

## Agent-Specific Instructions

Make surgical changes only. Do not refactor unrelated components, reformat untouched files, or remove existing assets unless the task explicitly requires it. When changing historical data, preserve the JSON structure in `src/data/hcm_data.json` and verify the app still builds.
