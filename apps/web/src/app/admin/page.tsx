'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://forex-api-dgo5.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      if (data.role !== 'SUPER_ADMIN' && data.role !== 'FINANCE') {
        throw new Error('You do not have administrator privileges.');
      }

      localStorage.setItem('adminToken', data.accessToken);
      
      // Force full page reload to trigger new navigation
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-white p-4">
      <form onSubmit={handleLogin} className="bg-[#131722] p-6 md:p-8 rounded-xl border border-gray-800 shadow-2xl w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <Shield size={40} className="text-[#f0b90b] mb-2" />
          <h1 className="text-xl md:text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-500 text-[10px] mt-1">Restricted Access</p>
        </div>
        
        {error && <p className="text-red-400 text-xs mb-3 bg-red-500/10 p-2 rounded">{error}</p>}
        
        <input 
          type="email" 
          placeholder="Admin Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          className="w-full p-2 mb-3 bg-[#0b0e14] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#f0b90b]" 
          required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          className="w-full p-2 mb-5 bg-[#0b0e14] border border-gray-700 rounded text-white text-sm focus:outline-none focus:border-[#f0b90b]" 
          required 
        />
        
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black p-2.5 rounded font-bold text-sm transition disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Secure Login'}
        </button>
      </form>
    </div>
  );
}