import { useState, type FormEvent } from 'react';
import { Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouter } from '@/lib/router';

export function AdminLogin() {
  const { signIn } = useAuth();
  const { navigate } = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) {
      setError(error);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="flex flex-col leading-none items-center">
            <span className="font-serif text-3xl tracking-[0.18em] font-semibold text-[#FAF9F6]">
              DHONG GHAR
            </span>
            <span className="text-[0.6rem] tracking-[0.3em] text-[#FAF9F6]/50 mt-1.5">
              ঢং ঘর · ADMIN
            </span>
          </div>
        </div>

        <div className="bg-[#FAF9F6] rounded-sm p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] flex items-center justify-center">
              <Lock size={18} className="text-[#FAF9F6]" />
            </div>
            <div>
              <h1 className="font-serif text-xl text-[#1A1A1A] font-semibold">Admin Sign In</h1>
              <p className="text-xs text-[#1A1A1A]/50">Manage your store</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
                  placeholder="admin@dhongghar.com"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/40" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white border border-[#1A1A1A]/20 rounded-sm focus:outline-none focus:border-[#1A1A1A]"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="text-xs text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] py-3 text-sm tracking-wide hover:bg-[#1A1A1A]/90 transition-colors rounded-sm disabled:opacity-50"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : 'Sign In'}
            </button>
          </form>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 text-xs text-[#FAF9F6]/60 hover:text-[#FAF9F6] transition-colors"
        >
          <ArrowLeft size={12} /> Back to store
        </button>
      </div>
    </div>
  );
}
