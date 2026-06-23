const BASE_URL = "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("token")

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || "Terjadi kesalahan")
  }

  return data
}

function get(endpoint) {
  return request(endpoint)
}

function post(endpoint, body) {
  return request(endpoint, { method: "POST", body: JSON.stringify(body) })
}

function put(endpoint, body) {
  return request(endpoint, { method: "PUT", body: JSON.stringify(body) })
}

function patch(endpoint, body) {
  return request(endpoint, { method: "PATCH", body: JSON.stringify(body) })
}

function del(endpoint) {
  return request(endpoint, { method: "DELETE" })
}

export const api = {
  register(body) { return post("/auth/register", body) },
  login(body) { return post("/auth/login", body) },
  me() { return get("/auth/me") },
  get, post, put, patch, delete: del,

  // Admin
  getAdminStats() { return get("/admin/dashboard") },
  getAdminUsers(params) { return get(`/admin/users${params ? `?${params}` : ""}`) },
  deleteAdminUser(id) { return del(`/admin/users/${id}`) },
  getAdminTickets() { return get("/admin/tickets") },
}
