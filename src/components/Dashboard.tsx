import React, { useState } from 'react';
import { Search, Flame, Calendar, CheckCircle2, Trophy, ChevronRight, Activity, Coins } from 'lucide-react';
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

  // Calculate platform metrics for header ticker
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
    <div className="space-y-10 animate-fade-in" id="dashboard-view">
      
      {/* 1. Seamless Natural Header - No cards or floating boxes, content flows on the canvas */}
      <div className="border-b border-zinc-900 pb-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-2 w-2 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${streamOnline ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${streamOnline ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                {streamOnline ? 'TxLINE verification oracle online' : 'Local testnet stream active'}
              </span>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight leading-none">
              Live Exchange
            </h1>
            <p className="text-sm text-zinc-400 max-w-xl font-medium leading-relaxed">
              Verifiable prediction markets for the World Cup. Backed by real-time cryptographic consensus with no intermediaries.
            </p>
          </div>

          {/* Inline Metrics Grid (Continuous design - borderless, organic columns) */}
          <div className="grid grid-cols-3 gap-8 md:gap-12 py-3 border-t border-b border-zinc-900/80 md:border-none">
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Global Volume</span>
              <span className="text-lg font-black text-white block mt-1">
                ${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Total Pool</span>
              <span className="text-lg font-black text-blue-400 block mt-1">
                ${totalLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div>
              <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Active Lines</span>
              <span className="text-lg font-black text-emerald-400 block mt-1">
                {activeMarketsCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Interactive Search & Filters Row - Natural inline items */}
      <div className="flex flex-col gap-6">
        
        {/* Navigation Tabs - Borderless Text Links */}
        <div className="flex items-center gap-6 overflow-x-auto pb-1 border-b border-zinc-900/40 scrollbar-none">
          <button
            onClick={() => setFilter('ALL')}
            className={`font-extrabold text-xs uppercase tracking-wider pb-3 cursor-pointer transition-all ${filter === 'ALL' ? 'text-white border-b-2 border-blue-500' : 'text-zinc-500 hover:text-white'}`}
          >
            All Matches
          </button>
          <button
            onClick={() => setFilter('LIVE')}
            className={`flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider pb-3 cursor-pointer transition-all ${filter === 'LIVE' ? 'text-red-400 border-b-2 border-red-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <Flame className="w-3.5 h-3.5 text-red-500" />
            <span>Live Live</span>
          </button>
          <button
            onClick={() => setFilter('UPCOMING')}
            className={`flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider pb-3 cursor-pointer transition-all ${filter === 'UPCOMING' ? 'text-zinc-300 border-b-2 border-zinc-300' : 'text-zinc-500 hover:text-white'}`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Upcoming</span>
          </button>
          <button
            onClick={() => setFilter('COMPLETED')}
            className={`flex items-center gap-1.5 font-extrabold text-xs uppercase tracking-wider pb-3 cursor-pointer transition-all ${filter === 'COMPLETED' ? 'text-emerald-400 border-b-2 border-emerald-500' : 'text-zinc-500 hover:text-white'}`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </button>
        </div>

        {/* Group Stage Pills & Search (Natural integration, no card housing) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {groupsList.map(group => (
              <button
                key={group}
                onClick={() => setSelectedGroup(group)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-colors border duration-150 cursor-pointer ${selectedGroup === group ? 'bg-blue-600/10 border-blue-500/30 text-blue-400' : 'bg-transparent border-zinc-900 text-zinc-500 hover:text-white hover:border-zinc-800'}`}
              >
                {group === 'All' ? 'All Groups' : group}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-900 focus:border-blue-500 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-200 outline-none placeholder-zinc-600 transition-all h-9"
            />
          </div>
        </div>
      </div>

      {/* 3. Stream of Matches - Continuous borderless list rows, no separate card blocks */}
      {filteredMatches.length === 0 ? (
        <div className="py-20 text-center space-y-3 border-t border-b border-zinc-900">
          <Trophy className="w-8 h-8 text-zinc-700 mx-auto" />
          <h3 className="text-sm font-bold text-zinc-500">No matching fixtures found</h3>
        </div>
      ) : (
        <div className="border-t border-zinc-900 divide-y divide-zinc-900">
          {filteredMatches.map(match => {
            const matchMarkets = markets[match.id] || [];
            const winnerMarket = matchMarkets.find(m => m.type === 'MATCH_WINNER');
            
            const homeOutcome = winnerMarket?.outcomes.find(o => o.id === 'home');
            const awayOutcome = winnerMarket?.outcomes.find(o => o.id === 'away');
            const drawOutcome = winnerMarket?.outcomes.find(o => o.id === 'draw');

            return (
              <div
                key={match.id}
                onClick={() => onSelectMatch(match.id)}
                className="group py-6 md:py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 cursor-pointer transition-colors hover:bg-zinc-950/40 relative px-2"
              >
                {/* Team Names & Live Status */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {match.group}
                    </span>
                    {match.status === 'LIVE' ? (
                      <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20 animate-pulse">
                        <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                        LIVE • {match.minute}'
                      </span>
                    ) : match.status === 'COMPLETED' ? (
                      <span className="text-[9px] font-black text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Full Time
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-zinc-400 bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        Upcoming
                      </span>
                    )}
                  </div>

                  {/* Tactile Scoreboard Flow (Borderless, Mobile-friendly row) */}
                  <div className="flex items-center gap-6">
                    {/* Home Team */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-3xl filter drop-shadow select-none">{match.homeFlag}</span>
                      <span className="font-extrabold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                        {match.homeTeam}
                      </span>
                    </div>

                    {/* Divider or Score indicator */}
                    <div className="shrink-0">
                      {match.status === 'UPCOMING' ? (
                        <span className="text-xs font-mono font-black text-zinc-500">
                          {new Date(match.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5 font-black text-base px-2 py-0.5 rounded-lg bg-zinc-900/60 border border-zinc-800/30">
                          <span className={match.homeScore > match.awayScore ? 'text-white' : 'text-zinc-400'}>{match.homeScore}</span>
                          <span className="text-zinc-600">-</span>
                          <span className={match.awayScore > match.homeScore ? 'text-white' : 'text-zinc-400'}>{match.awayScore}</span>
                        </div>
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="text-3xl filter drop-shadow select-none">{match.awayFlag}</span>
                      <span className="font-extrabold text-white text-base truncate group-hover:text-blue-400 transition-colors">
                        {match.awayTeam}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Inline Odds Ticker - Completely borderless, blends seamlessly */}
                {winnerMarket && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 shrink-0">
                    <div className="text-left sm:text-right hidden sm:block">
                      <span className="text-[9px] text-zinc-500 uppercase font-black tracking-wider block">Winner Odds</span>
                      <span className="text-[10px] text-zinc-400 font-bold block mt-0.5">Pool: ${winnerMarket.volume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    </div>

                    {/* Odds Options Grid - Flat, minimal design */}
                    <div className="grid grid-cols-3 gap-2.5 w-full sm:w-auto">
                      {/* Home price */}
                      <div className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 px-3 py-2 rounded-xl text-center transition-colors min-w-[75px] h-12 flex flex-col justify-center">
                        <span className="text-[8px] text-zinc-500 font-black uppercase truncate block">{match.homeTeam}</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-xs font-black text-blue-400">${homeOutcome?.odds.toFixed(2)}</span>
                          <span className="text-[8px] text-zinc-600 font-bold">({Math.round((homeOutcome?.probability || 0) * 100)}%)</span>
                        </div>
                      </div>

                      {/* Draw price */}
                      <div className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 px-3 py-2 rounded-xl text-center transition-colors min-w-[75px] h-12 flex flex-col justify-center">
                        <span className="text-[8px] text-zinc-500 font-black uppercase truncate block">Draw</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-xs font-black text-zinc-400">${drawOutcome?.odds.toFixed(2)}</span>
                          <span className="text-[8px] text-zinc-600 font-bold">({Math.round((drawOutcome?.probability || 0) * 100)}%)</span>
                        </div>
                      </div>

                      {/* Away price */}
                      <div className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 px-3 py-2 rounded-xl text-center transition-colors min-w-[75px] h-12 flex flex-col justify-center">
                        <span className="text-[8px] text-zinc-500 font-black uppercase truncate block">{match.awayTeam}</span>
                        <div className="flex items-center justify-center gap-1 mt-0.5">
                          <span className="text-xs font-black text-indigo-400">${awayOutcome?.odds.toFixed(2)}</span>
                          <span className="text-[8px] text-zinc-600 font-bold">({Math.round((awayOutcome?.probability || 0) * 100)}%)</span>
                        </div>
                      </div>
                    </div>

                    <div className="hidden md:flex items-center justify-center w-7 h-7 rounded-full bg-zinc-900 text-zinc-500 group-hover:text-blue-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
