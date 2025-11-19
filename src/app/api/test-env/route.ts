import { NextResponse } from 'next/server';

export async function GET() {
  const envCheck = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL ? '✅ Set' : '❌ Missing',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? '✅ Set' : '❌ Missing',
    THREADS_APP_ID: process.env.THREADS_APP_ID ? `✅ Set (${process.env.THREADS_APP_ID?.substring(0, 4)}...)` : '❌ Missing',
    THREADS_APP_SECRET: process.env.THREADS_APP_SECRET ? '✅ Set (****)' : '❌ Missing',
  };

  return NextResponse.json(envCheck);
}
