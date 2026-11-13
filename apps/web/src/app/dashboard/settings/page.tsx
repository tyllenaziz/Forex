'use client';
import { useState } from 'react';
import { Bell, User } from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'PROFILE' | 'NOTIFICATIONS'>('PROFILE');

  return (
    <div className="flex-1 p-4 md:p-8 overflow-y-auto h-full">
      <div className="max-w-4xl mx-auto">
        {/* Tabs Header */}
        <div className="flex bg-[#131722] rounded p-1 border border-gray-800 mb-6 w-full max-w-sm">
          <button
            onClick={() => setActiveTab('PROFILE')}
            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${
              activeTab === 'PROFILE' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('NOTIFICATIONS')}
            className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${
              activeTab === 'NOTIFICATIONS' ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'
            }`}
          >
            Notifications
          </button>
        </div>

        {/* PROFILE TAB */}
        {activeTab === 'PROFILE' && (
          <div className="space-y-6">
            <div className="bg-[#131722] rounded-xl border border-gray-800 p-6 flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-[#f0b90b] flex items-center justify-center text-black font-bold text-2xl">
                JD
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">John Doe</h2>
                <p className="text-sm text-gray-500">Member since January 2024</p>
                <button className="mt-2 bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-4 py-1 rounded text-xs font-bold transition">
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="bg-[#131722] rounded-xl border border-gray-800 p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
                  <input type="text" defaultValue="John Doe" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Username</label>
                  <input type="text" defaultValue="johndoe_trader" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]" />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
                <input type="email" defaultValue="johndoe@example.com" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                  <input type="text" defaultValue="+254 712 345 678" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Country</label>
                  <select className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]">
                    <option>Kenya</option>
                    <option>Nigeria</option>
                    <option>South Africa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-400 mb-1 block">Bio</label>
                <textarea rows={3} defaultValue="Professional forex trader with 5+ years of experience." className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]" />
              </div>

              <button className="bg-[#f0b90b] hover:bg-yellow-500 text-black px-6 py-2 rounded font-bold text-sm transition">
                Save Changes
              </button>
            </div>
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'NOTIFICATIONS' && (
          <div className="space-y-6">
            <div className="bg-[#131722] rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <Bell size={16} className="text-[#f0b90b]" /> Trading Notifications
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Trade Opened', desc: 'When a market order is opened or triggered' },
                  { title: 'Trade Closed', desc: 'When a position closes with profit or loss' },
                  { title: 'TP/SL Hit', desc: 'When take profit or stop loss is triggered' },
                  { title: 'Margin Call Warning', desc: 'When margin level drops below threshold' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                    <div className="w-10 h-6 bg-[#26a69a] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#131722] rounded-xl border border-gray-800 p-6">
              <h3 className="text-sm font-bold text-gray-300 mb-4 flex items-center gap-2">
                <User size={16} className="text-[#26a69a]" /> Financial Notifications
              </h3>
              <div className="space-y-4">
                {[
                  { title: 'Deposit Confirmed', desc: 'When your deposit is successfully processed' },
                  { title: 'Withdrawal Processed', desc: 'When your withdrawal is successfully processed' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800/50 last:border-0">
                    <div>
                      <div className="text-sm font-semibold text-white">{item.title}</div>
                      <div className="text-xs text-gray-500">{item.desc}</div>
                    </div>
                    <div className="w-10 h-6 bg-[#26a69a] rounded-full relative cursor-pointer">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}