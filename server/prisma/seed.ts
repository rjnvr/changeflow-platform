import { PrismaClient, ProjectStatus, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { email: "demo@changeflow.dev" },
    update: {},
    create: {
      email: "demo@changeflow.dev",
      firstName: "Demo",
      lastName: "User",
      password: "password123",
      role: UserRole.admin
    }
  });

  await prisma.project.upsert({
    where: { code: "H26-TOWER" },
    update: {},
    create: {
      name: "Harbor 26 Tower",
      code: "H26-TOWER",
      location: "Toronto, ON",
      status: ProjectStatus.active,
      contractValue: 4750000,
      ownerId: user.id
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
