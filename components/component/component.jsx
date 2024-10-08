/**
* This code was generated by v0 by Vercel.
* @see https://v0.dev/t/lqn9SugXjsg
* Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
*/

/** Add fonts into your Next.js project:

import { Libre_Franklin } from 'next/font/google'
import { Arimo } from 'next/font/google'

libre_franklin({
  subsets: ['latin'],
  display: 'swap',
})

arimo({
  subsets: ['latin'],
  display: 'swap',
})

To read more about using these font, please visit the Next.js documentation:
- App Directory: https://nextjs.org/docs/app/building-your-application/optimizing/fonts
- Pages Directory: https://nextjs.org/docs/pages/building-your-application/optimizing/fonts
**/
import { Label } from "@/app/api/ui/label"
import { Input } from "@/app/api/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/app/api/ui/select"
import { Button } from "@/app/api/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/app/api/ui/card"
import { Separator } from "@/app/api/ui/separator"

export function Component() {
  return (
    (<div className="container mx-auto max-w-3xl px-4 py-12 md:px-6 md:py-16">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
        <p className="text-muted-foreground">Enter your address and apply any promo codes to complete your order.</p>
      </div>
      <div className="mt-8 grid gap-8 md:grid-cols-2">
        <div className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="John Doe" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address1">Address Line 1</Label>
              <Input id="address1" placeholder="123 Main St" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address2">Address Line 2</Label>
              <Input id="address2" placeholder="Apt 456" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" placeholder="San Francisco" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" placeholder="CA" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zip">Zip Code</Label>
                <Input id="zip" placeholder="94103" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="country">Country</Label>
              <Select id="country">
                <SelectTrigger>
                  <SelectValue placeholder="Select a country" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">United States</SelectItem>
                  <SelectItem value="ca">Canada</SelectItem>
                  <SelectItem value="mx">Mexico</SelectItem>
                  <SelectItem value="gb">United Kingdom</SelectItem>
                  <SelectItem value="au">Australia</SelectItem>
                  <SelectItem value="de">Germany</SelectItem>
                  <SelectItem value="fr">France</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="promo-code">Promo Code</Label>
            <div className="flex gap-2">
              <Input id="promo-code" placeholder="Enter promo code" />
              <Button>Apply</Button>
            </div>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span>$99.99</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Discount</span>
                <span className="text-green-500">-$10.00</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-medium">
                <span>Total</span>
                <span>$89.99</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="mt-8 flex justify-end">
        <Button>Place Order</Button>
      </div>
    </div>)
  );
}
