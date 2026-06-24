// Lightweight override for the floating WhatsApp support button.
// The agent store page (Store.jsx) sets the agent's own support number while it
// is mounted; everywhere else this stays null and the button falls back to the
// default easy support line. Read via useSyncExternalStore in WhatsAppButton.

let current = null
const listeners = new Set()

export function setSupportContact(contact) {
  current = contact || null
  for (const l of listeners) l()
}

export function getSupportContact() {
  return current
}

export function subscribeSupport(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}
