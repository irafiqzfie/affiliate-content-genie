const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Create the dev user for local development
  const devUser = await prisma.user.upsert({
    where: { id: 'dev-user-localhost' },
    update: {},
    create: {
      id: 'dev-user-localhost',
      name: 'Dev User',
      email: 'dev@localhost',
    },
  })

  console.log('✅ Dev user created/verified:', devUser)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
