import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const admissions = await prisma.admission.findMany();
  console.log("Total admissions in DB:", admissions.length);
  if (admissions.length > 0) {
    console.log("First admission schoolId:", admissions[0].schoolId);
    console.log("First admission status:", admissions[0].status);
  }
}

main().finally(() => prisma.$disconnect());
