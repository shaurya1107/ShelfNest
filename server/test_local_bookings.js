import express from 'express';
import bookingsRouter from './routes/bookings.js';
import authRouter from './routes/auth.js';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);
app.use('/api/bookings', bookingsRouter);

const server = app.listen(5098, async () => {
  try {
    const loginRes = await fetch('http://localhost:5098/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chandranshi.2327csit@kiet.edu',
        password: 'PassWord123!',
      }),
    });

    const { token } = await loginRes.json();

    console.log('\n--- Local GET /api/bookings?role=borrower ---');
    const borrowerRes = await fetch('http://localhost:5098/api/bookings?role=borrower', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Local Status:', borrowerRes.status);
    const borrowerData = await borrowerRes.json();
    console.log('Local Data:', JSON.stringify(borrowerData, null, 2));

    console.log('\n--- Local GET /api/bookings?role=owner ---');
    const ownerRes = await fetch('http://localhost:5098/api/bookings?role=owner', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Local Status:', ownerRes.status);
    const ownerData = await ownerRes.json();
    console.log('Local Data:', JSON.stringify(ownerData, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    server.close();
    process.exit(0);
  }
});
