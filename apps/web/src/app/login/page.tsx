'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.accessToken);
      router.push('/dashboard/overview');
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-white">
      <form onSubmit={handleLogin} className="bg-[#131722] p-8 rounded-xl border border-gray-800 shadow-2xl w-96">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-[#f0b90b]">FX<span className="text-white">Platform</span></h1>
          <p className="text-gray-400 text-sm mt-2">Sign in to your account</p>
        </div>
        {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 p-2 rounded">{error}</p>}
        
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={e => setEmail(e.target.value)}
          className="w-full p-3 mb-4 bg-[#0b0e14] border border-gray-700 rounded text-white focus:outline-none focus:border-[#f0b90b]" required 
        />
        
        <div className="relative mb-6">
          <input 
            type={showPassword ? 'text' : 'password'} 
            placeholder="Password" 
            value={password} 
            onChange={e => setPassword(e.target.value)}
            className="w-full p-3 bg-[#0b0e14] border border-gray-700 rounded text-white pr-10 focus:outline-none focus:border-[#f0b90b]" required 
          />
          <button 
            type="button" 
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        
        <button type="submit" className="w-full bg-[#f0b90b] text-black p-3 rounded font-bold hover:bg-yellow-500 transition">
          Sign In
        </button>
        
        <p className="text-center text-sm text-gray-400 mt-4">
          Don't have an account? <a href="/register" className="text-[#f0b90b] hover:underline">Register</a>
        </p>
        <p className="text-center text-sm text-gray-400 mt-2">
          <a href="/" className="text-gray-500 hover:text-white">← Back to Home</a>
        </p>
      </form>
    </div>
  );
}