// User-safe error messages. Technical errors (JSON parse failures when an API
// returns an HTML error page, fetch/network failures, chunk-load errors) must
// NEVER reach the screen — map them to a friendly line instead. Anything else
// is assumed to be one of our own already-friendly API messages.
const TECHNICAL = /unexpected token|not valid json|json\.parse|syntaxerror|failed to fetch|networkerror|load failed|dynamically imported module|importing a module script/i

export function friendlyError(e, fallback = 'Something went wrong. Please try again.') {
  const msg = String(e?.message || e || '')
  if (!msg) return fallback
  if (e instanceof SyntaxError || e instanceof TypeError) return fallback
  if (TECHNICAL.test(msg)) return fallback
  return msg
}
