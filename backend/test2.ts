import { AdmissionService } from './src/services/admission.service';
import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  const school = await prisma.school.findFirst();
  
  const res = await AdmissionService.getAdmissions({ schoolId: school!.id });
  console.dir(res, { depth: null });
}

main().catch(console.error);
