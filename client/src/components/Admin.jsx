
import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const initialDraft = {
  title: '',
  slug: '',
  description: '',
};

// Common API function for all admin requests
async function api(path, opts = {}) {
  const token = localStorage.getItem('seerweb_token');

  const response = await fetch(`${API_URL}/api${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(token
        ? { Authorization: `Bearer ${token}` }
        : {}),
      ...opts.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export default function Admin() {
  const [auth, setAuth] = useState(
    !!localStorage.getItem('seerweb_token')
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [items, setItems] = useState([]);
  const [tab, setTab] = useState('enquiries');
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState(initialDraft);

  // Fetch records from the backend
  const refresh = useCallback(async () => {
    try {
      const data = await api(`/admin/${tab}`);

      setItems(data);
      setError('');
    } catch (err) {
      setError(err.message);

      if (
        err.message.toLowerCase().includes('token') ||
        err.message.toLowerCase().includes('unauthorized')
      ) {
        localStorage.removeItem('seerweb_token');
        setAuth(false);
      }
    }
  }, [tab]);

  useEffect(() => {
    if (auth) {
      refresh();
    }
  }, [auth, refresh]);

  // Admin login
  async function login(event) {
    event.preventDefault();
    setError('');

    try {
      const result = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
        }),
      });

      localStorage.setItem('seerweb_token', result.token);

      setAuth(true);
      setPassword('');
    } catch (err) {
      setError(err.message);
    }
  }

  // Create or update product/service
  async function save(event) {
    event.preventDefault();
    setError('');

    try {
      const path = editing
        ? `/admin/${tab}/${editing}`
        : `/admin/${tab}`;

      await api(path, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify(draft),
      });

      setEditing(null);
      setDraft({ ...initialDraft });

      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Delete a record
  async function remove(id) {
    if (!window.confirm('Delete this item?')) {
      return;
    }

    try {
      await api(`/admin/${tab}/${id}`, {
        method: 'DELETE',
      });

      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Update enquiry status
  async function updateStatus(id, status) {
    try {
      await api(`/admin/enquiries/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      await refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  // Populate editor
  function editItem(item) {
    setEditing(item._id);

    setDraft({
      title: item.title || '',
      slug: item.slug || '',
      description: item.description || '',
    });
  }

  // Reset editor
  function cancelEdit() {
    setEditing(null);
    setDraft({ ...initialDraft });
  }

  // Logout
  function logout() {
    localStorage.removeItem('seerweb_token');

    setAuth(false);
    setItems([]);
    setPassword('');
    setError('');
  }

  // Login screen
  if (!auth) {
    return (
      <div className="admin-wrap">
        <form className="panel login" onSubmit={login}>
          <h1>Seerweb Admin</h1>

          <p>Sign in to manage enquiries and content.</p>

          <label>
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
            />
          </label>

          <label>
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
            />
          </label>

          {error && <p className="error">{error}</p>}

          <button type="submit">Sign in</button>

          <Link to="/">← Back to website</Link>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="admin-wrap">
      <div className="admin-head">
        <h1>Seerweb Dashboard</h1>

        <div>
          <Link to="/">View website</Link>{' '}

          <button type="button" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {/* Dashboard tabs */}
      <div className="tabs">
        {['enquiries', 'products', 'services'].map(
          (currentTab) => (
            <button
              type="button"
              key={currentTab}
              className={
                tab === currentTab ? 'active' : ''
              }
              onClick={() => {
                setTab(currentTab);
                setError('');
                cancelEdit();
              }}
            >
              {currentTab}
            </button>
          )
        )}
      </div>

      {error && <p className="error">{error}</p>}

      {/* Product and service editor */}
      {tab !== 'enquiries' && (
        <form className="panel editor" onSubmit={save}>
          <h2>
            {editing ? 'Edit' : 'Add'}{' '}
            {tab.slice(0, -1)}
          </h2>

          {['title', 'slug', 'description'].map(
            (field) => (
              <label key={field}>
                {field}

                <input
                  required={field !== 'description'}
                  value={draft[field] || ''}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      [field]: event.target.value,
                    })
                  }
                />
              </label>
            )
          )}

          <button type="submit">
            {editing ? 'Update' : 'Create'}
          </button>

          {editing && (
            <button
              type="button"
              onClick={cancelEdit}
            >
              Cancel
            </button>
          )}
        </form>
      )}

      {/* Records */}
      <div className="panel">
        <h2>
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
          {' '}({items.length})
        </h2>

        <div className="records">
          {items.map((item) => (
            <article key={item._id}>
              <div>
                <strong>
                  {item.title ||
                    item.name ||
                    'Unnamed'}
                </strong>

                <p>
                  {item.email || item.slug}

                  {item.phone &&
                    ` · ${item.phone}`}
                </p>

                <p>
                  {item.message ||
                    item.description}
                </p>

                <small>
                  {item.createdAt
                    ? new Date(
                        item.createdAt
                      ).toLocaleString()
                    : ''}

                  {item.status
                    ? ` · ${item.status}`
                    : ''}
                </small>
              </div>

              <div className="actions">
                {tab === 'enquiries' ? (
                  <select
                    value={item.status || 'new'}
                    onChange={(event) =>
                      updateStatus(
                        item._id,
                        event.target.value
                      )
                    }
                  >
                    <option value="new">New</option>
                    <option value="contacted">
                      Contacted
                    </option>
                    <option value="closed">
                      Closed
                    </option>
                  </select>
                ) : (
                  <button
                    type="button"
                    onClick={() => editItem(item)}
                  >
                    Edit
                  </button>
                )}

                <button
                  type="button"
                  className="danger"
                  onClick={() => remove(item._id)}
                >
                  Delete
                </button>
              </div>
            </article>
          ))}

          {items.length === 0 && (
            <p>No records yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
