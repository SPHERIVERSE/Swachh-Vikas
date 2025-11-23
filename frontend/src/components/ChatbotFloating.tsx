// frontend/src/components/ChatbotFloating.tsx (Final Verified Version)

'use client'; 

import React, { useState, useRef, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance'; 
// NOTE: Make sure your axiosInstance import is correct (default or named)

// --- 1. APP TRAINING CONTEXT (The Most Comprehensive Context for Swavi) ---
const APP_DETAILS_CONTEXT = `
SWACHH-VIKAS: An Integrated, Incentivized Waste Management Ecosystem.
The platform is designed to close the 46% waste treatment gap by enforcing participation from citizens, waste workers, and ULBs. The AI assistant is named Swavi.

USER ROLES & ACCESS:
The application has four roles defined in the schema: ADMIN (ULB), WORKER, CITIZEN, and BUSINESS.
- CITIZEN: Can Report Civic Issues, access gamified features (XP, Level, Leaderboard, Achievements), sell waste in the Marketplace, and access **Training Modules (Flashcards, Videos, Quizzes)**.
- WORKER: Accesses Training, Leaderboard, and a TASKS module for assigned Civic Reports and waste collection routes.
- BUSINESS: Accesses CSR initiatives, manages Drives (waste collection events), and buys waste/places Bids in the Marketplace.
- ADMIN (ULB): Manages all system components including Reports, Assets (Facilities), Users, and Training content.

CORE MODULES & FUNCTIONALITY:
1. MANDATORY TRAINING: Digital Certification & Monitoring. Enforces video training and an AwarenessQuiz model.
2. CIVIC REPORTS / MONITORING: 
    - Report Types: **illegal_dumping, open_toilet, dirty_toilet, overflow_dustbin, dead_animal, fowl, public_bin_request, public_toilet_request.**
    - Report Statuses: Reports follow a workflow: **pending, escalated, assigned (to a Worker), working, resolved.**
    - Citizen Engagement: Citizens can **Support or Oppose** a report to influence its priority (**supportCount, oppositionCount**).
    - Resolution: Workers resolve reports by providing a **resolvedImageUrl (photo proof)** and **resolvedNotes**.
    - Live Asset Tracking (Map): Displays real-time locations of Public Facilities (TOILET, BIN, WASTE_FACILITY) and Worker Locations.
3. INCENTIVES & REWARDS: Citizens earn **XP and points** upon successful, QR-verified pickup of segregated waste. Points are redeemable for vouchers/discounts.
4. MARKETPLACE (Waste-to-Wealth Integration - Bidding System):
    - CITIZENS (Sellers) create Listings of segregated waste (WasteType: PLASTIC, PAPER, METAL, GLASS, ORGANIC, ELECTRONIC, TEXTILE, OTHER).
    - BUSINESSES (Buyers) place Bids (BidStatus: PENDING).
    - CITIZENS (Sellers) can accept Bids (BidStatus: ACCEPTED) to finalize a deal.
`;
// --- END CONTEXT ---


// Simplified Message Type
interface ChatMessage {
  text: string;
  sender: 'user' | 'bot';
}

// Icon for the chat button (using a simple SVG for cleanliness)
const ChatIcon = (props: any) => (
  <svg {...props} className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
  </svg>
);

// Close Icon for the dialog
const CloseIcon = (props: any) => (
    <svg {...props} className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


export const ChatbotFloating = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Use a unique session ID, preferably the authenticated user's ID
  const sessionId = 'guest_user_123'; 

  // Auto-scroll to the latest message
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(scrollToBottom, [messages]);
  
  // Initial welcome message when the component loads
  useEffect(() => {
    // Welcome message updated to reflect the new assistant name
    setMessages([{ 
        text: "Hello! I am Swavi. I can help you with questions about Swachh-Vikas's features, like civic reports, gamified rewards, user roles, and the Marketplace bidding system.", 
        sender: 'bot' 
    }]);
  }, []);


  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const userMessageText = input.trim();
    if (!userMessageText || isLoading) return;

    const newUserMessage: ChatMessage = { text: userMessageText, sender: 'user' };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Pass the highly detailed context with the message
      const response = await axiosInstance.post('/gemini/chat', { 
        message: userMessageText, 
        sessionId: sessionId,
        context: APP_DETAILS_CONTEXT, // <--- Passes the combined knowledge
      });
      
      const botResponse: ChatMessage = { 
        text: response.data.response, 
        sender: 'bot' 
      };
      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Frontend Chat Error:', error);
      setMessages((prev) => [...prev, { text: 'Sorry, the AI is currently unavailable.', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      
      {/* --- Chat Dialog Pop-up --- */}
      {isOpen && (
        <div className="eco-card w-80 h-96 flex flex-col shadow-2xl mb-4 border-2 border-green-700/50">
          {/* Header */}
          <div className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700">
            {/* Header text updated to reflect the new assistant name */}
            <h3 className="text-white font-semibold">Swavi AI</h3> 
            <button 
              onClick={() => setIsOpen(false)} 
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full hover:bg-gray-700"
            >
              <CloseIcon />
            </button>
          </div>
          
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-gray-900/50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                    msg.sender === 'user' 
                      ? 'bg-green-600 text-white rounded-br-none' 
                      : 'bg-gray-700 text-gray-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[75%] px-3 py-2 rounded-xl text-sm bg-gray-700 text-gray-400 animate-pulse">
                    <span className="dot-pulse">...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <form onSubmit={handleSend} className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your question..."
                className="flex-1 px-3 py-2 text-sm bg-gray-700 text-white rounded-lg focus:ring-green-500 focus:border-green-500 border border-gray-600"
                disabled={isLoading}
              />
              <button 
                type="submit" 
                className="eco-button-primary px-3 py-2 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !input.trim()}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- Floating Chat Icon (Button) --- */}
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className={`eco-button-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}
      >
        {isOpen ? <CloseIcon className="w-7 h-7" /> : <ChatIcon className="w-7 h-7" />}
      </button>
    </div>
  );
};
