import { PrismaClient } from "@prisma/client"

// use globalThis with an explicit shape so TS doesn't complain about 'global'
type GlobalForPrisma = typeof globalThis & {
  __prisma?: PrismaClient
}

const globalForPrisma = globalThis as GlobalForPrisma

const prisma = globalForPrisma.__prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== "production") globalForPrisma.__prisma = prisma

export default prisma