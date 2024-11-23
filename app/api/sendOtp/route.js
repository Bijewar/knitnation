// app/api/sendOtp/route.js
import { NextResponse } from 'next/server';
import nodemailer from "nodemailer";

// Store OTPs temporarily (in production, use Redis or a database)
const otpStore = new Map();

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const createTransporter = () => {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log('Email Config Check:', {
    userConfigured: !!user,
    passConfigured: !!pass,
    userEmail: user
  });

  if (!user || !pass) {
    throw new Error('Email configuration is missing. Please check EMAIL_USER and EMAIL_PASS in your environment variables.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
      user: user,
      pass: pass.replace(/\s+/g, ''), // Remove any whitespace from the app password
    },
    tls: {
      rejectUnauthorized: false // Only use this in development
    }
  });
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const otp = generateOtp();
    
    // Store OTP with timestamp (expires in 10 minutes)
    otpStore.set(email, {
      otp,
      timestamp: Date.now(),
      attempts: 0
    });

    // Create transporter
    const transporter = createTransporter();

    // Email template
    const mailOptions = {
      from: {
        name: "E-Commerce Verification",
        address: process.env.EMAIL_USER
      },
      to: email,
      subject: "Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">Email Verification Code</h2>
          <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0;">
            <h1 style="color: #4CAF50; font-size: 32px; letter-spacing: 2px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666; text-align: center;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 20px;">
            If you didn't request this code, please ignore this email.
          </p>
        </div>
      `
    };

    try {
      // Verify connection
      await transporter.verify();
      console.log('Transporter verification successful');
      
      // Send email
      const info = await transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', info.messageId);

      return NextResponse.json({
        success: true,
        message: "OTP sent successfully",
        debug: `OTP sent to ${email}: ${otp}` // Remove in production
      });

    } catch (error) {
      console.error('Email sending failed:', {
        error: error.message,
        code: error.code,
        command: error.command
      });

      return NextResponse.json(
        { 
          error: "Failed to send email",
          details: error.message,
          recommendations: [
            "Check if the email address is correct",
            "Verify your Gmail App Password",
            "Make sure Less secure app access is enabled in Gmail"
          ]
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}

// Verify OTP endpoint
