import React from 'react';
import { BarChart3, TrendingUp, HelpCircle, Trophy, Award, Coins, Flame, Activity } from 'lucide-react';
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
    <div className="space-y-6 animate-fade-in" id="analytics-view">
      
      {/* Header Title */}
      <div className="space-y-2 border-b border-zinc-900 pb-4">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          <span>Platform Analytics Dashboard</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Real-time aggregated sports prediction financials. Monitor total trade volume, liquidity allocations, consensus accuracy, and payout records.
        </p>
      </div>

      {/* Stats Bento Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Card 1: Cumulative Volume */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Cum. Trading Volume</span>
            <Coins className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-white block">
              ${totalVolume.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +14.2% since yesterday
            </span>
          </div>
        </div>

        {/* Card 2: Cumulative Liquidity */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Liquidity Pool</span>
            <Coins className="w-4 h-4 text-blue-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-white block">
              ${totalLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className="text-[10px] text-zinc-500 block">AMM pool buffer ratio 0.40</span>
          </div>
        </div>

        {/* Card 3: Active Markets */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Contracts</span>
            <Flame className="w-4 h-4 text-red-400" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-white block">{activeMarketsCount}</span>
            <span className="text-[10px] text-zinc-500 block">{activeMatchesCount} matches pending</span>
          </div>
        </div>

        {/* Card 4: Settled Markets */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Settled Contracts</span>
            <Award className="w-4 h-4 text-yellow-500" />
          </div>
          <div className="space-y-0.5">
            <span className="text-2xl font-black text-white block">{settledMarketsCount}</span>
            <span className="text-[10px] text-zinc-500 block">{completedMatchesCount} matches verified</span>
          </div>
        </div>
      </div>

      {/* Bento Grid layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Bento: Custom SVG Volume Distribution Chart (2/3 width) */}
        <div className="lg:col-span-2 bg-zinc-900/10 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span>Volume Distribution by Match</span>
          </h3>

          <div className="bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl flex flex-col justify-center min-h-[220px]">
            {/* Custom SVG Bar Column Chart representing volume of match list */}
            <svg viewBox="0 0 400 160" className="w-full h-40 overflow-visible">
              <line x1="20" y1="130" x2="380" y2="130" stroke="#1f2937" strokeWidth="1" />
              
              {/* Brazil vs Germany */}
              <rect x="40" y="30" width="25" height="100" fill="#3b82f6" rx="4" className="hover:opacity-80 transition-opacity" />
              <text x="52.5" y="145" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">🇧🇷 vs 🇩🇪</text>
              <text x="52.5" y="25" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$201K</text>

              {/* Argentina vs France */}
              <rect x="110" y="55" width="25" height="75" fill="#6366f1" rx="4" className="hover:opacity-80 transition-opacity" />
              <text x="122.5" y="145" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">🇦🇷 vs 🇫🇷</text>
              <text x="122.5" y="50" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$152K</text>

              {/* England vs Spain */}
              <rect x="180" y="90" width="25" height="40" fill="#a78bfa" rx="4" className="hover:opacity-80 transition-opacity" />
              <text x="192.5" y="145" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">🏴󠁧󠁢󠁥󠁮󠁧󠁿 vs 🇪🇸</text>
              <text x="192.5" y="85" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$78K</text>

              {/* Portugal vs Morocco */}
              <rect x="250" y="15" width="25" height="115" fill="#f43f5e" rx="4" className="hover:opacity-80 transition-opacity" />
              <text x="262.5" y="145" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">🇵🇹 vs 🇲🇦</text>
              <text x="262.5" y="10" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$242K</text>

              {/* USA vs Netherlands */}
              <rect x="320" y="105" width="25" height="25" fill="#f59e0b" rx="4" className="hover:opacity-80 transition-opacity" />
              <text x="332.5" y="145" textAnchor="middle" fill="#94a3b8" fontSize="8" fontWeight="bold">🇺🇸 vs 🇳🇱</text>
              <text x="332.5" y="100" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="bold">$44K</text>
            </svg>
          </div>
        </div>

        {/* Right Bento: Ranked Matches list (1/3 width) */}
        <div className="lg:col-span-1 bg-zinc-900/10 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span>Highest Liquidity Matches</span>
          </h3>

          <div className="space-y-3">
            {matchRankings.map((m, idx) => (
              <div key={m.id} className="bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs font-mono font-black text-zinc-600">0{idx + 1}</span>
                  <div>
                    <span className="text-[10px] text-zinc-500 block uppercase font-bold tracking-wider">World Cup Match</span>
                    <span className="text-xs font-black text-zinc-100 flex items-center gap-1">
                      <span>{m.homeFlag} {m.awayFlag}</span>
                      <span>{m.title}</span>
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-white block">
                    ${m.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[9px] text-zinc-500 block font-bold">Volume Pool</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
