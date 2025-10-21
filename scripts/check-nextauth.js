try {
  const nextAuth = require('next-auth')
  const adapter = require('@next-auth/prisma-adapter')
  console.log('next-auth version:', nextAuth.version || 'unknown')
  console.log('@next-auth/prisma-adapter loaded, type:', typeof adapter)
  process.exit(0)
} catch (e) {
  console.error('error importing next-auth or adapter:', e)
  process.exit(1)
}
