'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

export default function FacebookSDK() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // Skip FB status check if not on HTTPS (Facebook requires HTTPS for getLoginStatus)
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Only check FB status on HTTPS or in production
    if (!isHttps && !isProduction) {
      console.log('ℹ️ Facebook login status check skipped (requires HTTPS)');
      return;
    }

    // Wait for Facebook SDK to load
    const checkFBStatus = () => {
      if (typeof window.FB !== 'undefined') {
        window.FB.getLoginStatus(function(response: any) {
          statusChangeCallback(response);
        });
      } else {
        // If FB SDK not loaded yet, try again in 100ms
        setTimeout(checkFBStatus, 100);
      }
    };

    // Only check FB status if user is not already logged in via NextAuth
    if (status === 'unauthenticated') {
      checkFBStatus();
    }
  }, [status]);

  const statusChangeCallback = (response: any) => {
    console.log('Facebook Login Status:', response);
    
    if (response.status === 'connected') {
      // The person is logged into Facebook and has logged into your app
      console.log('✅ Connected to Facebook');
      console.log('Access Token:', response.authResponse.accessToken);
      console.log('User ID:', response.authResponse.userID);
      console.log('Token Expires In:', response.authResponse.expiresIn);
      
      // You could sync this with your NextAuth session if needed
      // For now, we'll let NextAuth handle the authentication flow
      
    } else if (response.status === 'not_authorized') {
      // The person is logged into Facebook, but not your app
      console.log('⚠️ Logged into Facebook, but not authorized for this app');
      
    } else {
      // The person is not logged into Facebook
      console.log('ℹ️ Not logged into Facebook');
    }
  };

  // This component doesn't render anything visible
  return null;
}
