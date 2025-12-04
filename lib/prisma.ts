import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
    var prisma: PrismaClient | undefined;
}

// Configure Prisma for Node.js with explicit datasource
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
