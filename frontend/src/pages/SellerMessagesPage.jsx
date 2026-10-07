import React, { useState } from 'react';
import { MessageSquare, Send, CheckCircle, ShieldCheck, User } from 'lucide-react';

export default function SellerMessagesPage() {
  const [activeChat, setActiveChat] = useState('c-1');
  const [messageInput, setMessageInput] = useState('');

  const chats = [
    {
      id: 'c-1',
      buyerCompany: 'BrightPath Institute',
      buyerName: 'Laxmi Manapure',
      lastMessage: 'Negotiated offer accepted for 30x keyboards & mice package.',
      timeAgo: '10m ago',
      unread: true,
      messages: [
        { sender: 'buyer', text: 'Hi, we submitted a requirement for 30 Keyboards and 30 Mice.', time: '10:30 AM' },
        { sender: 'system', text: '⚡ DealPilot AI Policy Engine generated an optimal offer of ₹87,500 (12.5% discount).', time: '10:31 AM' },
        { sender: 'buyer', text: 'The offer looks good. We accept the lead time of 3 days.', time: '10:40 AM' }
      ]
    },
    {
      id: 'c-2',
      buyerCompany: 'Tech Solutions Pvt. Ltd.',
      buyerName: 'Dr. Rajesh Kumar',
      lastMessage: 'Can you confirm order delivery timeline?',
      timeAgo: '2h ago',
      unread: false,
      messages: [
        { sender: 'buyer', text: 'Can you confirm order delivery timeline for order #DP-ORD-882190?', time: '08:15 AM' },
        { sender: 'seller', text: 'Hello Rajesh, your order is processed and will ship within 3 business days.', time: '08:30 AM' }
      ]
    }
  ];

  const currentChat = chats.find(c => c.id === activeChat) || chats[0];

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!messageInput.trim()) return;
    currentChat.messages.push({
      sender: 'seller',
      text: messageInput.trim(),
      time: 'Just now'
    });
    setMessageInput('');
  };

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-8 py-8 space-y-6 font-sans">
      
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Messages & Buyer Desk</h1>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Direct B2B communication with buyers and AI negotiation session logs
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[500px]">
        
        {/* Left Conversations Sidebar */}
        <div className="border-r border-slate-100 p-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">Conversations</h3>
          <div className="space-y-1">
            {chats.map(chat => (
              <button
                key={chat.id}
                onClick={() => setActiveChat(chat.id)}
                className={`w-full text-left p-3 rounded-2xl transition-all ${
                  activeChat === chat.id ? 'bg-blue-50 border border-blue-100' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">{chat.buyerCompany}</span>
                  <span className="text-[10px] text-slate-400">{chat.timeAgo}</span>
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-1">{chat.lastMessage}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Active Chat Panel */}
        <div className="md:col-span-2 flex flex-col justify-between p-6 bg-slate-50/50">
          
          {/* Chat Header */}
          <div className="border-b border-slate-200/80 pb-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                {currentChat.buyerCompany.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{currentChat.buyerCompany}</h4>
                <div className="text-[11px] text-slate-500">Contact: {currentChat.buyerName}</div>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Active Negotiation
            </span>
          </div>

          {/* Messages Thread */}
          <div className="flex-1 py-6 space-y-3 overflow-y-auto max-h-[350px]">
            {currentChat.messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.sender === 'seller' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3.5 rounded-2xl text-xs space-y-1 ${
                  m.sender === 'seller'
                    ? 'bg-blue-600 text-white rounded-br-none shadow-xs'
                    : m.sender === 'system'
                    ? 'bg-purple-50 border border-purple-200 text-purple-900 rounded-2xl w-full'
                    : 'bg-white border border-slate-200 text-slate-900 rounded-bl-none shadow-2xs'
                }`}>
                  <p>{m.text}</p>
                  <span className={`text-[10px] block text-right ${m.sender === 'seller' ? 'text-blue-100' : 'text-slate-400'}`}>
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="pt-4 border-t border-slate-200/80 flex items-center space-x-3">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Type your message or policy clarification..."
              className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="submit"
              className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
}
