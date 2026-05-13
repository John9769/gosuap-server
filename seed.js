const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  // Seed States
  const states = [
    { name: 'Penang' },
    { name: 'Kedah' },
    { name: 'Negeri Sembilan' }
  ];

  for (const state of states) {
    await prisma.state.upsert({
      where: { name: state.name },
      update: {},
      create: state,
    });
  }
  console.log('States seeded: Penang, Kedah, NS ready.');

  // Seed Admin User
  const hashedPassword = await bcrypt.hash('Admin1234!', 10);

  await prisma.user.upsert({
    where: { email: 'admin@gosuap.com' },
    update: {},
    create: {
      name: 'GoSuap Admin',
      email: 'admin@gosuap.com',
      phone: '0100000000',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin seeded: admin@gosuap.com / Admin1234!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());