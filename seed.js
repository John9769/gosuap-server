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
  const adminPassword = await bcrypt.hash('Admin1234!', 10);
  await prisma.user.upsert({
    where: { email: 'admin@gosuap.com' },
    update: {},
    create: {
      name: 'GoSuap Admin',
      email: 'admin@gosuap.com',
      phone: '0100000000',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log('Admin seeded: admin@gosuap.com / Admin1234!');

  // Seed Test Agent
  const agentPassword = await bcrypt.hash('Agent1234!', 10);
  await prisma.user.upsert({
    where: { email: 'agent@gosuap.com' },
    update: {},
    create: {
      name: 'Test Agent',
      email: 'agent@gosuap.com',
      phone: '0111111111',
      password: agentPassword,
      role: 'AGENT',
    },
  });
  console.log('Agent seeded: agent@gosuap.com / Agent1234!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());