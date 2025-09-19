// src/lib/auth.js
const KEY = 'auth_token'

export function getToken() {
  // migração: se ainda existir no localStorage, remove
  const legacy = localStorage.getItem(KEY)
  if (legacy) localStorage.removeItem(KEY)
  return sessionStorage.getItem(KEY)
}

export function setToken(token) {
  sessionStorage.setItem(KEY, token)
}

export function clearToken() {
  sessionStorage.removeItem(KEY)
}
