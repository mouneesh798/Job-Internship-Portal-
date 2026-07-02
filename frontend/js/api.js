const API_BASE = 'http://localhost:5000/api';

function getToken() { return localStorage.getItem('token'); }
function getUser() {
    const u = localStorage.getItem('user');
    return u ? JSON.parse(u) : null;
}
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

async function apiRequest(endpoint, method = 'GET', body = null, auth = false) {
    const headers = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = `Bearer ${getToken()}`;

    const res = await fetch(`${API_BASE}${endpoint}`, {
        method, headers, body: body ? JSON.stringify(body) : null
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed.');
    return data;
}

async function apiUpload(endpoint, formData, auth = true) {
    const headers = {};
    if (auth) headers['Authorization'] = `Bearer ${getToken()}`;

    const res = await fetch(`${API_BASE}${endpoint}`, { method: 'POST', headers, body: formData });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Upload failed.');
    return data;
}

function requireAuth(requiredRole) {
    const user = getUser();
    if (!getToken() || !user) {
        window.location.href = 'login.html';
        return null;
    }
    if (requiredRole && user.role !== requiredRole) {
        alert('Access denied for this page.');
        window.location.href = 'index.html';
        return null;
    }
    return user;
}
