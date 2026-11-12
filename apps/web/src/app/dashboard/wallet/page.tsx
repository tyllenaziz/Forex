'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { useAccount } from '@/context/AccountContext';
import Sidebar from '../components/Sidebar';
import { Wallet, CreditCard, Landmark, Download } from 'lucide-react';

export default function WalletPage() {
  const router = useRouter();
  const { mode } = useAccount();
  const [balance, setBalance] = useState<string>('0');
  const [recentTx, setRecentTx] = useState<any[]>([]);
  
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'LEDGER'>('OVERVIEW');

  // --- COMMON STATES ---
  const [amount, setAmount] = useState('100');
  const [paymentMethod, setPaymentMethod] = useState<'MOBILE' | 'CRYPTO' | 'BANK'>('MOBILE');
  
  // --- FORM DETAIL STATES ---
  const [phone, setPhone] = useState('');
  const [cryptoAddress, setCryptoAddress] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  
  // --- TRANSFER STATE ---
  const [recipient, setRecipient] = useState('');

  const fetchWalletData = () => {
    const token = localStorage.getItem('token');
    if (!token) return router.push('/');

    apiFetch(`/api/wallet/balance?mode=${mode}`)
      .then((data) => {
        const prefix = mode === 'DEMO' ? 'DEMO:USER_AVAILABLE' : 'REAL:USER_AVAILABLE';
        const available = data.balances.find((b: any) => b.code.startsWith(prefix));
        setBalance(available ? (Number(available.balance_minor) / 100).toFixed(2) : '0.00');
      });

    apiFetch(`/api/wallet/history?mode=${mode}`)
      .then((data) => setRecentTx(data.transactions));
  };

  useEffect(() => {
    fetchWalletData();
  }, [router, mode]);

    const handleDeposit = async () => {
    // If M-Pesa, convert KES to USD before sending to backend
    const finalAmount = paymentMethod === 'MOBILE' ? parseFloat(amount) / 130 : parseFloat(amount);

    if (finalAmount <= 0) return alert('Invalid amount');

    try {
      await apiFetch('/api/payments/deposit', {
        method: 'POST',
        body: JSON.stringify({ 
          amount: finalAmount, // Send USD to the backend
          accountMode: mode, 
          method: paymentMethod,
          details: { 
            phone, 
            cryptoAddress, 
            bankName, 
            accountNumber, 
            accountName,
            originalAmount: amount, // Save the original KES amount for the admin to see
            originalCurrency: paymentMethod === 'MOBILE' ? 'KES' : 'USD'
          }
        }),
      });
      alert('Deposit request submitted! Please wait for admin approval.');
      setActiveTab('OVERVIEW');
      fetchWalletData();
    } catch (err: any) { alert(err.message); }
  };

  const handleWithdraw = async () => {
    try {
      await apiFetch('/api/payments/withdraw', {
        method: 'POST',
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          accountMode: mode, 
          method: paymentMethod,
          details: { phone, cryptoAddress, bankName, accountNumber, accountName }
        }),
      });
      alert('Withdrawal request submitted for approval!');
      setActiveTab('OVERVIEW');
      fetchWalletData();
    } catch (err: any) { alert(err.message); }
  };

  const handleTransfer = async () => {
    try {
      await apiFetch('/api/payments/transfer', {
        method: 'POST',
        body: JSON.stringify({ amount: parseFloat(amount), accountMode: mode, recipient }),
      });
      alert('Transfer successful!');
      setActiveTab('OVERVIEW');
      fetchWalletData();
    } catch (err: any) { alert(err.message); }
  };

  // Helper to render specific inputs based on method
  const renderPaymentDetails = () => {
    if (paymentMethod === 'MOBILE') {
      return (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1 block">M-Pesa Phone Number</label>
          <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 254712345678" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-[#f0b90b]" />
        </div>
      );
    }
    if (paymentMethod === 'CRYPTO') {
      return (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1 block">Crypto Wallet Address (USDT)</label>
          <input type="text" value={cryptoAddress} onChange={(e) => setCryptoAddress(e.target.value)} placeholder="Enter TRC20/BEP20 address" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-[#f0b90b]" />
        </div>
      );
    }
    if (paymentMethod === 'BANK') {
      return (
        <>
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-1 block">Bank Name</label>
            <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. Equity Bank" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-[#f0b90b]" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-1 block">Account Number</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter bank account" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-[#f0b90b]" />
          </div>
          <div className="mb-4">
            <label className="text-xs text-gray-400 mb-1 block">Account Name</label>
            <input type="text" value={accountName} onChange={(e) => setAccountName(e.target.value)} placeholder="Enter full name on account" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-2 text-white focus:outline-none focus:border-[#f0b90b]" />
          </div>
        </>
      );
    }
  };

  return (
    <div className="flex w-full h-screen bg-[#0b0e14] overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          
          {/* Tabs */}
          <div className="flex bg-[#131722] rounded p-1 border border-gray-800 mb-8 w-full">
            {['OVERVIEW', 'DEPOSIT', 'WITHDRAW', 'TRANSFER', 'LEDGER'].map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab as any); setAmount('100'); }}
                className={`flex-1 py-2 text-xs font-bold rounded transition-colors ${
                  activeTab === tab ? 'bg-[#f0b90b] text-black' : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'OVERVIEW' && (
            <>
              <div className="bg-[#131722] rounded-xl border border-gray-800 p-8 mb-6">
                <div className="text-gray-400 text-sm mb-2">ESTIMATED NET EQUITY ({mode})</div>
                <div className="text-5xl font-bold text-white mb-2">${balance}</div>
                <div className="text-xs text-gray-500">Calculated from live backend wallet balances.</div>
                
                <div className="flex gap-4 mt-6">
                  <button onClick={() => setActiveTab('DEPOSIT')} className="bg-[#f0b90b] hover:bg-yellow-500 text-black px-6 py-2 rounded font-bold text-sm transition">Deposit</button>
                  <button onClick={() => setActiveTab('WITHDRAW')} className="bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-6 py-2 rounded font-bold text-sm transition">Withdraw</button>
                  <button onClick={() => setActiveTab('TRANSFER')} className="bg-[#2a2e39] hover:bg-[#3a3f4b] text-white px-6 py-2 rounded font-bold text-sm transition">Transfer</button>
                </div>
              </div>

              <div className="bg-[#131722] rounded-xl border border-gray-800">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center">
                  <h2 className="text-sm font-bold text-gray-300">RECENT TRANSACTIONS</h2>
                  <button onClick={() => setActiveTab('LEDGER')} className="text-xs text-[#f0b90b] hover:text-yellow-400">View Ledger →</button>
                </div>
                <div className="overflow-x-auto">
                  {recentTx.slice(0, 5).map((tx) => {
                    const amt = Number(tx.amount_minor) / 100;
                    const isPositive = amt >= 0;
                    return (
                      <div key={tx.id} className="flex justify-between items-center p-4 border-b border-gray-800/50">
                         <div>
                           <div className="text-xs font-bold text-gray-300">{tx.txn_type}</div>
                           <div className="text-[10px] text-gray-500">{tx.txn_ref}</div>
                         </div>
                         <div className={`text-sm font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                           {isPositive ? '+' : ''}{amt.toFixed(2)}
                         </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

                    {/* DEPOSIT TAB */}
          {activeTab === 'DEPOSIT' && (
            <div className="max-w-md mx-auto bg-[#131722] rounded-xl border border-gray-800 p-8">
              <h2 className="text-xl font-bold text-white mb-2">DEPOSIT CASHIER</h2>
              <p className="text-xs text-gray-500 mb-6">Fund your Spot Wallet securely.</p>
              
              <div className="flex bg-[#0b0e14] rounded p-1 mb-6 border border-gray-800">
                <button onClick={() => setPaymentMethod('MOBILE')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'MOBILE' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}>M-Pesa</button>
                <button onClick={() => setPaymentMethod('CRYPTO')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'CRYPTO' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}>Crypto</button>
                <button onClick={() => setPaymentMethod('BANK')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'BANK' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}>Bank</button>
              </div>

              {/* M-PESA SPECIFIC UI */}
              {paymentMethod === 'MOBILE' ? (
                <>
                  <div className="mb-4">
                    <label className="text-xs text-gray-400 mb-1 block">Amount to Deposit (KES)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-3 text-gray-500 font-bold">KSh</span>
                      <input 
                        type="number" 
                        value={amount} 
                        onChange={(e) => setAmount(e.target.value)} 
                        className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 pl-12 text-white text-lg font-bold focus:outline-none focus:border-[#f0b90b]" 
                      />
                    </div>
                  </div>

                  <div className="bg-[#0b0e14] border border-[#f0b90b]/30 rounded p-3 mb-6 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold">You will receive</div>
                      <div className="text-xl font-bold text-[#26a69a]">
                        ${(parseFloat(amount || '0') / 130).toFixed(2)} USD
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 text-right">
                      Rate: 1 USD = 130 KES<br/>
                      *Subject to change
                    </div>
                  </div>
                </>
              ) : (
                <div className="mb-4">
                  <label className="text-xs text-gray-400 mb-2 block">Deposit Amount (USD)</label>
                  <input 
                    type="number" 
                    value={amount} 
                    onChange={(e) => setAmount(e.target.value)} 
                    className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white text-lg font-bold focus:outline-none focus:border-[#f0b90b]" 
                  />
                </div>
              )}
              
              {renderPaymentDetails()}

              <button onClick={handleDeposit} className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black py-3 rounded font-bold text-sm transition mt-4">
                Initiate Deposit
              </button>
            </div>
          )}

          {/* WITHDRAW TAB */}
          {activeTab === 'WITHDRAW' && (
            <div className="max-w-md mx-auto bg-[#131722] rounded-xl border border-gray-800 p-8">
              <h2 className="text-xl font-bold text-white mb-2">WITHDRAWAL CASHIER</h2>
              <p className="text-xs text-gray-500 mb-6">Securely request payouts from your Spot Wallet.</p>
              
              <div className="flex justify-between items-center bg-[#0b0e14] border border-gray-800 rounded p-3 mb-6">
                <div>
                  <div className="text-[10px] text-gray-500">Available Balance</div>
                  <div className="text-lg font-bold text-[#26a69a]">${balance}</div>
                </div>
                <button onClick={() => setAmount(balance)} className="text-[10px] bg-gray-700 px-3 py-1 rounded text-white font-bold">WITHDRAW MAX</button>
              </div>

              <div className="flex bg-[#0b0e14] rounded p-1 mb-6 border border-gray-800">
                <button onClick={() => setPaymentMethod('CRYPTO')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'CRYPTO' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}>Crypto</button>
                <button onClick={() => setPaymentMethod('MOBILE')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'MOBILE' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}>M-Pesa</button>
                <button onClick={() => setPaymentMethod('BANK')} className={`flex-1 py-2 text-xs font-bold rounded ${paymentMethod === 'BANK' ? 'bg-[#f0b90b] text-black' : 'text-gray-500'}`}>Bank</button>
              </div>

              <label className="text-xs text-gray-400 mb-2 block">Amount to Payout (USD)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white text-lg font-bold mb-4 focus:outline-none focus:border-[#f0b90b]" />

              {renderPaymentDetails()}

              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Processing Fee (0.5%):</span>
                <span className="text-red-500">${(parseFloat(amount || '0') * 0.005).toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs text-gray-400 mb-6">
                <span>Net Disbursed Amount:</span>
                <span className="text-[#26a69a]">${(parseFloat(amount || '0') * 0.995).toFixed(2)} USD</span>
              </div>

              <button onClick={handleWithdraw} className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black py-3 rounded font-bold text-sm transition">
                Initiate Withdrawal
              </button>
            </div>
          )}

          {/* TRANSFER TAB */}
          {activeTab === 'TRANSFER' && (
            <div className="max-w-md mx-auto bg-[#131722] rounded-xl border border-gray-800 p-8">
              <h2 className="text-xl font-bold text-white mb-2">PLATFORM TRANSFER</h2>
              <p className="text-xs text-gray-500 mb-6">Send USD to another platform user.</p>
              
              <div className="flex justify-between items-center bg-[#0b0e14] border border-gray-800 rounded p-3 mb-6">
                <div>
                  <div className="text-[10px] text-gray-500">Available Balance</div>
                  <div className="text-lg font-bold text-[#26a69a]">${balance}</div>
                </div>
              </div>

              <label className="text-xs text-gray-400 mb-2 block">Recipient Email</label>
              <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Email, username, or phone number" className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white mb-4 focus:outline-none focus:border-[#f0b90b]" />

              <label className="text-xs text-gray-400 mb-2 block">Transfer Amount (USD)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white text-lg font-bold mb-6 focus:outline-none focus:border-[#f0b90b]" />

              <button onClick={handleTransfer} className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black py-3 rounded font-bold text-sm transition">
                Send Transfer
              </button>
            </div>
          )}

          {/* LEDGER TAB */}
          {activeTab === 'LEDGER' && (
            <div className="bg-[#131722] rounded-xl border border-gray-800">
               {/* ... Ledger code from previous step ... */}
               <div className="p-8 text-center text-gray-500">Ledger table goes here...</div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}