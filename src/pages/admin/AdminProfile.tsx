import { useState, type FormEvent } from 'react';
import { Mail, Lock, Loader2, Check, User, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function AdminProfile() {
  const { session, updateEmail, updatePassword } = useAuth();
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdSaved, setPwdSaved] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdLoading, setPwdLoading] = useState(false);

  const submitEmail = async (e: FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSaved(false);
    if (!email.trim()) {
      setEmailError('Email cannot be empty');
      return;
    }
    setEmailLoading(true);
    const { error } = await updateEmail(email.trim());
    setEmailLoading(false);
    if (error) {
      setEmailError(error);
    } else {
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 3000);
    }
  };

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSaved(false);
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }
    setPwdLoading(true);
    const { error } = await updatePassword(newPassword);
    setPwdLoading(false);
    if (error) {
      setPwdError(error);
    } else {
      setPwdSaved(true);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwdSaved(false), 3000);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="font-serif text-2xl text-[#1A1A1A] font-semibold">Profile & Security</h1>
        <p className="text-sm text-[#1A1A1A]/50 mt-1">
          Update your admin email and password.
        </p>
      </div>

      {/* Current user info */}
      <div className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#1A1A1A] flex items-center justify-center">
            <User size={22} className="text-[#FAF9F6]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#1A1A1A]">Administrator</p>
            <p className="text-xs text-[#1A1A1A]/50">{session?.user?.email}</p>
          </div>
          <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Shield size={12} /> Active
          </span>
        </div>
      </div>

      {/* Email update */}
      <form onSubmit={submitEmail} className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5 mb-6">
        <h2 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2 mb-4">
          <Mail size={16} /> Update Email Address
        </h2>
        <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Admin Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
        {emailError && <p className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">{emailError}</p>}
        <button
          type="submit"
          disabled={emailLoading}
          className="mt-4 inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-5 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/90 disabled:opacity-50"
        >
          {emailLoading ? <Loader2 size={16} className="animate-spin" /> : emailSaved ? <Check size={16} /> : <Mail size={16} />}
          {emailSaved ? 'Email Updated!' : 'Update Email'}
        </button>
      </form>

      {/* Password update */}
      <form onSubmit={submitPassword} className="bg-white rounded-sm border border-[#1A1A1A]/8 p-5">
        <h2 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2 mb-4">
          <Lock size={16} /> Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs text-[#1A1A1A]/60 mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className={inputClass}
            />
          </div>
        </div>
        {pwdError && <p className="mt-3 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-sm">{pwdError}</p>}
        <button
          type="submit"
          disabled={pwdLoading}
          className="mt-4 inline-flex items-center gap-2 bg-[#1A1A1A] text-[#FAF9F6] px-5 py-2.5 text-sm rounded-sm hover:bg-[#1A1A1A]/90 disabled:opacity-50"
        >
          {pwdLoading ? <Loader2 size={16} className="animate-spin" /> : pwdSaved ? <Check size={16} /> : <Lock size={16} />}
          {pwdSaved ? 'Password Changed!' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

const inputClass =
  'w-full px-3 py-2.5 text-sm bg-[#FAF9F6] border border-[#1A1A1A]/15 rounded-sm focus:outline-none focus:border-[#1A1A1A]';
