# Code structure

- `client/src/main.jsx`: clean React SPA entrypoint and router.
- `client/src/components/Navigation.jsx`: shared navigation and dropdowns.
- `client/src/components/Footer.jsx`: shared footer.
- `client/src/components/Website.jsx`: page renderer, internal links and enquiry submission.
- `client/src/components/Admin.jsx`: admin dashboard, authentication and CRUD.
- `client/src/pageRegistry.js`: route-to-page mapping and menu definitions.
- `client/src/pages/*.json`: original 18 redesigned page sections and CSS (formatted JSON).
- `client/src/style.css`: shared frontend styles.
- `server/src/index.js`: Express API.
- `server/src/models/`: MongoDB schemas.
- `server/src/seed.js`: seed script.

## Architecture note
This version reorganizes and formats the existing SPA source; page bodies are still stored as HTML strings inside JSON and parsed into React elements. They are **not** individually rewritten as native JSX page components. The navigation, footer and admin are React components. Backend and database credentials are not included.
