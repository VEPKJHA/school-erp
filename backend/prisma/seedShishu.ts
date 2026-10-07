import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedNewSchool() {
  console.log('Creating new school...');
  const school = await prisma.school.upsert({
    where: { code: 'SN01' },
    update: {},
    create: {
      code: 'SN01',
      name: 'Shishu Niketan',
      tagline: 'Empowering the Future',
      email: 'contact@shishuniketan.edu',
      phone: '+91 99 8877 6655',
      board: 'CBSE',
      affiliationNo: 'CBSE/AFF/2026/112233',
      addressLine1: 'Main Road, Block A',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
    },
  });
  console.log('School created:', school.name);

  const baseRoles = [
    { code: 'SCHOOL_ADMIN', name: 'School Administrator', desc: 'Full institutional authority', isSystem: true },
    { code: 'PRINCIPAL', name: 'Principal', desc: 'Academic head', isSystem: false },
    { code: 'ACCOUNTANT', name: 'Accountant', desc: 'Fee collection and financial audits', isSystem: false },
    { code: 'TEACHER', name: 'Teacher / Faculty', desc: 'Class teacher', isSystem: false },
  ];

  const createdRoles = {};
  for (const r of baseRoles) {
    const role = await prisma.role.upsert({
      where: { schoolId_code: { code: r.code, schoolId: school.id } },
      update: {},
      create: {
        code: r.code,
        name: r.name,
        description: r.desc,
        isSystem: r.isSystem,
        schoolId: school.id,
      },
    });
    createdRoles[r.code] = role.id;
  }
  console.log('Roles created for Shishu Niketan.');

  const passwordHash = await bcrypt.hash('Password@123', 10);

  const usersData = [
    { email: 'admin@shishuniketan.edu', firstName: 'Admin', lastName: 'User', roleCode: 'SCHOOL_ADMIN' },
    { email: 'principal@shishuniketan.edu', firstName: 'Niraj', lastName: 'Kumar', roleCode: 'PRINCIPAL' },
    { email: 'accounts@shishuniketan.edu', firstName: 'Accounts', lastName: 'Dept', roleCode: 'ACCOUNTANT' },
    { email: 'teacher@shishuniketan.edu', firstName: 'Class', lastName: 'Teacher', roleCode: 'TEACHER' },
  ];

  for (const u of usersData) {
    const roleId = createdRoles[u.roleCode];
    if (!roleId) continue;
    
    await prisma.user.upsert({
      where: { schoolId_email: { schoolId: school.id, email: u.email } },
      update: {},
      create: {
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        passwordHash,
        roleId,
        schoolId: school.id,
        status: 'ACTIVE',
      },
    });
  }
  console.log('Users created for Shishu Niketan.');
}

seedNewSchool()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
