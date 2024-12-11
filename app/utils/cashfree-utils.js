import axios from "axios";

export const createOrder = async (orderPayload) => {
   try {
     const response = await axios.post(
       "https://sandbox.cashfree.com/pg/orders",
       orderPayload,
       {
         headers: {
           "Content-Type": "application/json",
           "x-api-version": "2022-01-01",
           "x-client-id": process.env.NEXT_PUBLIC_CASHFREE_APP_ID,
           "x-client-secret": process.env.CASHFREE_SECRET_KEY,
         },
         timeout: 10000 // 10 second timeout
       }
     );

     // Log full response for debugging
     console.log("Order Creation Full Response:", {
       status: response.status,
       data: response.data
     });

     return response.data;
   } catch (error) {
     // Detailed error logging
     console.error("Order Creation Error:", {
       message: error.message,
       response: error.response?.data,
       status: error.response?.status
     });

     throw new Error(
       error.response?.data?.message || 
       "Failed to create order with payment gateway"
     );
   }
};