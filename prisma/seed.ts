// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 24 dinner tables...");

  for (let i = 1; i <= 24; i++) {
    await prisma.dinnerTable.upsert({
      where: { tableNumber: i },
      update: {},
      create: {
        tableNumber: i,
        capacity: 10,
        orderedCount: 0,
        status: "COLLECTING",
      },
    });
  }

  console.log("✅ 24 tables created. No menu items seeded — add them via the admin panel.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());