import { load } from '@cashfreepayments/cashfree-js';

let cashfreeInstance = null;

export const initializeSDK = async () => {
  if (!cashfreeInstance) {
    cashfreeInstance = await load({
      mode: process.env.NEXT_PUBLIC_CASHFREE_MODE || 'sandbox', // Default to sandbox
    });
  }
  return cashfreeInstance;
};
