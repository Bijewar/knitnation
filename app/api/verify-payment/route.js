import axios from 'axios';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), { status: 400 });
    }

    const CASHFREE_APP_ID = process.env.CASHFREE_APP_ID;
    const CASHFREE_SECRET_KEY = process.env.CASHFREE_SECRET_KEY;

    const response = await axios.get(
      `https://sandbox.cashfree.com/pg/orders/${orderId}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-version': '2022-01-01',
          'x-client-id': CASHFREE_APP_ID,
          'x-client-secret': CASHFREE_SECRET_KEY,
        },
      }
    );

    const orderStatus = response.data.order_status;
    
    return new Response(
      JSON.stringify({ 
        status: orderStatus === 'PAID' ? 'SUCCESS' : 'FAILURE',
        details: response.data 
      }), 
      { status: 200 }
    );
  } catch (error) {
    console.error('Payment verification error:', error);
    return new Response(
      JSON.stringify({ error: 'Payment verification failed' }), 
      { status: 500 }
    );
  }
}