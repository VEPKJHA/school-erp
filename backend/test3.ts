import { PrismaClient } from "@prisma/client";
import { AuthService } from "./src/services/auth.service";
import express from 'express';
import supertest from 'supertest';
import app from './src/app';
import jwt from 'jsonwebtoken';

async function main() {
  const prisma = new PrismaClient();
  const school = await prisma.school.findFirst();
  const user = await prisma.user.findFirst({ where: { email: 'admin@dpga.edu' } });
  
  // Create token
  const token = jwt.sign(
    { userId: user!.id, email: user!.email, roleCode: user!.roleCode, schoolId: user!.schoolId },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: '1h' }
  );
  
  const res = await supertest(app)
    .get('/api/admissions')
    .set('Authorization', `Bearer ${token}`);
    
  console.log("Status:", res.status);
  console.dir(res.body, { depth: null });
}

main().catch(console.error);
