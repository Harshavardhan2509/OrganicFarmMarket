import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Configure SQLite WAL mode and busy timeout for concurrent access
prisma.$queryRawUnsafe('PRAGMA journal_mode=WAL;').catch(err => {
  console.error('Failed to set journal_mode to WAL:', err)
})
prisma.$queryRawUnsafe('PRAGMA busy_timeout=5000;').catch(err => {
  console.error('Failed to set busy_timeout:', err)
})

export default prisma
