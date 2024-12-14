import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { 
        razorpay_payment_id, 
        razorpay_order_id, 
        razorpay_signature 
      } = req.body;

      // Create signature to verify
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(razorpay_order_id + '|' + razorpay_payment_id)
        .digest('hex');

      // Compare signatures
      if (generated_signature === razorpay_signature) {
        // Payment is successful
        // Here you can add additional logic like:
        // - Save order to database
        // - Update inventory
        // - Send confirmation email
        res.status(200).json({ 
          success: true, 
          message: 'Payment verified successfully' 
        });
      } else {
        // Signature mismatch
        res.status(400).json({ 
          success: false, 
          message: 'Payment verification failed' 
        });
      }
    } catch (error) {
      console.error('Payment Verification Error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}