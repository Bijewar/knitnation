export async function PUT(request) {
    try {
      const body = await request.json();
      const { email, otp } = body;
  
      if (!email || !otp) {
        return NextResponse.json(
          { error: "Email and OTP are required" },
          { status: 400 }
        );
      }
  
      const storedData = otpStore.get(email);
      
      if (!storedData) {
        return NextResponse.json(
          { error: "No OTP found for this email" },
          { status: 400 }
        );
      }
  
      // Check if OTP is expired (10 minutes)
      if (Date.now() - storedData.timestamp > 10 * 60 * 1000) {
        otpStore.delete(email);
        return NextResponse.json(
          { error: "OTP has expired" },
          { status: 400 }
        );
      }
  
      // Verify OTP
      if (storedData.otp !== otp) {
        storedData.attempts += 1;
        
        // Lock after 3 failed attempts
        if (storedData.attempts >= 3) {
          otpStore.delete(email);
          return NextResponse.json(
            { error: "Too many failed attempts. Please request a new OTP" },
            { status: 400 }
          );
        }
  
        return NextResponse.json(
          { 
            error: "Invalid OTP",
            remainingAttempts: 3 - storedData.attempts
          },
          { status: 400 }
        );
      }
  
      // Clear the OTP after successful verification
      otpStore.delete(email);
  
      return NextResponse.json({
        success: true,
        message: "OTP verified successfully"
      });
  
    } catch (error) {
      console.error("Verification error:", error);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 }
      );
    }
  }