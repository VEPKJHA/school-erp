import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding School Management System database...');

  // 1. Permissions
  const permissionsData = [
    // School Management
    { code: 'school:read', module: 'School', action: 'READ', description: 'View school details' },
    { code: 'school:update', module: 'School', action: 'UPDATE', description: 'Modify school settings' },

    // User & Staff Management
    { code: 'user:create', module: 'User', action: 'CREATE', description: 'Create system users' },
    { code: 'user:read', module: 'User', action: 'READ', description: 'View system users' },
    { code: 'user:update', module: 'User', action: 'UPDATE', description: 'Update system users' },
    { code: 'user:delete', module: 'User', action: 'DELETE', description: 'Deactivate system users' },

    // Academic Sessions
    { code: 'academic:session:create', module: 'AcademicSession', action: 'CREATE', description: 'Create academic session' },
    { code: 'academic:session:read', module: 'AcademicSession', action: 'READ', description: 'View academic sessions' },
    { code: 'academic:session:update', module: 'AcademicSession', action: 'UPDATE', description: 'Update or set current academic session' },

    // Classes
    { code: 'class:create', module: 'Class', action: 'CREATE', description: 'Create academic class' },
    { code: 'class:read', module: 'Class', action: 'READ', description: 'View academic classes' },
    { code: 'class:update', module: 'Class', action: 'UPDATE', description: 'Update academic class' },
    { code: 'class:delete', module: 'Class', action: 'DELETE', description: 'Deactivate academic class' },

    // Sections
    { code: 'section:create', module: 'Section', action: 'CREATE', description: 'Create class section' },
    { code: 'section:read', module: 'Section', action: 'READ', description: 'View class sections' },
    { code: 'section:update', module: 'Section', action: 'UPDATE', description: 'Update class section' },
    { code: 'section:delete', module: 'Section', action: 'DELETE', description: 'Deactivate class section' },

    // Students
    { code: 'student:create', module: 'Student', action: 'CREATE', description: 'Direct student creation' },
    { code: 'student:read', module: 'Student', action: 'READ', description: 'View student profiles & directory' },
    { code: 'student:update', module: 'Student', action: 'UPDATE', description: 'Update student profiles & status' },
    { code: 'student:delete', module: 'Student', action: 'DELETE', description: 'Deactivate student records' },

    // Admissions
    { code: 'admission:create', module: 'Admission', action: 'CREATE', description: 'Submit admission applications' },
    { code: 'admission:read', module: 'Admission', action: 'READ', description: 'Review admission applications' },
    { code: 'admission:approve', module: 'Admission', action: 'APPROVE', description: 'Approve & allot section or reject applications' },

    // Documents
    { code: 'document:create', module: 'Document', action: 'CREATE', description: 'Upload student & admission documents' },
    { code: 'document:read', module: 'Document', action: 'READ', description: 'Download & view student documents' },
    { code: 'document:delete', module: 'Document', action: 'DELETE', description: 'Remove uploaded documents' },

    // Fee Engine (Phase 3)
    { code: 'fee:head:create', module: 'Fee', action: 'CREATE', description: 'Create fee heads' },
    { code: 'fee:head:read', module: 'Fee', action: 'READ', description: 'View fee heads' },
    { code: 'fee:head:update', module: 'Fee', action: 'UPDATE', description: 'Update fee heads' },
    { code: 'fee:head:delete', module: 'Fee', action: 'DELETE', description: 'Deactivate fee heads' },
    { code: 'fee:structure:create', module: 'Fee', action: 'CREATE', description: 'Create fee structures' },
    { code: 'fee:structure:read', module: 'Fee', action: 'READ', description: 'View fee structures' },
    { code: 'fee:structure:update', module: 'Fee', action: 'UPDATE', description: 'Update fee structures' },
    { code: 'fee:assignment:create', module: 'Fee', action: 'CREATE', description: 'Assign fee structures to students' },
    { code: 'fee:assignment:read', module: 'Fee', action: 'READ', description: 'View student fee assignments' },
    { code: 'fee:invoice:create', module: 'Fee', action: 'CREATE', description: 'Generate fee invoices' },
    { code: 'fee:invoice:read', module: 'Fee', action: 'READ', description: 'View student fee invoices' },
    { code: 'fee:payment:create', module: 'Fee', action: 'CREATE', description: 'Collect fee payments and issue receipts' },
    { code: 'fee:payment:read', module: 'Fee', action: 'READ', description: 'View fee payment receipts' },
    { code: 'fee:report:read', module: 'Fee', action: 'READ', description: 'View fee collection reports' },

    // Attendance & Timetable (Phase 4)
    { code: 'attendance:student:create', module: 'Attendance', action: 'CREATE', description: 'Mark student attendance' },
    { code: 'attendance:student:read', module: 'Attendance', action: 'READ', description: 'View student attendance records' },
    { code: 'attendance:student:update', module: 'Attendance', action: 'UPDATE', description: 'Modify marked student attendance' },
    { code: 'attendance:student:report', module: 'Attendance', action: 'REPORT', description: 'Generate attendance reports & registers' },

    { code: 'subject:create', module: 'Subject', action: 'CREATE', description: 'Create academic subjects' },
    { code: 'subject:read', module: 'Subject', action: 'READ', description: 'View academic subjects' },
    { code: 'subject:update', module: 'Subject', action: 'UPDATE', description: 'Update academic subjects' },
    { code: 'subject:delete', module: 'Subject', action: 'DELETE', description: 'Deactivate academic subjects' },

    { code: 'timetable:create', module: 'Timetable', action: 'CREATE', description: 'Create and assign timetable periods' },
    { code: 'timetable:read', module: 'Timetable', action: 'READ', description: 'View class and teacher timetables' },
    { code: 'timetable:update', module: 'Timetable', action: 'UPDATE', description: 'Update timetable schedule slots' },
    { code: 'timetable:delete', module: 'Timetable', action: 'DELETE', description: 'Delete timetable slots' },
  ];

  console.log(`Seeding ${permissionsData.length} permissions...`);
  const permissionsMap = new Map<string, string>();

  for (const perm of permissionsData) {
    const record = await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, module: perm.module, action: perm.action },
      create: perm,
    });
    permissionsMap.set(record.code, record.id);
  }

  // 2. Demo School
  console.log('Seeding Demo School...');
  const school = await prisma.school.upsert({
    where: { code: 'DPGA01' },
    update: {},
    create: {
      code: 'DPGA01',
      name: 'Delhi Public Global Academy',
      tagline: 'Excellence in Holistic Education',
      email: 'contact@dpga.edu',
      phone: '+91 11 2345 6789',
      board: 'CBSE',
      affiliationNo: 'CBSE/AFF/2026/89012',
      addressLine1: 'Plot 12, Institutional Area, Sector 62',
      city: 'Noida',
      state: 'Uttar Pradesh',
      postalCode: '201309',
      country: 'India',
      isActive: true,
    },
  });

  // 3. Roles
  console.log('Seeding Roles...');
  const roleDefs = [
    {
      code: 'SUPER_ADMIN',
      name: 'Super Administrator',
      description: 'Platform Super User with complete system-wide authority',
      schoolId: null,
      isSystem: true,
      allPermissions: true,
    },
    {
      code: 'SCHOOL_ADMIN',
      name: 'School Administrator',
      description: 'Full institutional authority over school operations',
      schoolId: school.id,
      isSystem: true,
      permissions: [
        'school:read', 'school:update',
        'user:create', 'user:read', 'user:update', 'user:delete',
        'academic:session:create', 'academic:session:read', 'academic:session:update',
        'class:create', 'class:read', 'class:update', 'class:delete',
        'section:create', 'section:read', 'section:update', 'section:delete',
        'student:create', 'student:read', 'student:update', 'student:delete',
        'admission:create', 'admission:read', 'admission:approve',
        'document:create', 'document:read', 'document:delete',
        'fee:head:create', 'fee:head:read', 'fee:head:update', 'fee:head:delete',
        'fee:structure:create', 'fee:structure:read', 'fee:structure:update', 'fee:structure:delete',
        'fee:assignment:create', 'fee:assignment:read',
        'fee:invoice:create', 'fee:invoice:read',
        'fee:payment:create', 'fee:payment:read',
        'fee:report:read',
        'attendance:student:create', 'attendance:student:read', 'attendance:student:update', 'attendance:student:report',
        'subject:create', 'subject:read', 'subject:update', 'subject:delete',
        'timetable:create', 'timetable:read', 'timetable:update', 'timetable:delete',
      ],
    },
    {
      code: 'PRINCIPAL',
      name: 'Principal',
      description: 'Academic head and operational supervisor',
      schoolId: school.id,
      isSystem: false,
      permissions: [
        'school:read',
        'user:read',
        'academic:session:read',
        'class:read',
        'section:read',
        'student:read', 'student:update',
        'admission:read', 'admission:approve',
        'document:read',
        'fee:report:read',
        'attendance:student:create', 'attendance:student:read', 'attendance:student:update', 'attendance:student:report',
        'subject:read', 'subject:create', 'subject:update',
        'timetable:read', 'timetable:create', 'timetable:update',
      ],
    },
    {
      code: 'ACCOUNTANT',
      name: 'Accountant',
      description: 'Fee collection, ledger management and financial audits',
      schoolId: school.id,
      isSystem: false,
      permissions: [
        'school:read',
        'class:read',
        'section:read',
        'student:read',
        'fee:head:read',
        'fee:head:create',
        'fee:head:update',
        'fee:structure:read',
        'fee:structure:create',
        'fee:assignment:create',
        'fee:assignment:read',
        'fee:invoice:read',
        'fee:invoice:create',
        'fee:payment:read',
        'fee:payment:create',
        'fee:report:read',
      ],
    },
    {
      code: 'TEACHER',
      name: 'Teacher / Faculty',
      description: 'Class teacher with student roster access',
      schoolId: school.id,
      isSystem: false,
      permissions: [
        'school:read',
        'class:read',
        'section:read',
        'student:read',
        'document:read',
        'attendance:student:create',
        'attendance:student:read',
        'attendance:student:update',
        'attendance:student:report',
        'subject:read',
        'timetable:read',
      ],
    },
    {
      code: 'RECEPTIONIST',
      name: 'Front Desk / Receptionist',
      description: 'Student admission registration and inquiry desk',
      schoolId: school.id,
      isSystem: false,
      permissions: [
        'school:read',
        'class:read',
        'section:read',
        'student:read',
        'admission:create', 'admission:read',
        'document:create', 'document:read',
        'attendance:student:read',
        'timetable:read',
      ],
    },
  ];

  const rolesMap = new Map<string, string>();

  for (const r of roleDefs) {
    let roleRecord;
    if (r.schoolId === null) {
      roleRecord = await prisma.role.findFirst({
        where: { code: r.code, schoolId: null },
      });
      if (!roleRecord) {
        roleRecord = await prisma.role.create({
          data: {
            code: r.code,
            name: r.name,
            description: r.description,
            isSystem: r.isSystem,
            schoolId: null,
          },
        });
      }
    } else {
      roleRecord = await prisma.role.upsert({
        where: {
          schoolId_code: {
            schoolId: r.schoolId,
            code: r.code,
          },
        },
        update: { name: r.name, description: r.description },
        create: {
          code: r.code,
          name: r.name,
          description: r.description,
          isSystem: r.isSystem,
          schoolId: r.schoolId,
        },
      });
    }

    rolesMap.set(r.code, roleRecord.id);

    // Assign permissions
    const permsToAssign: string[] = r.allPermissions
      ? Array.from(permissionsMap.values())
      : (r.permissions || []).map((pCode) => permissionsMap.get(pCode)!).filter(Boolean);

    for (const permId of permsToAssign) {
      await prisma.rolePermission.upsert({
        where: {
          roleId_permissionId: {
            roleId: roleRecord.id,
            permissionId: permId,
          },
        },
        update: {},
        create: {
          roleId: roleRecord.id,
          permissionId: permId,
        },
      });
    }
  }

  // 4. Seed Default Users
  console.log('Seeding Demo Users...');
  const defaultPasswordHash = await bcrypt.hash('Admin@12345', 10);
  const teacherPasswordHash = await bcrypt.hash('Teacher@12345', 10);

  const usersData = [
    {
      email: 'superadmin@schoolerp.com',
      firstName: 'Vikram',
      lastName: 'Singhania',
      roleCode: 'SUPER_ADMIN',
      schoolId: null,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'admin@dpga.edu',
      firstName: 'Rajesh',
      lastName: 'Malhotra',
      roleCode: 'SCHOOL_ADMIN',
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'principal@dpga.edu',
      firstName: 'Dr. Sunita',
      lastName: 'Deshmukh',
      roleCode: 'PRINCIPAL',
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'accountant@dpga.edu',
      firstName: 'Manoj',
      lastName: 'Gupta',
      roleCode: 'ACCOUNTANT',
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
    },
    {
      email: 'teacher@dpga.edu',
      firstName: 'Priyanka',
      lastName: 'Nair',
      roleCode: 'TEACHER',
      schoolId: school.id,
      passwordHash: teacherPasswordHash,
    },
    {
      email: 'receptionist@dpga.edu',
      firstName: 'Neha',
      lastName: 'Kapoor',
      roleCode: 'RECEPTIONIST',
      schoolId: school.id,
      passwordHash: defaultPasswordHash,
    },
  ];

  for (const u of usersData) {
    const roleId = rolesMap.get(u.roleCode)!;
    const existing = await prisma.user.findFirst({
      where: {
        email: u.email,
        schoolId: u.schoolId,
      },
    });

    if (!existing) {
      await prisma.user.create({
        data: {
          email: u.email,
          firstName: u.firstName,
          lastName: u.lastName,
          passwordHash: u.passwordHash,
          roleId,
          schoolId: u.schoolId,
          status: 'ACTIVE',
        },
      });
    }
  }

  // 5. Academic Session
  console.log('Seeding Academic Session...');
  const currentSession = await prisma.academicSession.upsert({
    where: {
      schoolId_name: {
        schoolId: school.id,
        name: '2026-27',
      },
    },
    update: { isCurrent: true, status: 'ACTIVE' },
    create: {
      schoolId: school.id,
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      isCurrent: true,
      status: 'ACTIVE',
    },
  });

  // 6. Classes (Class 1 to 12) & Sections (A, B, C)
  console.log('Seeding Classes 1 to 12 and Sections...');
  const classRecords: any[] = [];
  for (let i = 1; i <= 12; i++) {
    const cls = await prisma.class.upsert({
      where: {
        schoolId_code: {
          schoolId: school.id,
          code: `CLASS-${i}`,
        },
      },
      update: { numericOrder: i },
      create: {
        schoolId: school.id,
        name: `Class ${i}`,
        code: `CLASS-${i}`,
        numericOrder: i,
        description: `Grade ${i} standard curriculum`,
        isActive: true,
      },
    });
    classRecords.push(cls);

    // Create Sections A, B, C for each class
    for (const secName of ['A', 'B', 'C']) {
      await prisma.section.upsert({
        where: {
          classId_name: {
            classId: cls.id,
            name: secName,
          },
        },
        update: {},
        create: {
          schoolId: school.id,
          classId: cls.id,
          name: secName,
          capacity: 40,
          roomNumber: `Room-${i}0${secName}`,
          isActive: true,
        },
      });
    }
  }

  // 7. Seed Initial Sequence Counters
  await prisma.sequenceCounter.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId: school.id,
        entityType: 'ADMISSION',
        year: 2026,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      entityType: 'ADMISSION',
      year: 2026,
      lastValue: 2,
    },
  });

  await prisma.sequenceCounter.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId: school.id,
        entityType: 'STUDENT',
        year: 2026,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      entityType: 'STUDENT',
      year: 2026,
      lastValue: 2,
    },
  });

  await prisma.sequenceCounter.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId: school.id,
        entityType: 'APPLICATION',
        year: 2026,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      entityType: 'APPLICATION',
      year: 2026,
      lastValue: 2,
    },
  });

  await prisma.sequenceCounter.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId: school.id,
        entityType: 'INVOICE',
        year: 2026,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      entityType: 'INVOICE',
      year: 2026,
      lastValue: 0,
    },
  });

  await prisma.sequenceCounter.upsert({
    where: {
      schoolId_entityType_year: {
        schoolId: school.id,
        entityType: 'RECEIPT',
        year: 2026,
      },
    },
    update: {},
    create: {
      schoolId: school.id,
      entityType: 'RECEIPT',
      year: 2026,
      lastValue: 0,
    },
  });

  // 8. Seed Default Fee Heads
  console.log('Seeding Standard Fee Heads...');
  const feeHeadsData = [
    { name: 'Tuition Fee', code: 'TUIT', description: 'Monthly instructional tuition fee', isRefundable: false },
    { name: 'Admission Fee', code: 'ADM', description: 'One-time admission registration charge', isRefundable: false },
    { name: 'Computer & Science Lab', code: 'COMP', description: 'Laboratory, software, and IT infrastructure fee', isRefundable: false },
    { name: 'Sports & Annual Activity', code: 'SPORT', description: 'Athletics, tournaments, and annual day events', isRefundable: false },
    { name: 'Library & Reading Room', code: 'LIB', description: 'Library access and book lending charges', isRefundable: false },
    { name: 'Examination & Assessment', code: 'EXAM', description: 'Term exams, marksheets, and report cards', isRefundable: false },
    { name: 'School Transport Service', code: 'TRANS', description: 'School bus conveyance charges', isRefundable: false },
  ];

  for (const fh of feeHeadsData) {
    await prisma.feeHead.upsert({
      where: {
        schoolId_code: {
          schoolId: school.id,
          code: fh.code,
        },
      },
      update: { name: fh.name, description: fh.description },
      create: {
        schoolId: school.id,
        name: fh.name,
        code: fh.code,
        description: fh.description,
        isRefundable: fh.isRefundable,
        isActive: true,
      },
    });
  }

  // 9. Seed Standard Subjects (Phase 4)
  console.log('Seeding Standard Subjects...');
  const subjectsData = [
    { name: 'English Language & Literature', code: 'ENG', type: 'THEORY' as const, description: 'Core English communication & literature' },
    { name: 'Mathematics', code: 'MATH', type: 'THEORY' as const, description: 'Foundational and advanced mathematics' },
    { name: 'General Science', code: 'SCI', type: 'BOTH' as const, description: 'Integrated Science & Laboratory' },
    { name: 'Social Studies', code: 'SST', type: 'THEORY' as const, description: 'History, Geography, Civics, and Economics' },
    { name: 'Hindi Course', code: 'HIN', type: 'THEORY' as const, description: 'National Language Course' },
    { name: 'Computer Science & AI', code: 'CS', type: 'BOTH' as const, description: 'Programming, IT skills, and computer lab' },
    { name: 'Physics', code: 'PHY', type: 'BOTH' as const, description: 'Senior secondary physics and lab work' },
    { name: 'Chemistry', code: 'CHEM', type: 'BOTH' as const, description: 'Senior secondary chemistry and lab work' },
    { name: 'Biology', code: 'BIO', type: 'BOTH' as const, description: 'Senior secondary biology and lab work' },
    { name: 'Physical & Health Education', code: 'PHE', type: 'PRACTICAL' as const, description: 'Sports, fitness, and health education' },
  ];

  for (const sub of subjectsData) {
    await prisma.subject.upsert({
      where: {
        schoolId_code: {
          schoolId: school.id,
          code: sub.code,
        },
      },
      update: { name: sub.name, type: sub.type, description: sub.description },
      create: {
        schoolId: school.id,
        name: sub.name,
        code: sub.code,
        type: sub.type,
        description: sub.description,
        isActive: true,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
