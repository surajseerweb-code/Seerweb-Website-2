
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import parse, { domToReact } from 'html-react-parser';

import { pageData } from '../pageRegistry';
import Navigation from './Navigation';
import Footer from './Footer';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

// Convert original HTML links into React routes
function normalizeHref(href) {
  if (!href) {
    return null;
  }

  const [path, hash = ''] = href.split('#');

  if (!path) {
    return `#${hash}`;
  }

  const file = path.split('/').pop();

  const routeMap = {
    '': '/',
    'seerweb-redesign.html': '/',
  };

  for (const route of Object.keys(pageData)) {
    if (route !== '/') {
      routeMap[
        `seerweb-${route.slice(1)}-redesign.html`
      ] = route;
    }
  }

  if (routeMap[file]) {
    return routeMap[file] + (hash ? `#${hash}` : '');
  }

  return null;
}

// Determine the purpose of a form field
function getLabel(input) {
  const label = input.closest('label');

  return (
    label?.textContent ||
    input.getAttribute('aria-label') ||
    input.getAttribute('placeholder') ||
    ''
  ).toLowerCase();
}

// Submit website enquiry to Express backend
async function submitEnquiry(event) {
  event.preventDefault();

  const form = event.currentTarget;

  const button = form.querySelector(
    '[type="submit"], button'
  );

  const status = form.querySelector(
    '.spa-form-status'
  );

  const data = {
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    source: window.location.pathname,
  };

  // Read the original HTML form fields
  const fields = form.querySelectorAll(
    'input, textarea, select'
  );

  for (const field of fields) {
    const name = (
      field.name || getLabel(field)
    ).toLowerCase();

    const value = field.value.trim();

    if (!value) {
      continue;
    }

    if (/name/.test(name) && !data.name) {
      data.name = value;
    } else if (/mail/.test(name) && !data.email) {
      data.email = value;
    } else if (
      /phone|mobile|contact number/.test(name) &&
      !data.phone
    ) {
      data.phone = value;
    } else if (
      /subject|service|topic|requirement|interest/.test(
        name
      ) &&
      !data.subject
    ) {
      data.subject = value;
    } else if (
      /message|query|comment|detail|description|help/.test(
        name
      ) &&
      !data.message
    ) {
      data.message = value;
    }
  }

  if (!data.message) {
    data.message = data.subject || 'Website enquiry';
  }

  if (!data.name || !data.email) {
    status.textContent =
      'Please provide your name and email.';

    return;
  }

  if (button) {
    button.disabled = true;
  }

  status.textContent = 'Sending…';

  try {
    const response = await fetch(
      `${API_URL}/api/enquiries`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      }
    );

    const result = await response
      .json()
      .catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || 'Could not send enquiry'
      );
    }

    status.textContent =
      'Thank you! Your enquiry was submitted.';

    form.reset();
  } catch (error) {
    status.textContent =
      error.message || 'Something went wrong.';
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

// Render the redesigned HTML as React elements
function RenderContent({ html }) {
  const options = {
    replace(node) {
      if (node.type !== 'tag') {
        return;
      }

      const attributes = node.attribs || {};

      // Convert internal navigation links
      if (node.name === 'a' && attributes.href) {
        const href = normalizeHref(attributes.href);

        if (href && href.startsWith('/')) {
          return (
            <Link
              to={href}
              className={attributes.class || ''}
            >
              {domToReact(node.children || [], options)}
            </Link>
          );
        }
      }

      // Connect HTML forms to the backend
      if (node.name === 'form') {
        return (
          <form
            className={
              (attributes.class || '') +
              ' spa-enquiry-form'
            }
            onSubmit={submitEnquiry}
          >
            {domToReact(node.children || [], options)}

            <p
              role="status"
              className="spa-form-status"
              aria-live="polite"
            />
          </form>
        );
      }
    },
  };

  return <>{parse(html || '', options)}</>;
}

// Display the selected website page
function Page({ data }) {
  useEffect(() => {
    document.title = data.title.replace(
      ' (Redesign Concept)',
      ''
    );
  }, [data]);

  return (
    <>
      <style>{data.css}</style>

      <Navigation />

      <RenderContent html={data.html} />

      <Footer />
    </>
  );
}

// Main website router component
export default function Website() {
  const location = useLocation();

  const data = pageData[location.pathname];

  if (!data) {
    return (
      <div className="notfound">
        <h1>Page not found</h1>

        <Link to="/">Return home</Link>
      </div>
    );
  }

  return (
    <Page
      key={location.pathname}
      data={data}
    />
  );
}
