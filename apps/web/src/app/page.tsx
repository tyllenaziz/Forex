'use client';
import Link from 'next/link';
import { Shield, Zap, TrendingUp, Wallet, Binary, Activity, CheckCircle } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0e14] text-white font-sans">
      
      {/* TOP NAVIGATION BAR */}
      <nav className="h-16 border-b border-gray-800 flex items-center justify-between px-8 bg-[#131722] sticky top-0 z-50">
        <div className="text-xl font-bold text-[#f0b90b]">FX<span className="text-white">Platform</span></div>
        <div className="flex gap-6 items-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-white">Home</Link>
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white">Trade</Link>
          <div className="flex gap-2 ml-4">
            <Link href="/login" className="text-sm text-gray-400 hover:text-white px-4 py-2">Login</Link>
            <Link href="/register" className="text-sm bg-[#f0b90b] text-black px-4 py-2 rounded font-bold hover:bg-yellow-500 transition">Register</Link>
          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="px-8 py-20 max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1">
          <div className="inline-block bg-[#26a69a]/10 border border-[#26a69a]/30 text-[#26a69a] px-3 py-1 rounded-full text-xs font-bold mb-6">
            Live trading terminal for Forex, Digits, and Binary
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Trade smarter.<br />
            <span className="text-[#f0b90b]">Move faster.</span>
          </h1>
          <p className="text-gray-400 text-lg mb-8 max-w-lg">
            FXPlatform unifies live markets, digit prediction, wallet operations, risk controls, and professional trading tools in one responsive workspace built for desktop and mobile.
          </p>
          <div className="flex gap-4">
            <Link href="/register" className="bg-[#f0b90b] text-black px-6 py-3 rounded font-bold hover:bg-yellow-500 transition">Create Account</Link>
            <Link href="/login" className="bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-6 py-3 rounded font-bold transition">View Live Markets</Link>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-10">
            <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle size={16} className="text-[#26a69a]" /> Segregated wallet flows</div>
            <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle size={16} className="text-[#26a69a]" /> Live market pricing</div>
            <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle size={16} className="text-[#26a69a]" /> Demo and real modes</div>
            <div className="flex items-center gap-2 text-sm text-gray-400"><CheckCircle size={16} className="text-[#26a69a]" /> Mobile-first terminal</div>
          </div>

          <div className="flex gap-8 mt-10 border-t border-gray-800 pt-6">
            <div><div className="text-2xl font-bold">10K+</div><div className="text-xs text-gray-500">Active Traders</div></div>
            <div><div className="text-2xl font-bold">$2M+</div><div className="text-xs text-gray-500">Monthly Volume</div></div>
            <div><div className="text-2xl font-bold">142+</div><div className="text-xs text-gray-500">Countries Served</div></div>
            <div><div className="text-2xl font-bold">&lt;50ms</div><div className="text-xs text-gray-500">Execution Speed</div></div>
          </div>
        </div>
        
        <div className="flex-1 w-full max-w-lg">
          <div className="bg-[#131722] rounded-xl border border-gray-800 p-4 shadow-2xl">
             <div className="flex justify-between text-xs text-gray-500 mb-2"><span>EUR/USD</span><span className="text-[#26a69a]">+0.42%</span></div>
             <div className="h-64 relative flex items-end gap-1">
               {[30, 45, 60, 40, 55, 70, 65, 80, 75, 90, 85, 95].map((h, i) => (
                 <div key={i} className="flex-1 bg-[#26a69a] rounded-t-sm opacity-80" style={{ height: `${h}%` }}></div>
               ))}
             </div>
          </div>
        </div>
      </section>

      {/* EVERYTHING CONNECTS */}
      <section className="bg-[#0e1219] py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-2">Everything Connects</h2>
          <p className="text-gray-400 text-sm mb-12 max-w-2xl">Each part of the platform links into the next: move from balance to market, order, dashboard, and settings without dead ends.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#131722] border border-gray-800 p-6 rounded-xl">
              <TrendingUp className="text-[#f0b90b] mb-4" size={28} />
              <h3 className="font-bold mb-2">Forex Trading</h3>
              <p className="text-sm text-gray-500">Trade major, minor, and exotic pairs with market, limit, and stop orders. Real-time PnL and margin tracking.</p>
            </div>
            <div className="bg-[#131722] border border-gray-800 p-6 rounded-xl">
              <Binary className="text-[#f0b90b] mb-4" size={28} />
              <h3 className="font-bold mb-2">Binary Options</h3>
              <p className="text-sm text-gray-500">Use fixed-risk contracts with clear payout, duration, and settlement status. Visual countdown timers.</p>
            </div>
            <div className="bg-[#131722] border border-gray-800 p-6 rounded-xl">
              <Zap className="text-[#f0b90b] mb-4" size={28} />
              <h3 className="font-bold mb-2">Digit Prediction</h3>
              <p className="text-sm text-gray-500">Predict the last digit of live prices. Even, Odd, Over, Under, and Match with 95% payout.</p>
            </div>
            <div className="bg-[#131722] border border-gray-800 p-6 rounded-xl">
              <Wallet className="text-[#f0b90b] mb-4" size={28} />
              <h3 className="font-bold mb-2">Dynamic Wallets</h3>
              <p className="text-sm text-gray-500">Deposit, withdraw, transfer, and track ledger entries through connected wallet pages. KES to USD conversion.</p>
            </div>
            <div className="bg-[#131722] border border-gray-800 p-6 rounded-xl">
              <Activity className="text-[#f0b90b] mb-4" size={28} />
              <h3 className="font-bold mb-2">Risk Controls</h3>
              <p className="text-sm text-gray-500">Manage exposure with available balance checks, margin call triggers, and session stop-loss limits.</p>
            </div>
            <div className="bg-[#131722] border border-gray-800 p-6 rounded-xl">
              <Shield className="text-[#f0b90b] mb-4" size={28} />
              <h3 className="font-bold mb-2">Account Controls</h3>
              <p className="text-sm text-gray-500">Switch between demo and real mode, review practice funds, and keep trading flows organized.</p>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE MARKET PREVIEW */}
      <section className="py-20 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2 flex items-center gap-2">Live Market Preview <span className="bg-[#26a69a] text-black text-[10px] px-2 py-1 rounded">LIVE</span></h2>
              <p className="text-gray-400 text-sm">Prices refresh automatically from the market data API.</p>
            </div>
            <Link href="/login" className="bg-[#f0b90b] text-black px-4 py-2 rounded font-bold text-sm">Open Terminal</Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { symbol: 'EUR/USD', price: '1.09387', change: '-0.12%', isUp: false },
              { symbol: 'GBP/USD', price: '1.27063', change: '-0.07%', isUp: false },
              { symbol: 'USD/JPY', price: '157.961', change: '+0.13%', isUp: true },
              { symbol: 'BTC/USD', price: '71,916.58', change: '+0.35%', isUp: true },
            ].map((m) => (
              <div key={m.symbol} className="bg-[#131722] border border-gray-800 rounded-xl p-4">
                <div className="flex justify-between text-xs text-gray-400 mb-2">
                  <span className="font-bold text-white">{m.symbol}</span>
                  <span className={m.isUp ? 'text-[#26a69a]' : 'text-red-500'}>{m.change}</span>
                </div>
                <div className="text-2xl font-bold">{m.price}</div>
                <div className="flex items-end gap-1 h-10 mt-3">
                  {[20, 40, 30, 60, 50, 80, 40, 70].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-t-sm ${m.isUp ? 'bg-[#26a69a]' : 'bg-red-500'}`} style={{ height: `${h}%`, opacity: 0.7 }}></div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#0e1219] py-20 text-center px-8">
        <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
        <p className="text-gray-400 text-sm mb-8">Create your account, fund the wallet, and move directly into the trading terminal from any device.</p>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="bg-[#f0b90b] text-black px-6 py-3 rounded font-bold hover:bg-yellow-500">Create Free Account</Link>
          <Link href="/" className="bg-[#2a2e39] text-white px-6 py-3 rounded font-bold hover:bg-[#3a3f4b]">Compare Plans</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-gray-800 py-8 px-8 flex justify-between items-center text-xs text-gray-500">
        <div className="text-lg font-bold text-[#f0b90b]">FX<span className="text-white">Platform</span></div>
        <div className="flex gap-6">
          <Link href="/" className="hover:text-white">Home</Link>
          <Link href="/dashboard" className="hover:text-white">Markets</Link>
          <Link href="/dashboard" className="hover:text-white">Trade</Link>
          <Link href="/login" className="hover:text-white">Dashboard</Link>
        </div>
        <div>© 2026 FXPlatform. All rights reserved.</div>
      </footer>
    </div>
  );
}