// api/startpay/route.js
import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    // Ensure the request body is read correctly
    const body = await request.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const { amount, currency, receipt } = body;

    const options = {
      amount: amount, // amount in paise
      currency: currency,
      receipt: receipt,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    }, { status: 200 });

  } catch (error) {
    console.error('Razorpay Order Creation Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create order', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method Not Allowed' }, 
    { status: 405 }
  );
}