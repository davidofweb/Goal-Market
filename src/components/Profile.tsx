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
      <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-12 text-center max-w-lg mx-auto space-y-5 animate-fade-in my-8">
        <Landmark className="w-12 h-12 text-blue-500 mx-auto" />
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-white">Your GoalMarket Portfolio</h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Please authenticate your session using Privy to generate your embedded Solana wallet, load mock balances, and begin trading prediction market shares.
          </p>
        </div>
        <button
          onClick={onConnectPrompt}
          className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-3 rounded-xl transition-colors duration-150 text-sm cursor-pointer shadow-lg shadow-blue-600/20 active:scale-95 mx-auto block"
        >
          Authenticate Privy Wallet
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
    <div className="space-y-6 animate-fade-in" id="profile-portfolio-view">
      
      {/* Portfolio Net Worth Banner */}
      <div className="bg-gradient-to-br from-zinc-950 via-zinc-900 to-indigo-950/20 border border-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:3rem_3rem]" />
        
        <div className="relative z-10 space-y-1">
          <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block">Net Portfolio Valuation</span>
          <span className="text-3xl sm:text-4xl font-black text-white block">
            ${netWorth.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-xs font-mono text-zinc-400 block truncate max-w-xs">Wallet: {user.walletAddress}</span>
        </div>

        <div className="relative z-10 grid grid-cols-2 gap-4 sm:gap-6 bg-zinc-900/60 border border-zinc-800/80 p-4 rounded-2xl backdrop-blur">
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">USDC Cash Balance</span>
            <span className="text-base font-black text-emerald-400 block flex items-center gap-1 mt-0.5">
              <Coins className="w-4 h-4 text-emerald-400 inline" />
              ${user.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Active Share Pools</span>
            <span className="text-base font-black text-blue-400 block flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-4 h-4 text-blue-400 inline" />
              ${user.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="flex border-b border-zinc-900 gap-6">
        <button
          onClick={() => setActiveTab('POSITIONS')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold cursor-pointer transition-colors border-b-2 ${activeTab === 'POSITIONS' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          Active Positions ({openPositions.length})
        </button>
        <button
          onClick={() => setActiveTab('HISTORY')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold cursor-pointer transition-colors border-b-2 ${activeTab === 'HISTORY' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          Settled Positions ({settledPositions.length})
        </button>
        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`pb-3 text-xs uppercase tracking-wider font-extrabold cursor-pointer transition-colors border-b-2 ${activeTab === 'LEDGER' ? 'border-blue-500 text-white' : 'border-transparent text-zinc-400 hover:text-white'}`}
        >
          Trading Ledger ({user.transactions.length})
        </button>
      </div>

      {/* Tab Contents */}
      <div className="space-y-4">
        
        {/* Active Open Positions Tab */}
        {activeTab === 'POSITIONS' && (
          openPositions.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center space-y-2">
              <History className="w-8 h-8 text-zinc-800 mx-auto" />
              <p className="text-sm text-zinc-500">You have no active open share positions. Head to the dashboard to place your first prediction contract.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {openPositions.map(pos => {
                const currentVal = pos.shares * pos.currentPrice;
                const costBasis = pos.shares * pos.avgPrice;
                const profitLoss = currentVal - costBasis;
                const plPercent = costBasis > 0 ? (profitLoss / costBasis) * 100 : 0;
                
                return (
                  <div key={pos.id} className="bg-zinc-900/30 border border-zinc-800 p-4 rounded-2xl space-y-3 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-zinc-500 uppercase font-extrabold">{pos.matchTitle}</span>
                        <span className="text-[10px] bg-blue-500/10 border border-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase font-bold">Active</span>
                      </div>
                      <h4 className="text-xs font-black text-zinc-100 mt-1">{pos.marketQuestion}</h4>
                      
                      <div className="flex justify-between items-center bg-zinc-950/40 p-2.5 rounded-lg border border-zinc-900 mt-3 text-[11px]">
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Target Prediction Outcome</span>
                          <span className="text-zinc-200 font-extrabold">{pos.outcomeName} ({pos.shares.toLocaleString()} Shares)</span>
                        </div>
                        <div className="text-right">
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Current Odds Price</span>
                          <span className="text-blue-400 font-black">${pos.currentPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-900 pt-3 grid grid-cols-3 gap-2 text-center text-[10px]">
                      <div>
                        <span className="text-zinc-500 uppercase block font-medium">Cost Basis</span>
                        <span className="font-bold text-zinc-300 block">${costBasis.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase block font-medium">Value Est</span>
                        <span className="font-bold text-white block">${currentVal.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 uppercase block font-medium">Profit / Loss</span>
                        <span className={`font-black block flex items-center justify-center gap-0.5 ${profitLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)} ({plPercent.toFixed(1)}%)
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
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center space-y-2">
              <History className="w-8 h-8 text-zinc-800 mx-auto" />
              <p className="text-sm text-zinc-500">You have no settled historical share records.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {settledPositions.map(pos => {
                const won = (pos.payout || 0) > 0;
                return (
                  <div key={pos.id} className="bg-zinc-900/10 border border-zinc-800 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 uppercase font-black">{pos.matchTitle}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider ${won ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-400'}`}>
                        {won ? 'Winner' : 'Closed'}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-zinc-100 mt-1">{pos.marketQuestion}</h4>
                    
                    <div className="bg-zinc-950/50 p-3 rounded-lg border border-zinc-900 flex justify-between items-center text-[11px]">
                      <div>
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">Predicted Outcome</span>
                        <span className="text-zinc-300 font-bold">{pos.outcomeName} ({pos.shares} Shares)</span>
                      </div>
                      <div className="text-right">
                        <span className="text-zinc-500 block text-[9px] uppercase font-bold">Redemption Payout</span>
                        <span className={`font-black text-sm block ${won ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          ${(pos.payout || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* Real-time Ledger Table Tab */}
        {activeTab === 'LEDGER' && (
          user.transactions.length === 0 ? (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-8 text-center space-y-2">
              <History className="w-8 h-8 text-zinc-800 mx-auto" />
              <p className="text-sm text-zinc-500">No trading ledger actions registered yet.</p>
            </div>
          ) : (
            <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-900/80 border-b border-zinc-800 text-[10px] text-zinc-500 uppercase font-extrabold tracking-wider">
                      <th className="p-4">Type</th>
                      <th className="p-4">Prediction Question</th>
                      <th className="p-4 text-center">Outcome</th>
                      <th className="p-4 text-right">Shares</th>
                      <th className="p-4 text-right">Price per Share</th>
                      <th className="p-4 text-right">Cash Transacted</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-900 text-xs">
                    {user.transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-zinc-900/30 transition-colors">
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 font-bold ${tx.type === 'BUY' ? 'text-blue-400' : 'text-red-400'}`}>
                            {tx.type === 'BUY' ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            <span>{tx.type}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-zinc-200 block truncate max-w-xs">{tx.marketQuestion}</span>
                          <span className="text-[9px] text-zinc-500 font-mono block mt-0.5">{new Date(tx.timestamp).toLocaleString()}</span>
                        </td>
                        <td className="p-4 text-center">
                          <span className="font-extrabold text-zinc-100 bg-zinc-900 px-2.5 py-1 rounded-md border border-zinc-800">{tx.outcomeName}</span>
                        </td>
                        <td className="p-4 text-right font-mono font-bold text-zinc-300">{tx.shares.toLocaleString()}</td>
                        <td className="p-4 text-right font-mono font-bold text-zinc-400">${tx.price.toFixed(2)}</td>
                        <td className="p-4 text-right font-mono font-black text-white">${tx.amount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}

      </div>

    </div>
  );
}
