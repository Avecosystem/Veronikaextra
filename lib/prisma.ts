import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// For Prisma 7 with Node.js, we need to use direct database connection
// The library will automatically use the correct engine for Node.js environments
const databaseUrl = process.env.DATABASE_URL || 'file:./dev.db';

const prisma = global.prisma || new PrismaClient({
    datasources: {
        db: {
            url: databaseUrl
        }
    }
});

if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
}

export default prisma;
