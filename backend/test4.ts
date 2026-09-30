import supertest from 'supertest';
import app from './src/app';

async function main() {
  const loginRes = await supertest(app)
    .post('/api/auth/login')
    .send({ email: 'admin@dpga.edu', password: 'Admin@12345', schoolCode: 'DPGA01' });
    
  console.log("Login Status:", loginRes.status);
  console.log("Login Body:", loginRes.body);
  
  if (loginRes.status !== 200) return;
  const token = loginRes.body.data.accessToken;
  
  const admissionsRes = await supertest(app)
    .get('/api/admissions')
    .set('Authorization', `Bearer ${token}`);
    
  console.log("Admissions Status:", admissionsRes.status);
  console.dir(admissionsRes.body, { depth: null });
}

main().catch(console.error);
