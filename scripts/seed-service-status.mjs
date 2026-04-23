import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.systemSetting.upsert({
    where: { settingKey: "service_status" },
    update: {},
    create: {
      settingKey: "service_status",
      settingValue: "LIVE",
    },
  });

  await prisma.systemSetting.upsert({
    where: { settingKey: "service_message" },
    update: {},
    create: {
      settingKey: "service_message",
      settingValue: "Airtime service is available.",
    },
  });

  await prisma.systemSetting.upsert({
    where: { settingKey: "airtime_balance" },
    update: {},
    create: {
      settingKey: "airtime_balance",
      settingValue: "0",
    },
  });

  console.log("Service status defaults seeded.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });