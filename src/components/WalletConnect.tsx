import React, { useState } from 'react';
import { Wallet, LogIn, Mail, Chrome, Shield, Check, X, LogOut, Coins } from 'lucide-react';
import { UserProfile } from '../types';

interface WalletConnectProps {
  user: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onLogout: () => void;
}

export default function WalletConnect({ user, onLogin, onLogout }: WalletConnectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [emailInput, setEmailInput] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const generateSolanaAddress = () => {
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = 'GoalMkt'; // Custom prefix for recognizability
    for (let i = 0; i < 37; i++) {
      address += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return address;
  };

  const handlePrivyLogin = async (method: 'GOOGLE' | 'EMAIL' | 'WALLET', customEmail?: string) => {
    setIsConnecting(true);
    setError('');
    
    // Simulate slight network delay of Privy
    await new Promise((resolve) => setTimeout(resolve, 800));

    const generatedAddress = generateSolanaAddress();
    const mockEmail = method === 'GOOGLE' ? 'freedomdavid47@gmail.com' : (customEmail || 'user@example.com');

    try {
      const response = await fetch('/api/profile/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: generatedAddress,
          email: method !== 'WALLET' ? mockEmail : undefined,
          loginMethod: method,
        }),
      });

      if (!response.ok) throw new Error('Failed to create Privy user profile');

      const profile = await response.json();
      onLogin(profile);
      setIsOpen(false);
      setEmailInput('');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    handlePrivyLogin('EMAIL', emailInput.trim());
  };

  return (
    <div className="relative">
      {!user ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-blue-900/20 active:scale-95 text-sm"
          id="btn-connect-wallet"
        >
          <LogIn className="w-4 h-4" />
          <span>Connect Wallet</span>
        </button>
      ) : (
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 px-4 py-2 rounded-xl transition-all duration-200 cursor-pointer text-left"
            id="btn-profile-dropdown"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-semibold shadow-inner text-sm">
              {user.email ? user.email.slice(0, 2).toUpperCase() : 'W'}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs text-zinc-400 font-medium">USDC Balance</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 inline text-emerald-400" />
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl z-50 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-zinc-900">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-400" />
                  <span>Privy Secured Account</span>
                </h3>
                <button 
                  onClick={() => setShowDropdown(false)} 
                  className="text-zinc-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                {user.email && (
                  <div>
                    <span className="text-xs text-zinc-500 block">Authenticated Email</span>
                    <span className="text-sm text-zinc-200 font-medium block truncate">{user.email}</span>
                  </div>
                )}
                
                <div>
                  <span className="text-xs text-zinc-500 block">Embedded Solana Address</span>
                  <div className="flex items-center justify-between bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 mt-1">
                    <span className="text-xs font-mono text-zinc-300 truncate mr-2">{user.walletAddress}</span>
                    <button 
                      onClick={() => navigator.clipboard.writeText(user.walletAddress)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium whitespace-nowrap"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900 text-center">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Wallet Cash</span>
                    <span className="text-sm font-bold text-emerald-400 block">${user.balance.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-semibold">Active Shares</span>
                    <span className="text-sm font-bold text-blue-400 block">${user.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    onLogout();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-red-400 hover:text-red-300 font-medium py-2 rounded-xl transition-colors duration-200 text-sm mt-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Disconnect Session</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Privy Modal Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl relative">
            
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-zinc-900 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">Privy</h2>
                  <p className="text-xs text-zinc-500">Sign in to GoalMarket</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 hover:text-zinc-200 p-1 bg-zinc-900/50 hover:bg-zinc-900 rounded-lg transition-colors duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {error && (
                <div className="bg-red-950/40 border border-red-900 text-red-400 px-4 py-2.5 rounded-xl text-xs">
                  {error}
                </div>
              )}

              {/* Social Login Options */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => handlePrivyLogin('GOOGLE')}
                  className="w-full flex items-center justify-between bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 text-zinc-100 font-medium px-4 py-3 rounded-xl transition-all duration-200 text-sm cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Chrome className="w-4 text-red-400" />
                    <span>Continue with Google</span>
                  </div>
                  <span className="text-[10px] bg-zinc-950 text-zinc-500 px-1.5 py-0.5 rounded font-semibold uppercase">1-Click</span>
                </button>
              </div>

              {/* Separator */}
              <div className="flex items-center gap-3 text-xs text-zinc-600 my-4">
                <div className="h-px bg-zinc-900 flex-1"></div>
                <span>or email</span>
                <div className="h-px bg-zinc-900 flex-1"></div>
              </div>

              {/* Email Form */}
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-zinc-500" />
                  <input
                    type="email"
                    required
                    disabled={isConnecting}
                    placeholder="Enter your email address"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-zinc-900/50 focus:bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl py-3 pl-11 pr-4 text-sm text-zinc-100 outline-none transition-all duration-200 placeholder-zinc-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isConnecting || !emailInput.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800/50 disabled:text-zinc-400 text-white font-semibold py-3 rounded-xl text-sm transition-all duration-200 active:scale-95"
                >
                  {isConnecting ? 'Initializing secure keys...' : 'Send Login Code'}
                </button>
              </form>

              {/* Standard Web3 Wallet Login Option */}
              <div className="flex items-center gap-3 text-xs text-zinc-600 my-4">
                <div className="h-px bg-zinc-900 flex-1"></div>
                <span>or web3 wallet</span>
                <div className="h-px bg-zinc-900 flex-1"></div>
              </div>

              <button
                type="button"
                disabled={isConnecting}
                onClick={() => handlePrivyLogin('WALLET')}
                className="w-full flex items-center gap-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-100 font-medium px-4 py-3 rounded-xl transition-all duration-200 text-sm cursor-pointer"
              >
                <Wallet className="w-4 h-4 text-indigo-400" />
                <span>Connect Solana Wallet (Phantom / Solflare)</span>
              </button>
            </div>

            {/* Modal Footer */}
            <div className="bg-zinc-900/30 p-4 border-t border-zinc-900/80 text-center">
              <span className="text-[10px] text-zinc-500 flex items-center justify-center gap-1.5 font-medium">
                <Shield className="w-3.5 h-3.5 text-zinc-500" />
                Secured by Privy. Self-custodial embedded wallet automatically generated.
              </span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
