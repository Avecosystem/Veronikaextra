import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Admin credentials - Updated to user's email
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'ankanbayen@gmail.com';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Ankan@6295';

    // Check if admin exists
    const existingAdmin = await prisma.user.findUnique({ where: { email: ADMIN_EMAIL } });

    if (!existingAdmin) {
        const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

        await prisma.user.create({
            data: {
                email: ADMIN_EMAIL,
                name: 'Ankan Bayen',
                passwordHash,
                credits: 999999,
                isAdmin: true,
                country: 'India'
            }
        });

        console.log(`✅ Admin user created: ${ADMIN_EMAIL}`);
    } else {
        console.log(`ℹ️  Admin user already exists: ${ADMIN_EMAIL}`);
    }

    // Initialize global settings
    const settings = await prisma.globalSettings.findUnique({ where: { id: 1 } });
    if (!settings) {
        await prisma.globalSettings.create({
            data: {
                id: 1,
                globalNotice: '',
                creditsPageNotice: '',
                termsOfService: '',
                privacyPolicy: '',
                socialMediaLinks: '{}',
                creditPlans: '[]',
                contactDetails: '[]'
            }
        });
        console.log('✅ Global settings initialized');
    } else {
        console.log('ℹ️  Global settings already exist');
    }
}

main()
    .catch((e) => {
        console.error('❌ Seeding error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
