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

  console.log("✅ 24 tables created.");

  // Optional: seed sample menu items
  const menuItems = [
    { name: "Jollof Rice", category: "Main Course", quantity: 100, description: "Party jollof with assorted meat" },
    { name: "Fried Rice", category: "Main Course", quantity: 80, description: "Fried rice with vegetables and chicken" },
    { name: "Pasta", category: "Main Course", quantity: 60, description: "Creamy pasta with beef sauce" },
    { name: "Chapman", category: "Drink", quantity: 200, description: "Classic Chapman cocktail" },
    { name: "Zobo", category: "Drink", quantity: 150, description: "Chilled hibiscus drink" },
    { name: "Water", category: "Drink", quantity: 300, description: "Chilled bottled water" },
    { name: "Cake", category: "Dessert", quantity: 120, description: "Celebration layer cake" },
    { name: "Ice Cream", category: "Dessert", quantity: 100, description: "Vanilla and chocolate scoops" },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { id: item.name },
      update: {},
      create: { ...item, isAvailable: true },
    }).catch(() => prisma.menuItem.create({ data: { ...item, isAvailable: true } }));
  }

  console.log("✅ Sample menu items created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
