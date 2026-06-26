import React from 'react';
import { BarChart3, TrendingUp, Trophy, Award, Coins, Flame, Activity } from 'lucide-react';
import { Match, PredictionMarket } from '../types';

interface AnalyticsProps {
  matches: Match[];
  markets: { [matchId: string]: PredictionMarket[] };
}

export default function Analytics({ matches, markets }: AnalyticsProps) {
  // Compute platform aggregate stats
  const activeMatchesCount = matches.filter(m => m.status === 'LIVE' || m.status === 'UPCOMING').length;
  const completedMatchesCount = matches.filter(m => m.status === 'COMPLETED').length;

  const totalVolume = Object.values(markets).reduce(
    (acc, mList) => acc + mList.reduce((sum, m) => sum + m.volume, 0),
    0
  );
  
  const totalLiquidity = Object.values(markets).reduce(
    (acc, mList) => acc + mList.reduce((sum, m) => sum + m.liquidity, 0),
    0
  );

  const activeMarketsCount = Object.values(markets).reduce(
    (acc, mList) => acc + mList.filter(m => m.status === 'ACTIVE').length,
    0
  );

  const settledMarketsCount = Object.values(markets).reduce(
    (acc, mList) => acc + mList.filter(m => m.status === 'SETTLED').length,
    0
  );

  // Compile Match Rankings by Volume
  const matchRankings = matches.map(match => {
    const matchMarkets = markets[match.id] || [];
    const matchVol = matchMarkets.reduce((s, m) => s + m.volume, 0);
    const matchLiq = matchMarkets.reduce((s, m) => s + m.liquidity, 0);
    return {
      id: match.id,
      title: `${match.homeTeam} vs ${match.awayTeam}`,
      homeFlag: match.homeFlag,
      awayFlag: match.awayFlag,
      volume: matchVol,
      liquidity: matchLiq,
      status: match.status
    };
  }).sort((a, b) => b.volume - a.volume);

  return (
    <div className="space-y-10 animate-fade-in" id="analytics-view">
      
      {/* 1. Direct Page Header (Continuous, no isolated card) */}
      <div className="border-b border-zinc-900 pb-6 space-y-2">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Platform Ledger Analytics</span>
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl font-medium leading-relaxed">
          Real-time aggregated sports prediction financials. Monitor cumulative trade volume pool, AMM buffer levels, oracle verification performance, and payout records.
        </p>
      </div>

      {/* 2. Platform stats ticker grid (Flat list style, borderless columns) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 py-3 border-b border-zinc-900">
        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Cum. Trading Volume</span>
          <span className="text-2xl font-black text-white block mt-2">
            ${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-emerald-400 font-extrabold flex items-center gap-1 mt-1">
            <TrendingUp className="w-3 h-3" /> +14.2% since yesterday
          </span>
        </div>

        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Total Pools Buffer</span>
          <span className="text-2xl font-black text-blue-400 block mt-2">
            ${totalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[10px] text-zinc-500 block mt-1 font-bold">AMM pool buffer ratio 0.40</span>
        </div>

        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Active Contracts</span>
          <span className="text-2xl font-black text-white block mt-2">{activeMarketsCount}</span>
          <span className="text-[10px] text-zinc-500 block mt-1 font-bold">{activeMatchesCount} fixtures pending</span>
        </div>

        <div>
          <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Settled Contracts</span>
          <span className="text-2xl font-black text-white block mt-2">{settledMarketsCount}</span>
          <span className="text-[10px] text-zinc-500 block mt-1 font-bold">{completedMatchesCount} match feeds verified</span>
        </div>
      </div>

      {/* 3. Main Split Area: Left Column (Custom chart), Right Column (Volume Leaders) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Custom SVG Distribution Chart */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2.5">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Volume Distribution</span>
          </h3>

          <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60 flex flex-col justify-center min-h-[200px]">
            <svg viewBox="0 0 400 160" className="w-full h-40 overflow-visible">
              <line x1="20" y1="130" x2="380" y2="130" stroke="#18181b" strokeWidth="1" />
              
              {/* Brazil vs Germany */}
              <rect x="40" y="30" width="25" height="100" fill="#3b82f6" rx="4" className="hover:opacity-85 transition-opacity" />
              <text x="52.5" y="145" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold">🇧🇷 vs 🇩🇪</text>
              <text x="52.5" y="24" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$201K</text>

              {/* Argentina vs France */}
              <rect x="110" y="55" width="25" height="75" fill="#6366f1" rx="4" className="hover:opacity-85 transition-opacity" />
              <text x="122.5" y="145" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold">🇦🇷 vs 🇫🇷</text>
              <text x="122.5" y="49" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$152K</text>

              {/* England vs Spain */}
              <rect x="180" y="90" width="25" height="40" fill="#818cf8" rx="4" className="hover:opacity-85 transition-opacity" />
              <text x="192.5" y="145" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold">🏴󠁧󠁢󠁥󠁮󠁧󠁿 vs 🇪🇸</text>
              <text x="192.5" y="84" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$78K</text>

              {/* Portugal vs Morocco */}
              <rect x="250" y="15" width="25" height="115" fill="#f43f5e" rx="4" className="hover:opacity-85 transition-opacity" />
              <text x="262.5" y="145" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold">🇵🇹 vs 🇲🇦</text>
              <text x="262.5" y="9" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$242K</text>

              {/* USA vs Netherlands */}
              <rect x="320" y="105" width="25" height="25" fill="#f59e0b" rx="4" className="hover:opacity-85 transition-opacity" />
              <text x="332.5" y="145" textAnchor="middle" fill="#71717a" fontSize="8" fontWeight="bold">🇺🇸 vs 🇳🇱</text>
              <text x="332.5" y="99" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$44K</text>
            </svg>
          </div>
        </div>

        {/* Highest Liquidity Match Stream (Right side) */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2.5">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>Volume Rankings</span>
          </h3>

          <div className="divide-y divide-zinc-900">
            {matchRankings.map((m, idx) => (
              <div key={m.id} className="py-4 flex items-center justify-between px-1">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono font-black text-zinc-600">0{idx + 1}</span>
                  <div>
                    <span className="text-[8px] text-zinc-500 block uppercase font-black tracking-wider">Group Stage Contract</span>
                    <span className="text-xs font-black text-white flex items-center gap-1.5">
                      <span>{m.homeFlag} {m.awayFlag}</span>
                      <span>{m.title}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black text-white">
                    ${m.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[8px] text-zinc-500 block font-black uppercase tracking-wider mt-0.5">Pooled</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
