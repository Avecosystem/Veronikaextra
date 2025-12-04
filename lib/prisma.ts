import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// Prisma 7 requires passing an options object (even if empty) when using config file
const prisma = global.prisma || new PrismaClient({});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
