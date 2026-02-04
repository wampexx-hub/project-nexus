const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
    const hashedPassword = await bcrypt.hash('testpassword123', 10);

    const user1 = await prisma.user.upsert({
        where: { email: 'test1@example.com' },
        update: {},
        create: {
            username: 'testuser1',
            email: 'test1@example.com',
            password: hashedPassword,
            isAdmin: true,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'test2@example.com' },
        update: {},
        create: {
            username: 'testuser2',
            email: 'test2@example.com',
            password: hashedPassword,
            isAdmin: false,
        },
    });

    console.log({ user1, user2 });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
