import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { settingKey: "airtime_rate" },
    update: {},
    create: {
      settingKey: "airtime_rate",
      settingValue: "0.93",
    },
  });

  console.log("Default airtime rate seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });