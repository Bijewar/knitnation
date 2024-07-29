import Cashfree from 'cashfree-sdk';

let cashfreeInstance;

export function initializeCashfree() {
  if (!cashfreeInstance) {
    try {
      cashfreeInstance = new Cashfree({
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
