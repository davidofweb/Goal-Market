import React, { useState } from 'react';
import { UserProfile, UserPosition, Transaction } from '../types';
import { Wallet, ShieldAlert, BadgeDollarSign, TrendingUp, History, Coins, ArrowUpRight, ArrowDownRight, Landmark, BadgeHelp, CheckCircle2 } from 'lucide-react';

interface ProfileProps {
  user: UserProfile | null;
  onConnectPrompt: () => void;
}

export default function Profile({ user, onConnectPrompt }: ProfileProps) {
  const [activeTab, setActiveTab] = useState<'POSITIONS' | 'HISTORY' | 'LEDGER'>('POSITIONS');

  if (!user) {
    return (
      <div className="py-20 text-center max-w-lg mx-auto space-y-6 animate-fade-in my-8 px-4" id="portfolio-fallback">
        <Landmark className="w-10 h-10 text-blue-500 mx-auto" />
        <div className="space-y-2">
          <h3 className="text-xl font-extrabold text-white">Verification Needed</h3>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            Please authenticate using Privy to automatically load your embedded Solana address, synchronize virtual assets, and view your sports prediction ledger.
          </p>
        </div>
        <button
          onClick={onConnectPrompt}
          className="bg-blue-600 hover:bg-blue-500 text-white font-black px-6 py-3 rounded-xl transition-all text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-600/15 mx-auto block h-11"
        >
          Authenticate Privy Session
        </button>
      </div>
    );
  }

  // Calculate high-level financial valuations
  const netWorth = user.balance + user.portfolioValue;

  // Filter positions
  const openPositions = user.positions.filter(p => p.status === 'OPEN');
  const settledPositions = user.positions.filter(p => p.status === 'SETTLED' || p.status === 'CLOSED');

  return (
    <div className="space-y-8 animate-fade-in" id="profile-portfolio-view">
      
      {/* Portfolio Value Summary Row - Entirely borderless & integrated into background */}
      <div className="border-b border-zinc-900 pb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Net Valuation</span>
            <span className="text-4xl font-black text-white block">
              ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-xs font-mono text-zinc-400 block truncate max-w-xs">{user.walletAddress}</span>
          </div>

          <div className="grid grid-cols-2 gap-8 md:gap-12 py-3 border-t border-b border-zinc-900/80 md:border-none">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Cash Balance</span>
              <span className="text-base font-black text-emerald-400 block flex items-center gap-1.5 mt-1.5">
                <Coins className="w-4 h-4 text-emerald-400" />
                ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Active Pools</span>
              <span className="text-base font-black text-blue-400 block flex items-center gap-1.5 mt-1.5">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                ${user.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation tabs - borderless text style */}
      <div className="flex border-b border-zinc-900 gap-6 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setActiveTab('POSITIONS')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold cursor-pointer transition-all ${activeTab === 'POSITIONS' ? 'border-b-2 border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Active positions ({openPositions.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold cursor-pointer transition-all ${activeTab === 'HISTORY' ? 'border-b-2 border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Settlements ({settledPositions.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold cursor-pointer transition-all ${activeTab === 'LEDGER' ? 'border-b-2 border-blue-500 text-white' : 'border-transparent text-zinc-500 hover:text-white'}`}
        >
          Trading Ledger ({user.transactions.length})
        </button>
      </div>

      {/* Tab Contents - Completely card-less design */}
      <div className="space-y-2">
        
        {/* Active Open Positions Tab */}
        {activeTab === 'POSITIONS' && (
          openPositions.length === 0 ? (
            <div className="py-16 text-center space-y-2 border-t border-b border-zinc-900">
              <History className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">You have no active open share positions. Access active matches from the Exchange.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
              {openPositions.map(pos => {
                const currentVal = pos.shares * pos.currentPrice;
                const costBasis = pos.shares * pos.avgPrice;
                const profitLoss = currentVal - costBasis;
                const plPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
                
                return (
                  <div key={pos.id} className="py-6 flex flex-col md:flex-row md:items-center justify-between gap-6 px-1">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider">{pos.matchTitle}</span>
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded font-black uppercase">ACTIVE</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white truncate max-w-xl">{pos.marketQuestion}</h4>
                      
                      {/* Target outcome descriptor */}
                      <div className="text-[11px] text-zinc-400 flex items-center gap-1">
                        <span>Prediction Target:</span>
                        <strong className="text-zinc-200 font-extrabold">{pos.outcomeName}</strong>
                        <span className="text-zinc-600 font-mono">•</span>
                        <span>{pos.shares.toLocaleString()} Contracts</span>
                      </div>
                    </div>

                    {/* Cost & Profit metrics - Natural column layout */}
                    <div className="grid grid-cols-4 gap-6 sm:gap-8 shrink-0 text-left md:text-right">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">Avg Cost</span>
                        <span className="font-mono text-xs font-bold text-zinc-300 block mt-1">${pos.avgPrice.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">Cost Basis</span>
                        <span className="font-mono text-xs font-bold text-zinc-300 block mt-1">${costBasis.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">Value Est</span>
                        <span className="font-mono text-xs font-bold text-white block mt-1">${currentVal.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase font-bold block">P / L</span>
                        <span className={`font-mono text-xs font-black block mt-1 ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Settled Positions History Tab */}
        {activeTab === 'HISTORY' && (
          settledPositions.length === 0 ? (
            <div className="py-16 text-center space-y-2 border-t border-b border-zinc-900">
              <History className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">You have no historical settlements registered.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-900 border-t border-b border-zinc-900">
              {settledPositions.map(pos => {
                const won = (pos.payout || 0) > 0;
                return (
                  <div key={pos.id} className="py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-zinc-500 uppercase font-black">{pos.matchTitle}</span>
                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${won ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
                          {won ? 'Redeemed' : 'Closed'}
                        </span>
                      </div>
                      <h4 className="text-sm font-extrabold text-white mt-1 leading-snug">{pos.marketQuestion}</h4>
                      <p className="text-[11px] text-zinc-500">
                        Targeted: <span className="text-zinc-300 font-bold">{pos.outcomeName} ({pos.shares} Contracts)</span>
                      </p>
                    </div>
                    <div className="text-left sm:text-right shrink-0">
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Redemption Payout</span>
                      <span className={`font-mono font-black text-base mt-1 block ${won ? 'text-emerald-400' : 'text-zinc-500'}`}>
                        ${(pos.payout || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Real-time Ledger Table Tab - Fully seamless, responsive list */}
        {activeTab === 'LEDGER' && (
          user.transactions.length === 0 ? (
            <div className="py-16 text-center space-y-2 border-t border-b border-zinc-900">
              <History className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">No trading ledger actions registered yet.</p>
            </div>
          ) : (
            <div className="border-t border-zinc-900 divide-y divide-zinc-900">
              {user.transactions.map(tx => (
                <div key={tx.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
                  <div className="flex items-start gap-4">
                    <div className={`mt-0.5 shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${tx.type === 'BUY' ? 'bg-blue-500/10 text-blue-400' : 'bg-red-500/10 text-red-400'}`}>
                      {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-black uppercase ${tx.type === 'BUY' ? 'text-blue-400' : 'text-red-400'}`}>
                          {tx.type} Order
                        </span>
                        <span className="text-[8px] text-zinc-500 font-mono">{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                      <span className="font-extrabold text-white text-sm block">{tx.marketQuestion}</span>
                      <div className="flex items-center gap-1 text-[11px] text-zinc-400">
                        <span>Outcome:</span>
                        <strong className="text-zinc-200 font-extrabold">{tx.outcomeName}</strong>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 text-left sm:text-right shrink-0 pl-12 sm:pl-0">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Shares</span>
                      <span className="font-mono text-xs font-bold text-zinc-300 block mt-1">{tx.shares.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Avg Price</span>
                      <span className="font-mono text-xs font-bold text-zinc-300 block mt-1">${tx.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold block">Total Cash</span>
                      <span className="font-mono text-xs font-black text-white block mt-1">${tx.amount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
}
