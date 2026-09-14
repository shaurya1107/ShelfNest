async function testLive() {
  try {
    console.log('Logging in as Chandranshi (chandranshi.2327csit@kiet.edu)...');
    const loginRes = await fetch('https://shelfnest-api.onrender.com/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'chandranshi.2327csit@kiet.edu',
        password: 'PassWord123!',
      }),
    });

    const loginData = await loginRes.json();
    console.log('Login response status:', loginRes.status);
    if (!loginRes.ok) {
      console.log('Login error data:', loginData);
      return;
    }

    const token = loginData.token;
    console.log('Token received:', token ? 'YES' : 'NO');

    console.log('\nFetching GET /api/bookings?role=borrower from Render...');
    const borrowerRes = await fetch('https://shelfnest-api.onrender.com/api/bookings?role=borrower', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Borrower Bookings Status:', borrowerRes.status);
    const borrowerData = await borrowerRes.json();
    console.log('Borrower Bookings Data:', JSON.stringify(borrowerData, null, 2));

    console.log('\nFetching GET /api/bookings?role=owner from Render...');
    const ownerRes = await fetch('https://shelfnest-api.onrender.com/api/bookings?role=owner', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Owner Bookings Status:', ownerRes.status);
    const ownerData = await ownerRes.json();
    console.log('Owner Bookings Data:', JSON.stringify(ownerData, null, 2));

  } catch (err) {
    console.error('Test error:', err);
  }
}

testLive();
