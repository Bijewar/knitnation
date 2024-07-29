import Cashfree from 'cashfree-sdk';

let cashfreeInstance;

export function initializeCashfree() {
  if (!cashfreeInstance) {
    try {
      cashfreeInstance = Cashfree({
        env: process.env.NEXT_PUBLIC_CASHFREE_MODE === 'SANDBOX' ? 'TEST' : 'PROD',
        apiVersion: '2022-09-01',
        appId: process.env.NEXT_PUBLIC_CASHFREE_CLIENT_ID,
        secretKey: process.env.CASHFREE_CLIENT_SECRET,
      });

      console.log('Cashfree instance initialized:', cashfreeInstance);
    } catch (error) {
      console.error('Error initializing Cashfree:', error);
      cashfreeInstance = null; // Set cashfree to null if initialization fails
    }
  }
  return cashfreeInstance;
}

export default async function handler(req, res) {
  const cashfree = initializeCashfree();

  if (!cashfree) {
    console.error('Cashfree SDK not initialized correctly');
    res.status(500).json({ error: 'Cashfree SDK not initialized correctly' });
    return;
  }

  if (req.method === 'POST') {
    try {
      const orderDetails = req.body;
      console.log('Order details:', orderDetails);

      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const orderData = {
        orderId: orderId,
        orderAmount: orderDetails.amount, // Replace with actual amount
        orderCurrency: 'INR', // Replace with appropriate currency code
        customerDetails: {
          customerId: orderDetails.customerId || 'default_customer',
          customerEmail: orderDetails.customerEmail || 'customer@example.com',
          customerPhone: orderDetails.customerPhone || '9999999999',
        },
        orderMeta: {
          returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/handle-payment-response?orderId=${orderId}`,
          notifyUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/cashfree-webhook`,
        },
      };

      console.log('Order data sent to Cashfree:', orderData);

      let session;
      try {
        session = await cashfree.orders.createOrders(orderData);
        console.log('Cashfree session response:', session);
      } catch (error) {
        console.error('Error creating payment session:', error);
        throw new Error('Failed to create payment session');
      }

      if (session.status !== 'OK') {
        throw new Error(session.message || 'Failed to create payment session');
      }

      res.status(200).json({ 
        sessionId: session.cfOrderId, // Adjust as per Cashfree's response structure
        orderId: session.orderId, // Adjust as per Cashfree's response structure
        paymentSessionId: session.paymentSessionId, // Adjust as per Cashfree's response structure
      });
    } catch (error) {
      console.error('Error in startpay handler:', error);
      res.status(500).json({ error: 'Failed to create payment session', details: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
