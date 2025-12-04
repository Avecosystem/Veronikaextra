export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method !== 'POST') { return res.status(405).json({ message: 'Method Not Allowed' }); }

  const appId = process.env.UPI_APP_ID;
  const secretKey = process.env.UPI_SECRET_KEY;
  if (!appId || !secretKey) { return res.status(500).json({ message: 'Server Configuration Error: UPI_APP_ID or UPI_SECRET_KEY missing.' }); }

  try {
    const { orderId, amount, email, name, phone = '9999999999' } = req.body || {};
    if (!orderId || !amount || !email || !name) { return res.status(400).json({ message: 'Invalid request. Missing required fields.' }); }

    const baseUrl = (process.env.PUBLIC_APP_BASE_URL || 'https://veronikaextra-image.onrender.com').replace(/\/$/, '');
    const httpsReturnUrl = `${baseUrl}/#/profile?order_id={order_id}&status={order_status}`;

    const customerId = (email || name || orderId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
    const payload = {
      order_id: orderId,
      order_amount: Number(amount),
      order_currency: 'INR',
      customer_details: {
        customer_id: customerId,
        customer_email: email,
        customer_phone: phone,
        customer_name: name
      },
      order_meta: { return_url: httpsReturnUrl }
    };

    const response = await fetch('https://api.cashfree.com/pg/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': appId,
        'x-client-secret': secretKey,
        'x-api-version': '2022-01-01'
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) { return res.status(500).json({ message: data.message || 'Payment Gateway Error' }); }
    if (data && data.payment_link) { return res.status(200).json({ payLink: data.payment_link }); }
    return res.status(500).json({ message: 'Payment link not returned by gateway.' });
  } catch (error: any) {
    return res.status(500).json({ message: error?.message || 'Unexpected error' });
  }
}
