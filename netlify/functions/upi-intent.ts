export default async function handler(request: Request) {
  const headers = {
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS,PATCH,DELETE,POST,PUT',
    'Access-Control-Allow-Headers': 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response('', { status: 200, headers });
  }
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), { status: 405, headers });
  }

  const appId = process.env.UPI_APP_ID;
  const secretKey = process.env.UPI_SECRET_KEY;

  if (!appId || !secretKey) {
    return new Response(JSON.stringify({ message: 'Server Configuration Error: UPI_APP_ID or UPI_SECRET_KEY missing.' }), { status: 500, headers });
  }

  try {
    const body = await request.json();
    const { orderId, amount, returnUrl, email, name, phone = '9999999999' } = body || {};

    if (!orderId || !amount || !returnUrl || !email || !name) {
      return new Response(JSON.stringify({ message: 'Invalid request. Missing required fields.' }), { status: 400, headers });
    }

    const customerId = (email || name || orderId).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 45);
    const baseUrl = (process.env.PUBLIC_APP_BASE_URL || 'https://veronikaextra-image.onrender.com').replace(/\/$/, '');
    const httpsReturnUrl = `${baseUrl}/#/profile?order_id={order_id}&status={order_status}`;
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
      order_meta: {
        return_url: httpsReturnUrl
      }
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
    if (!response.ok) {
      return new Response(JSON.stringify({ message: data.message || 'Payment Gateway Error' }), { status: 500, headers });
    }

    if (data && data.payment_link) {
      return new Response(JSON.stringify({ payLink: data.payment_link }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ message: 'Payment link not returned by gateway.' }), { status: 500, headers });
  } catch (error: any) {
    return new Response(JSON.stringify({ message: error?.message || 'Unexpected error' }), { status: 500, headers });
  }
}
