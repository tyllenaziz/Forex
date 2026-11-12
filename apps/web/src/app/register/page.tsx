'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Eye, EyeOff } from 'lucide-react'; // <-- Import Icons

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    country: 'Kenya',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false); // <-- State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await apiFetch('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone,
          country: formData.country,
          password: formData.password,
        }),
      });

            alert('Registration successful! Please log in.');
      router.push('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e14] text-white p-4">
      <form onSubmit={handleRegister} className="bg-[#131722] p-8 rounded-xl border border-gray-800 shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#f0b90b]">FX<span className="text-white">Platform</span></h1>
          <p className="text-gray-400 text-sm mt-2">Create your trading account</p>
        </div>

        {error && <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded mb-4 border border-red-500/20">{error}</div>}

        <div className="space-y-4">
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
            <input 
              type="text" required
              value={formData.fullName} 
              onChange={e => setFormData({...formData, fullName: e.target.value})}
              className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
            <input 
              type="email" required
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})}
              className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
              <input 
                type="text" required
                value={formData.phone} 
                onChange={e => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Country</label>
              <select 
                value={formData.country} 
                onChange={e => setFormData({...formData, country: e.target.value})}
                className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b]"
              >
                <option value="Kenya">Kenya</option>
                <option value="Nigeria">Nigeria</option>
                <option value="South Africa">South Africa</option>
                <option value="Uganda">Uganda</option>
                <option value="Tanzania">Tanzania</option>
              </select>
            </div>
          </div>

          {/* PASSWORD FIELD WITH EYE ICON */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Password</label>
            <div className="relative">
              <input 
                type={showPassword ? 'text' : 'password'} required
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})}
                className="w-full bg-[#0b0e14] border border-gray-700 rounded p-3 text-white focus:outline-none focus:border-[#f0b90b] pr-10"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-6 bg-[#f0b90b] hover:bg-yellow-500 text-black py-3 rounded font-bold transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </button>

                <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account? <Link href="/login" className="text-[#f0b90b] hover:underline">Log In</Link>
        </p>
      </form>
    </div>
  );
}