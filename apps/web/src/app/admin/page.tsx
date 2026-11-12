'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      // Check if the role is correct
      if (data.role !== 'SUPER_ADMIN' && data.role !== 'FINANCE') {
        throw new Error('You do not have administrator privileges.');
      }

      // Save the token
      localStorage.setItem('adminToken', data.accessToken);
      
      // Force redirect
      window.location.href = '/admin/dashboard';
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-white">
      <form onSubmit={handleLogin} className="bg-[#131722] p-8 rounded-xl border border-gray-800 shadow-2xl w-96">
        <div className="flex flex-col items-center mb-6">
          <Shield size={48} className="text-[#f0b90b] mb-2" />
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-500 text-xs mt-1">Restricted Access</p>
        </div>
        
        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
        
        <input 
          type="email" 
          placeholder="Admin Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-[#0b0e14] border border-gray-700 rounded text-white focus:outline-none focus:border-[#f0b90b]" required 
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={e => setPassword(e.target.value)}
          className="w-full p-3 mb-6 bg-[#0b0e14] border border-gray-700 rounded text-white focus:outline-none focus:border-[#f0b90b]" required 
        />
        
        <button type="submit" className="w-full bg-[#f0b90b] hover:bg-yellow-500 text-black p-3 rounded font-bold transition">
          Secure Login
        </button>
      </form>
    </div>
  );
}