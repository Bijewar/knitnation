// app/api/start-pay/route.js
import { Cashfree } from "cashfree-pg";
import { createOrder } from '../../utils/cashfree-utils';

export async function POST(req) {
   try {
     // Parse request body
     const { orderDetails, userDetails } = await req.json();
     
     // Validate input
     if (!orderDetails || !orderDetails.amount || !orderDetails.currency) {
       return new Response(
         JSON.stringify({ 
           error: 'Missing required order details', 
           details: 'Amount and currency are mandatory' 
         }),
         { status: 400, headers: { 'Content-Type': 'application/json' } }
       );
     }
     
     // Validate user details
     if (!userDetails || !userDetails.userId || !userDetails.email || !userDetails.phoneNumber || !userDetails.fullName) {
       return new Response(
         JSON.stringify({ 
           error: 'Incomplete user details', 
           details: 'User ID, email, phone, and full name are required' 
         }),
         { status: 400, headers: { 'Content-Type': 'application/json' } }
       );
     }
     
     // Set Cashfree credentials
     Cashfree.XClientId = process.env.NEXT_PUBLIC_CASHFREE_APP_ID;
     Cashfree.XClientSecret = process.env.CASHFREE_SECRET_KEY;
     Cashfree.XEnvironment = Cashfree.Environment.SANDBOX;
     
     // Prepare order payload
     const orderPayload = {
       order_id: `order_${Date.now()}`,
       order_amount: Number(orderDetails.amount).toFixed(2),
       order_currency: orderDetails.currency.toUpperCase(),
       customer_details: {
         customer_id: userDetails.userId,
         customer_email: userDetails.email,
         customer_phone: userDetails.phoneNumber,
         customer_name: userDetails.fullName,
       },
       order_meta: {
         return_url: process.env.PAYMENT_RETURN_URL || 'https://yourwebsite.com/payment-return',
         notify_url: process.env.PAYMENT_NOTIFY_URL || 'https://yourwebsite.com/payment-notify'
       }
     };
     
     // Create order using Cashfree PG method
     const orderResponse = await Cashfree.PGCreateOrder("2023-08-01", orderPayload);
     
     // Validate order response
     if (!orderResponse || !orderResponse.data || !orderResponse.data.payment_session_id) {
       console.error('Incomplete order response:', orderResponse);
       return new Response(
         JSON.stringify({ 
           error: 'Failed to generate payment session ID', 
           details: 'Payment gateway did not return required information' 
         }),
         { 
           status: 500, 
           headers: { 'Content-Type': 'application/json' } 
         }
       );
     }
     
     // Return successful response
     return new Response(JSON.stringify({ 
       paymentSessionId: orderResponse.data.payment_session_id,
       orderId: orderPayload.order_id
     }), {
       status: 200,
       headers: { 'Content-Type': 'application/json' }
     });
   } catch (error) {
     // Comprehensive error logging
     console.error('Order Creation Error:', {
       message: error.message,
       stack: error.stack,
       name: error.name
     });
     
     // Return error response
     return new Response(JSON.stringify({ 
       error: 'Internal Server Error', 
       details: error.message 
     }), { 
       status: 500, 
       headers: { 'Content-Type': 'application/json' } 
     });
   }
}