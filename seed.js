const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
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

  console.log('States seeded: Penang, Kedah, and NS are ready!');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());