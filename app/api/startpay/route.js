// pages/api/startpay.js
import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request) {
  try {
    const { orderAmount, customerDetails } = await request.json();

    if (!orderAmount || !customerDetails?.name || !customerDetails?.phone || !customerDetails?.email) {
      return NextResponse.json(
        { error: 'Missing required fields. Ensure orderAmount, name, phone, and email are provided.' },
        { status: 400 }
      );
    }

    const orderData = {
      order_amount: parseFloat(orderAmount),
      order_currency: 'INR',
      order_id: `order_${Date.now()}`,
      customer_details: {
        customer_name: customerDetails.name,
        customer_phone: customerDetails.phone,
        customer_email: customerDetails.email,
      },
      order_meta: {
        return_url: `${process.env.NEXT_PUBLIC_BASE_URL}/order-confirmation`,
        notify_url: `${process.env.NEXT_PUBLIC_BASE_URL}/api/cashfree-webhook`,
      },
    };

    const cashfreeUrl =
      process.env.NEXT_PUBLIC_CASHFREE_MODE === 'PRODUCTION'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

    const response = await axios.post(cashfreeUrl, orderData, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID,
        'x-client-secret': process.env.CASHFREE_CLIENT_SECRET,
        'x-api-version': '2022-09-01',
      
      },
      
    });

    const { payment_session_id, order_id } = response.data;

    return NextResponse.json({ paymentSessionId: payment_session_id, orderId: order_id });
  } catch (error) {
    const errorDetails = error.response?.data || error.message;

    console.error('Cashfree API Error:', errorDetails);

    return NextResponse.json(
      { error: 'Failed to create payment session', details: errorDetails },
      { status: 500 }
    );
  }
}
