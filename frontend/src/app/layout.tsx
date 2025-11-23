// frontend/src/app/layout.tsx

'use client'; 

import React, { useState, useEffect } from 'react'; // <-- ADDED useState and useEffect
// Assuming jwt-decode is available in your project for client-side token parsing
import { jwtDecode } from 'jwt-decode'; // <-- ADDED
import { ChatbotFloating } from '../components/ChatbotFloating'; 
import NotificationBell from '../components/NotificationBell'; // <-- ADDED
import ProfileIcon from '../components/ProfileIcon'; // <-- ADDED

// Removed 'export const metadata' block as it conflicts with 'use client'.

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [currentUserId, setCurrentUserId] = useState<string>('');

  // Effect to retrieve user ID from local storage on component mount (client-side)
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        // Decode the token to get the user ID (assuming 'sub' claim holds the ID)
        const decoded: { sub: string } = jwtDecode(token);
        setCurrentUserId(decoded.sub); 
      } catch (e) {
        console.error('Failed to decode token:', e);
      }
    }
  }, []);

  return (
    <html lang="en">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
        <style>
          {`
            body {
              font-family: 'Inter', sans-serif;
            }
            .eco-gradient-text {
              background: linear-gradient(45deg, #4ade80, #16a34a);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
            .eco-button-primary {
              background-color: #22c55e;
              color: white;
              transition: all 0.3s ease;
              font-weight: 600;
            }
            .eco-button-primary:hover {
              background-color: #16a34a;
            }
          `}
        </style>
      </head>
      <body>
        <div className="min-h-screen flex flex-col bg-gray-950">
          <header className="sticky top-0 z-50 bg-gray-900/90 backdrop-blur-lg shadow-lg border-b border-gray-800">
            <div className="flex justify-between items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center space-x-3">
                <div className="text-green-500 w-6 h-6">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z"/>
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  <a href="/" className="hover:text-green-400 transition-colors">
                    Swachh-Vikas
                  </a>
                </h1>
              </div>
              
              {/* --- MODIFIED: Added a container for the Bell, Profile Icon and Navigation Links --- */}
              <div className="flex items-center space-x-4">
                {/* Conditionally render the Bell if a user is logged in (has an ID) */}
                {currentUserId && (
                  <>
                    <NotificationBell userId={currentUserId} />
                    <ProfileIcon />
                  </>
                )}
                
                <nav>
                  <ul className="flex space-x-4 sm:space-x-6">
                    <li><a href="/about" className="text-gray-400 hover:text-green-400 transition-colors font-medium">About</a></li>
                    <li><a href="/services" className="text-gray-400 hover:text-green-400 transition-colors font-medium">Services</a></li>
                    <li><a href="/contact" className="text-gray-400 hover:text-green-400 transition-colors font-medium">Contact</a></li>
                  </ul>
                </nav>
              </div>
              {/* ------------------------------------------------------------------ */}

            </div>
          </header>
          <main className="flex-1 flex flex-col items-center justify-center py-10 px-4 sm:px-6 lg:px-8">
            {children}
          </main>
          
          {/* === Global Floating Chatbot Integration === */}
          <ChatbotFloating />
          
          <footer className="bg-gray-900/90 backdrop-blur-lg text-gray-500 py-6 mt-12 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
              &copy; {new Date().getFullYear()} Swachh-Vikas. All rights reserved. Transforming India's waste management.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
