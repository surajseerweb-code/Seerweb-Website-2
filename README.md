# Seerweb MERN Website

A runnable MERN starter built from the **18 supplied Seerweb redesign HTML pages**, preserving their appearance and hover dropdowns. The original page HTML/CSS/JS is hosted under `client/public/pages/` and displayed by a React Router-driven page frame. This is a **transitional integration**, not a component-by-component React rewrite. Admin dashboard is implemented in React. Contact/enquiry forms are connected to the Express/MongoDB API.

## Prerequisites
- Node.js 20+ and npm
- MongoDB Community Server running locally, or a MongoDB Atlas URI

## Run locally
1. `cd server && npm install`
2. Copy `server/.env.example` to `server/.env` and set your own `MONGODB_URI`, a random `JWT_SECRET` (32+ characters), `ADMIN_EMAIL`, and `ADMIN_PASSWORD` (12+ characters).
3. From `server/`: `npm run seed` to create/update the admin and seed initial products/services.
4. From `server/`: `npm run dev` (API on port 5000).
5. In a **second terminal**: `cd client && npm install && npm run dev`.
6. Visit `http://localhost:5173/` and admin at `http://localhost:5173/admin`.

## Features
- 18 supplied redesigned pages, React Router navigation, original Products/Services hover dropdowns
- Contact/enquiry forms send POST `/api/enquiries` and save in MongoDB
- Admin sign-in with bcrypt password hashes and 8-hour JWT tokens
- View enquiries and change status (new/contacted/closed), delete enquiries
- Add/edit/delete products and services in MongoDB (shown in admin and public content API)
- Rate limiting on enquiry and login endpoints, input validation, helmet security headers

## API
- `GET /api/health`
- `POST /api/enquiries` with JSON `{name,email,phone?,topic?,subject?,message,source?}`
- `POST /api/auth/login` with `{email,password}`
- `GET /api/content/products` and `GET /api/content/services`
- Bearer-token protected: `GET /api/admin/:kind`, `POST /api/admin/:kind`, `PUT /api/admin/:kind/:id`, `DELETE /api/admin/:kind/:id`, `PATCH /api/admin/enquiries/:id` (kind = enquiries/products/services, where appropriate)

## Important limitations / deployment notes
- **Product and service page content and menus are still the original static HTML**; admin CRUD updates MongoDB and the content API, but does **not** automatically rewrite the legacy HTML page text. For fully dynamic content, migrate the individual pages to native React components and fetch content from the API.
- The supplied redesign includes demo behavior and external assets (Google Fonts etc.) which may need internet access. Some original CTA/download links may still point to external sites or placeholders.
- The forms submit to the API only when accessed through this app. They require a running API and MongoDB; no email notifications are configured.
- The original HTML homepage form has unnamed inputs; the bridge maps common fields, but custom forms should use explicit `name` attributes.
- No payment gateway, file storage, email service, or production hosting is included. Configure HTTPS, allowed origin, database network access, secrets and backup strategy before deployment.
- Do not commit `server/.env` or real credentials.

## Build frontend
`cd client && npm run build` produces `client/dist/`. Host that folder on a static host with SPA fallback to index.html and serve `/api` through your Node backend. All website routes require an SPA fallback to `index.html`.


## SPA React update
All 18 pages now render as React component trees inside the React Router app, without iframes or HTML page navigation. The original page main sections and CSS are preserved in `client/src/pages/*.json` and converted to React elements by `html-react-parser`. Shared Navigation and Footer are React components. This is an incremental component conversion (content is parsed into React elements), not a manual JSX rewrite of every section.

Client routes: `/`, `/about`, `/products`, `/services`, `/solutions`, `/blog`, `/contact`, `/enquire`, `/download`, `/ai-automation`, `/amc`, `/cloud`, `/datasync`, `/server`, `/support`, `/training`, `/tss`, `/tvu`. Admin: `/admin`.

Enquiry forms send to `/api/enquiries` and require the backend and MongoDB to be running. Set server `.env` and run `npm run seed` with an admin password of at least 12 characters. Never commit secrets or database passwords. Some original static widgets may need additional React-specific enhancements.
