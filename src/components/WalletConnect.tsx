import React, { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Wallet, LogIn, Mail, Check, LogOut, Coins, RefreshCw, Sparkles, Copy, ChevronDown, User } from 'lucide-react';
import { UserProfile } from '../types';

interface WalletConnectProps {
  user: UserProfile | null;
  onLogin: (profile: UserProfile) => void;
  onLogout: () => void;
}

export default function WalletConnect({ user, onLogin, onLogout }: WalletConnectProps) {
  const { login, logout, authenticated } = usePrivy();
  const [showDropdown, setShowDropdown] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [fundSuccess, setFundSuccess] = useState(false);

  // Auto-close dropdown when clicking outside
  useEffect(() => {
    if (!showDropdown) return;
    const handleOutsideClick = () => setShowDropdown(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showDropdown]);

  // Fund Wallet from USDC Faucet
  const handleFundWallet = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop dropdown closure
    if (!user) return;
    setIsFunding(true);
    setFundSuccess(false);

    try {
      const response = await fetch('/api/profile/fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: user.walletAddress,
          amount: 500
        }),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        onLogin(updatedProfile);
        setFundSuccess(true);
        setTimeout(() => setFundSuccess(false), 3000);
      }
    } catch (e) {
      console.error('Faucet request failed', e);
    } finally {
      setIsFunding(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="relative inline-block text-left" id="wallet-connect-module">
      {!user ? (
        <button
          onClick={() => login()}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs uppercase tracking-wider px-4 py-2.5 rounded-xl cursor-pointer transition-all active:scale-95 shadow-lg shadow-blue-500/10 h-10"
        >
          <LogIn className="w-4 h-4" />
          <span>Connect / Register</span>
        </button>
      ) : (
        <div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown(!showDropdown);
            }}
            className="flex items-center gap-2.5 bg-zinc-900 hover:bg-zinc-850 px-3 py-1.5 rounded-xl border border-zinc-800 transition-colors cursor-pointer h-10"
          >
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] font-bold text-white block leading-none">
                {user.walletAddress.slice(0, 6)}...{user.walletAddress.slice(-4)}
              </span>
              <span className="text-[8px] font-black text-emerald-400 block mt-0.5 uppercase tracking-wider">
                ${user.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })} USDC
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-zinc-400" />
          </button>

          {showDropdown && (
            <div 
              className="absolute right-0 mt-2 w-72 bg-zinc-950 border border-zinc-900 rounded-2xl shadow-2xl p-4 space-y-4 z-50 text-left animate-fade-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Profile details without card-sections - seamless natural grouping */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Connected Account</span>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white">
                    {user.loginMethod} Mode
                  </span>
                  {user.email && (
                    <span className="text-[10px] text-zinc-400 font-mono truncate max-w-[150px]">
                      {user.email}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider">Solana Address</span>
                  <button 
                    onClick={() => handleCopyText(user.walletAddress)}
                    className="text-[10px] text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-2.5 h-2.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="bg-zinc-900/40 px-3 py-2 rounded-xl text-zinc-400 font-mono text-xs break-all leading-normal select-all">
                  {user.walletAddress}
                </div>
              </div>

              {/* USDC Faucet Section */}
              <div className="bg-gradient-to-br from-zinc-900/30 to-blue-950/20 p-3.5 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-300 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Coins className="w-3.5 h-3.5 text-emerald-400" /> testnet Faucet
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono">Limit: $500/day</span>
                </div>
                <button
                  onClick={handleFundWallet}
                  disabled={isFunding}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-2 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md shadow-blue-600/15"
                >
                  {isFunding ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  ) : fundSuccess ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  )}
                  <span>{isFunding ? 'Refueling...' : fundSuccess ? 'Deposited +$500!' : 'Claim Faucet Funds'}</span>
                </button>
              </div>

              {/* Balance Summary */}
              <div className="grid grid-cols-2 gap-3 text-center py-1">
                <div className="text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Balance</span>
                  <span className="text-sm font-black text-white block">
                    ${user.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Portfolio</span>
                  <span className="text-sm font-black text-blue-400 block">
                    ${user.portfolioValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>

              {/* Log Out Button */}
              <div className="pt-2 border-t border-zinc-900">
                <button
                  onClick={() => {
                    logout();
                    onLogout();
                    setShowDropdown(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-red-950/20 border border-red-900/20 hover:bg-red-950/40 hover:border-red-900/50 text-red-400 hover:text-red-300 font-black py-2.5 rounded-xl transition-all duration-200 text-xs uppercase tracking-wider cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Disconnect</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
