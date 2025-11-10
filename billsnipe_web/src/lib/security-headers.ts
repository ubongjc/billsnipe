export function getSecurityHeaders() {
  const headers = new Headers()

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://*.clerk.accounts.dev",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.clerk.accounts.dev https://api.stripe.com https://*.sentry.io",
    "frame-src 'self' https://*.clerk.accounts.dev https://js.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
  ].join('; ')

  headers.set('Content-Security-Policy', csp)

  // Prevent MIME type sniffing
  headers.set('X-Content-Type-Options', 'nosniff')

  // Enable XSS Protection (legacy browsers)
  headers.set('X-XSS-Protection', '1; mode=block')

  // Prevent clickjacking
  headers.set('X-Frame-Options', 'DENY')

  // Referrer Policy
  headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions Policy
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  )

  // HSTS (HTTP Strict Transport Security)
  // Only enable in production with HTTPS
  if (process.env.NODE_ENV === 'production') {
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  return headers
}

export function applySecurityHeaders(response: Response): Response {
  const newHeaders = new Headers(response.headers)
  const securityHeaders = getSecurityHeaders()

  securityHeaders.forEach((value, key) => {
    newHeaders.set(key, value)
  })

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  })
}
