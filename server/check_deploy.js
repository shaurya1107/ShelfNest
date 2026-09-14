async function checkDeploy() {
  const token = 'rnd_2vaPh41XTAKbbshoWi62sX1KKm15';
  const serviceId = 'srv-dajqvdvqj5pc73eoiq0g';

  for (let i = 0; i < 20; i++) {
    const res = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys?limit=1`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const deploys = await res.json();
    if (deploys && deploys[0]) {
      const status = deploys[0].deploy.status;
      console.log(`[Attempt ${i + 1}] Deploy status: ${status}`);
      if (status === 'live') {
        console.log('🎉 RENDER DEPLOY IS LIVE!');
        process.exit(0);
      }
    }
    await new Promise(r => setTimeout(r, 6000));
  }
  console.log('Timed out waiting for deploy.');
  process.exit(1);
}

checkDeploy();
