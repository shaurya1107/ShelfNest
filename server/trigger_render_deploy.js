async function deploy() {
  const token = 'rnd_2vaPh41XTAKbbshoWi62sX1KKm15';
  
  console.log('Fetching Render services...');
  const res = await fetch('https://api.render.com/v1/services', {
    headers: { Authorization: `Bearer ${token}` },
  });

  const services = await res.json();
  console.log('Services:', JSON.stringify(services, null, 2));

  if (Array.isArray(services) && services.length > 0) {
    const serviceId = services[0].service.id;
    console.log(`\nTriggering deploy for service: ${serviceId}...`);

    const deployRes = await fetch(`https://api.render.com/v1/services/${serviceId}/deploys`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clearCache: 'clear' }),
    });

    const deployData = await deployRes.json();
    console.log('Deploy triggered:', JSON.stringify(deployData, null, 2));
  }
}

deploy();
