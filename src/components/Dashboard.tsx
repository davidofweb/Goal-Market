import React, { useState } from 'react';
import { Search, Flame, Calendar, CheckCircle2, TrendingUp, Trophy, ChevronRight, Activity, Coins } from 'lucide-react';
import { Match, PredictionMarket } from '../types';

interface DashboardProps {
  matches: Match[];
  markets: { [matchId: string]: PredictionMarket[] };
  onSelectMatch: (matchId: string) => void;
  streamOnline: boolean;
}

export default function Dashboard({ matches, markets, onSelectMatch, streamOnline }: DashboardProps) {
  const [filter, setFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Calculate high-level platform stats for Dashboard Hero
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

  const groupsList = ['All', 'Group A', 'Group B', 'Group C', 'Group D', 'Group E'];

  // Match search and group filters
  const filteredMatches = matches.filter(match => {
    const matchesSearch =
      match.homeTeam.toLowerCase().includes(searchQuery.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesGroup = selectedGroup === 'All' || match.group === selectedGroup;
    
    const matchesStatus =
      filter === 'ALL' ||
      (filter === 'LIVE' && match.status === 'LIVE') ||
      (filter === 'UPCOMING' && match.status === 'UPCOMING') ||
      (filter === 'COMPLETED' && match.status === 'COMPLETED');

    return matchesSearch && matchesGroup && matchesStatus;
  });

  return (
    <div className="space-y-8 animate-fade-in" id="dashboard-view">
      
      {/* Platform Hero Banner */}
      <div className="relative bg-gradient-to-r from-zinc-950 via-zinc-900 to-blue-950/40 border border-zinc-800 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl">
        {/* Decorative Grid Overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293710_1px,transparent_1px),linear-gradient(to_bottom,#1f293710_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${streamOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${streamOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-1">
                {streamOnline ? 'TxLINE Real-Time Feeds Active' : 'Seeded Demo Stream Active'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              GoalMarket
            </h1>
            <p className="text-sm sm:text-base text-zinc-400 max-w-lg">
              The premium sports prediction exchange for the World Cup. Trade positions with zero slip-ups, backed by verifiable TxLINE decentralized oracles.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-4 sm:gap-6 bg-zinc-900/50 border border-zinc-800/80 p-4 rounded-2xl backdrop-blur-md">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Total Volume</span>
              <span className="text-base sm:text-lg font-black text-white block">
                ${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Total Pool</span>
              <span className="text-base sm:text-lg font-black text-blue-400 block">
                ${totalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-zinc-500 uppercase font-semibold block">Active Markets</span>
              <span className="text-base sm:text-lg font-black text-emerald-400 block">
                {activeMarketsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Search Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800 max-w-max">
          <button
            onClick={() => setFilter('ALL')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-150 ${filter === 'ALL' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            All matches
          </button>
          <button
            onClick={() => setFilter('LIVE')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-150 ${filter === 'LIVE' ? 'bg-red-500/10 text-red-400' : 'text-zinc-400 hover:text-white'}`}
          >
            <Flame className="w-3.5 h-3.5 text-red-400" />
            <span>Live Now</span>
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-150 ${filter === 'UPCOMING' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <Calendar className="w-3.5 h-3.5 text-zinc-400" />
            <span>Upcoming</span>
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-150 ${filter === 'COMPLETED' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Resolved</span>
          </button>
        </div>

        {/* Group stage selector & Search Box */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 outline-none focus:border-blue-500 focus:bg-zinc-900/80 placeholder-zinc-500 transition-colors duration-150"
            />
          </div>
        </div>
      </div>

      {/* Group Quick Filter Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
        {groupsList.map(group => (
          <button
            key={group}
            onClick={() => setSelectedGroup(group)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border duration-150 cursor-pointer ${selectedGroup === group ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-zinc-900/30 border-zinc-800/80 text-zinc-400 hover:text-white hover:border-zinc-700'}`}
          >
            {group === 'All' ? 'All Groups' : group}
          </button>
        ))}
      </div>

      {/* Matches Display Grid */}
      {filteredMatches.length === 0 ? (
        <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-12 text-center space-y-3">
          <Trophy className="w-12 h-12 text-zinc-700 mx-auto" />
          <h3 className="text-lg font-bold text-zinc-400">No matches found</h3>
          <p className="text-sm text-zinc-500">There are no matches that match your current filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredMatches.map(match => {
            // Find Match Winner prediction market
            const matchMarkets = markets[match.id] || [];
            const winnerMarket = matchMarkets.find(m => m.type === 'MATCH_WINNER');
            
            // Extract outcomes (Home, Away, Draw)
            const homeOutcome = winnerMarket?.outcomes.find(o => o.id === 'home');
            const awayOutcome = winnerMarket?.outcomes.find(o => o.id === 'away');
            const drawOutcome = winnerMarket?.outcomes.find(o => o.id === 'draw');

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                className="group relative bg-zinc-900/40 border border-zinc-800 hover:border-zinc-700 rounded-2xl p-5 hover:shadow-xl transition-all duration-200 cursor-pointer flex flex-col justify-between hover:bg-zinc-900/60"
              >
                {/* Top Section: Group & Status */}
                <div className="flex items-center justify-between mb-4 border-b border-zinc-900/80 pb-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                    {match.group}
                  </span>
                  
                  {match.status === 'LIVE' ? (
                    <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded-md text-[10px] font-bold text-red-400 uppercase tracking-wider animate-pulse">
                      <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      <span>Live • {match.minute}'</span>
                    </div>
                  ) : match.status === 'COMPLETED' ? (
                    <div className="flex items-center gap-1.5 bg-zinc-800/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>Full Time</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800/80 px-2 py-0.5 rounded-md text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      <span>Upcoming</span>
                    </div>
                  )}
                </div>

                {/* Team Matchup / Scores Row */}
                <div className="flex items-center justify-between mb-6">
                  {/* Home Team */}
                  <div className="flex items-center gap-3 w-5/12">
                    <span className="text-3xl filter drop-shadow">{match.homeFlag}</span>
                    <span className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors duration-150">
                      {match.homeTeam}
                    </span>
                  </div>

                  {/* Score or VS Circle */}
                  <div className="flex flex-col items-center justify-center w-2/12">
                    {match.status === 'UPCOMING' ? (
                      <div className="px-2.5 py-1 bg-zinc-950 border border-zinc-800 rounded-lg text-xs font-mono font-bold text-zinc-400">
                        {new Date(match.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-zinc-950/80 px-3 py-1 rounded-full border border-zinc-800/60">
                        <span className="text-base font-black text-white">{match.homeScore}</span>
                        <span className="text-xs text-zinc-600 font-bold">-</span>
                        <span className="text-base font-black text-white">{match.awayScore}</span>
                      </div>
                    )}
                  </div>

                  {/* Away Team */}
                  <div className="flex items-center justify-end gap-3 w-5/12 text-right">
                    <span className="font-bold text-white text-base truncate group-hover:text-blue-400 transition-colors duration-150">
                      {match.awayTeam}
                    </span>
                    <span className="text-3xl filter drop-shadow">{match.awayFlag}</span>
                  </div>
                </div>

                {/* Lower Section: Prediction Odds Row */}
                {winnerMarket && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Winner Market Odds</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Vol: ${winnerMarket.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {/* Home odds */}
                      <div className="bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl p-2 text-center transition-colors">
                        <span className="text-[10px] text-zinc-500 font-bold block truncate">{match.homeTeam}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-sm font-black text-blue-400">${homeOutcome?.odds.toFixed(2)}</span>
                          <span className="text-[9px] text-zinc-500">({Math.round((homeOutcome?.probability || 0) * 100)}%)</span>
                        </div>
                      </div>

                      {/* Draw odds */}
                      <div className="bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl p-2 text-center transition-colors">
                        <span className="text-[10px] text-zinc-500 font-bold block truncate">Draw</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-sm font-black text-zinc-400">${drawOutcome?.odds.toFixed(2)}</span>
                          <span className="text-[9px] text-zinc-500">({Math.round((drawOutcome?.probability || 0) * 100)}%)</span>
                        </div>
                      </div>

                      {/* Away odds */}
                      <div className="bg-zinc-950/40 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-xl p-2 text-center transition-colors">
                        <span className="text-[10px] text-zinc-500 font-bold block truncate">{match.awayTeam}</span>
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <span className="text-sm font-black text-indigo-400">${awayOutcome?.odds.toFixed(2)}</span>
                          <span className="text-[9px] text-zinc-500">({Math.round((awayOutcome?.probability || 0) * 100)}%)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover indicator overlay */}
                <div className="absolute right-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-blue-600/10 p-1.5 rounded-full border border-blue-500/20 text-blue-400">
                  <ChevronRight className="w-4 h-4" />
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
