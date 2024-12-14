"use client";
import { CheckCircle } from 'lucide-react'
import { Button } from "./ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card"
import Link from "next/link"
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import css from '../../style/globals.css'
export default function OrderConfirmation() {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    try {
      // Try to parse the order details from URL query
      const orderDetailsParam = searchParams.get('details');
      
      if (!orderDetailsParam) {
        throw new Error('No order details found');
      }

      // Decode and parse the order details
      const parsedOrderDetails = JSON.parse(decodeURIComponent(orderDetailsParam));

      // Validate the parsed details
      if (!parsedOrderDetails || !parsedOrderDetails.orderNumber) {
        throw new Error('Invalid order details');
      }

      // Set the order details
      setOrderDetails(parsedOrderDetails);
      setLoading(false);
    } catch (err) {
      console.error('Error processing order details:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <p>Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold text-red-700">Order Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600">{error}</p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link href="/">
              <Button>Return to Home</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-3xl font-bold text-green-700">Order Confirmed!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg">Thank you for your purchase.</p>
            <p className="text-gray-600">
              Your order number is <span className="font-semibold">{orderDetails.orderNumber}</span>
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <ul className="space-y-2">
              {orderDetails.items.map((item, index) => (
                <li key={index} className="flex justify-between">
                  <span>{item.quantity}x {item.name}</span>
                  <span>${(item.quantity * item.price).toFixed(2)}</span>
                </li>
              ))}
            </ul>
            <div
              className="mt-4 pt-4 border-t border-gray-200 flex justify-between font-semibold">
              <span>Total</span>
              <span>${orderDetails.total.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-center text-gray-600">
            <p>Estimated delivery date:</p>
            <p className="font-semibold">{orderDetails.estimatedDelivery}</p>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/home">
            <Button>Continue Shopping</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}