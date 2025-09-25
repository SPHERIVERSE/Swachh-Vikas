import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // 🔹 Hash default password
  const password = await bcrypt.hash('admin123', 10);

  // 🔹 Create admin user if not exists
  const admin = await prisma.user.upsert({
    where: { email: 'admin@projectgreen.com' },
    update: {},
    create: {
      name: 'Super Admin',
      email: 'admin@projectgreen.com',
      phone: '+911234567890',
      password,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Seeded admin user:', admin.email);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

