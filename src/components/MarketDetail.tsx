import React, { useState, useEffect } from 'react';
import { ChevronLeft, Info, HelpCircle, Activity, BarChart3, Clock, AlertTriangle, Cpu, TrendingUp, Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import { Match, PredictionMarket, Outcome, UserProfile } from '../types';

interface MarketDetailProps {
  match: Match;
  markets: PredictionMarket[];
  user: UserProfile | null;
  onBack: () => void;
  onTrade: (tradeParams: {
    matchId: string;
    marketId: string;
    outcomeId: string;
    type: 'BUY' | 'SELL';
    shares: number;
  }) => Promise<boolean>;
}

export default function MarketDetail({ match, markets, user, onBack, onTrade }: MarketDetailProps) {
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  
  const [tradeType, setTradeType] = useState<'BUY' | 'SELL'>('BUY');
  const [sharesInput, setSharesInput] = useState<string>('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tradeError, setTradeError] = useState('');
  const [tradeSuccess, setTradeSuccess] = useState(false);

  // Gemini state
  const [geminiAnalysis, setGeminiAnalysis] = useState('');
  const [loadingGemini, setLoadingGemini] = useState(false);

  // Set default market and outcome on load
  useEffect(() => {
    if (markets.length > 0) {
      const winnerMarket = markets.find(m => m.type === 'MATCH_WINNER') || markets[0];
      setSelectedMarket(winnerMarket);
      if (winnerMarket.outcomes.length > 0) {
        setSelectedOutcome(winnerMarket.outcomes[0]);
      }
    }
  }, [markets]);

  // Handle outcome change when selected market changes
  const handleMarketChange = (market: PredictionMarket) => {
    setSelectedMarket(market);
    if (market.outcomes.length > 0) {
      setSelectedOutcome(market.outcomes[0]);
    }
    setTradeError('');
    setTradeSuccess(false);
  };

  // Run Gemini Sports Advisory Model
  const runGeminiAnalysis = async () => {
    setLoadingGemini(true);
    setGeminiAnalysis('');
    try {
      const response = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matchId: match.id })
      });
      if (!response.ok) throw new Error('Failed to retrieve sports model analysis');
      const data = await response.json();
      setGeminiAnalysis(data.text);
    } catch (e: any) {
      setGeminiAnalysis(`**Analysis Unavailable**\n\nCould not initialize server-side prediction models. Reason: ${e.message}`);
    } finally {
      setLoadingGemini(false);
    }
  };

  // Process prediction transaction
  const handleConfirmTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setTradeError('Please connect your Privy wallet session first.');
      return;
    }
    if (!selectedMarket || !selectedOutcome) return;

    const shares = parseFloat(sharesInput);
    if (isNaN(shares) || shares <= 0) {
      setTradeError('Please enter a valid amount of shares to trade.');
      return;
    }

    setIsSubmitting(true);
    setTradeError('');
    setTradeSuccess(false);

    try {
      const success = await onTrade({
        matchId: match.id,
        marketId: selectedMarket.id,
        outcomeId: selectedOutcome.id,
        type: tradeType,
        shares
      });

      if (success) {
        setTradeSuccess(true);
        // Clear forms or refresh
        setTimeout(() => setTradeSuccess(false), 3000);
      } else {
        setTradeError('Trade failed. Please verify your balances or portfolio limits.');
      }
    } catch (err: any) {
      setTradeError(err.message || 'AMM trade failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Estimated financial metrics
  const sharesValue = parseFloat(sharesInput) || 0;
  const pricePerShare = selectedOutcome?.odds || 0.50;
  const costEst = sharesValue * pricePerShare;
  const maxPayout = sharesValue * 1.00;
  const profitEst = maxPayout - costEst;
  const roiEst = costEst > 0 ? (profitEst / costEst) * 100 : 0;

  // Retrieve user positions for currently selected outcome
  const userOutcomePosition = user?.positions?.find(
    p => p.marketId === selectedMarket?.id && p.outcomeId === selectedOutcome?.id && p.status === 'OPEN'
  );

  return (
    <div className="space-y-8 animate-fade-in" id="market-detail-view">
      
      {/* 1. Back button & Flat Team Header (Continuous, no isolated card) */}
      <div className="border-b border-zinc-900 pb-6 space-y-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to fixtures</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-2">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-3 items-center">
              <span className="text-3xl filter drop-shadow w-11 h-11 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-900 select-none">{match.homeFlag}</span>
              <span className="text-3xl filter drop-shadow w-11 h-11 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-900 select-none">{match.awayFlag}</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-zinc-950 border border-zinc-900 px-2 py-0.5 rounded-md font-black text-zinc-400 uppercase tracking-widest">{match.group}</span>
                {match.status === 'LIVE' && (
                  <span className="text-[9px] bg-red-500/10 text-red-400 border border-red-500/25 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse">
                    LIVE • {match.minute}'
                  </span>
                )}
                {match.status === 'COMPLETED' && (
                  <span className="text-[9px] bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">RESOLVED</span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{match.homeTeam} vs {match.awayTeam}</h2>
            </div>
          </div>

          <div className="shrink-0">
            {match.status !== 'UPCOMING' ? (
              <div className="text-left sm:text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-black block tracking-wider">Live Match Score</span>
                <span className="text-3xl font-black text-white block mt-1">{match.homeScore} — {match.awayScore}</span>
              </div>
            ) : (
              <div className="text-left sm:text-right">
                <span className="text-[9px] text-zinc-500 uppercase font-black block tracking-wider">Scheduled Kickoff</span>
                <span className="text-xs font-bold text-blue-400 block mt-1.5">
                  {new Date(match.startTime).toLocaleDateString()} at {new Date(match.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Grid: Left Column (Odds trajectory, commentary, prediction options), Right Column (Trade Desk sidebar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Area (Prediction Options & Feed Timelines) */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Contracts Selector */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2.5">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Prediction Markets</span>
            </h3>

            <div className="divide-y divide-zinc-900">
              {markets.map(market => {
                const isSelected = selectedMarket?.id === market.id;
                return (
                  <div
                    key={market.id}
                    onClick={() => handleMarketChange(market)}
                    className={`py-5 transition-colors cursor-pointer ${isSelected ? 'bg-zinc-950/20' : ''}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <h4 className="text-sm font-extrabold text-white">{market.question}</h4>
                      {market.status === 'SETTLED' ? (
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-black uppercase">Settled</span>
                      ) : (
                        <span className="text-[8px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded font-black uppercase">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mb-4 font-medium leading-relaxed">{market.description}</p>

                    {/* Options (Continuous columns) */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {market.outcomes.map(out => {
                        const isOutcomeSelected = selectedMarket?.id === market.id && selectedOutcome?.id === out.id;
                        return (
                          <div
                            key={out.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedMarket(market);
                              setSelectedOutcome(out);
                              setTradeError('');
                              setTradeSuccess(false);
                            }}
                            className={`px-3 py-2.5 rounded-xl border text-center transition-all cursor-pointer ${isOutcomeSelected ? 'bg-blue-600/10 border-blue-500 text-blue-400' : 'bg-transparent border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-800'}`}
                          >
                            <span className="text-[11px] font-extrabold block truncate">{out.name}</span>
                            <div className="flex items-center justify-center gap-1.5 mt-1">
                              {out.resolved && out.isWinner ? (
                                <span className="text-xs font-black text-emerald-400">WON $1.00</span>
                              ) : out.resolved && !out.isWinner ? (
                                <span className="text-xs font-black text-zinc-600">$0.00</span>
                              ) : (
                                <>
                                  <span className="text-xs font-black text-white">${out.odds.toFixed(2)}</span>
                                  <span className="text-[9px] text-zinc-500 font-bold">({Math.round(out.probability * 100)}%)</span>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SVG Trajectory Ticker - Completely borderless inside space */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Trajectory Chart</span>
            </h3>

            {selectedMarket ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold">
                  <span>{selectedMarket.question}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-zinc-500" /> Consensus feed stream
                  </span>
                </div>

                <div className="bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900/60">
                  <svg viewBox="0 0 400 120" className="w-full h-28 overflow-visible">
                    <defs>
                      <linearGradient id="gradientHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#18181b" strokeWidth="1" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#18181b" strokeWidth="1" />
                    <line x1="0" y1="100" x2="400" y2="100" stroke="#18181b" strokeWidth="1" />

                    {/* Interactive Curve */}
                    <path
                      d="M 0,90 Q 50,85 100,70 T 200,80 T 300,55 T 400,30"
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                    />
                    <path
                      d="M 0,90 Q 50,85 100,70 T 200,80 T 300,55 T 400,30 L 400,120 L 0,120 Z"
                      fill="url(#gradientHome)"
                    />

                    {/* Highlights */}
                    <circle cx="400" cy="30" r="4.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="1.5" />
                  </svg>

                  <div className="flex items-center justify-between text-[10px] text-zinc-600 font-black uppercase tracking-wider mt-2 px-1">
                    <span>Kick-off</span>
                    <span>30'</span>
                    <span>Half-time</span>
                    <span>75'</span>
                    <span>FT</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-medium">No trajectory available</p>
            )}
          </div>

          {/* Timeline Feed - organic vertical stream */}
          <div className="space-y-4">
            <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 border-b border-zinc-900 pb-2.5">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>sports feed timeline</span>
            </h3>

            {match.events.length === 0 ? (
              <div className="py-8 text-center border-t border-b border-zinc-900/40">
                <p className="text-xs text-zinc-500 font-medium">Fixture has not kicked off yet.</p>
              </div>
            ) : (
              <div className="space-y-5 pl-4 border-l border-zinc-900 relative">
                {match.events.slice().reverse().map(event => (
                  <div key={event.id} className="relative">
                    <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center">
                      <span className={`w-1 h-1 rounded-full ${event.type === 'GOAL' ? 'bg-emerald-400' : 'bg-zinc-600'}`}></span>
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-zinc-500">{event.minute}'</span>
                        <span className={`text-xs font-extrabold ${event.type === 'GOAL' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {event.type === 'GOAL' ? '⚽ Goal Scored!' : event.type}
                        </span>
                        {event.team && (
                          <span className="text-[8px] bg-zinc-950 text-zinc-500 px-1 py-0.2 rounded border border-zinc-900 uppercase font-bold">
                            {event.team}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5 font-medium">
                        {event.player} {event.detail && <span className="text-zinc-500">({event.detail})</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gemini Smart Assistant */}
          <div className="space-y-4 pt-4 border-t border-zinc-900/40">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <span>Gemini Analysis</span>
              </h3>
              <button
                onClick={runGeminiAnalysis}
                disabled={loadingGemini}
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider bg-violet-600/10 border border-violet-500/20 hover:border-violet-500/50 text-violet-400 px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50 hover:bg-violet-600/20 transition-all active:scale-95 h-8"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{loadingGemini ? 'Running...' : 'Generate AI Report'}</span>
              </button>
            </div>

            {loadingGemini ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-3 bg-zinc-900 rounded w-1/4"></div>
                <div className="h-3 bg-zinc-900 rounded w-3/4"></div>
                <div className="h-3 bg-zinc-900 rounded w-1/2"></div>
              </div>
            ) : geminiAnalysis ? (
              <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 border border-zinc-900 px-4 py-3 rounded-2xl whitespace-pre-line font-medium">
                {geminiAnalysis}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                Click "Generate AI Report" to query Gemini server-side predictions, match projections, and probability odds evaluations.
              </p>
            )}
          </div>

        </div>

        {/* Right Area: Interactive Trading Desk - Borderless, clean form sidebar */}
        <div className="space-y-6">
          <div className="space-y-5 lg:sticky lg:top-24">
            
            <div className="border-b border-zinc-900 pb-3">
              <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Trading Desk</span>
              </h3>
            </div>

            {selectedOutcome ? (
              <form onSubmit={handleConfirmTrade} className="space-y-5">
                
                {/* Buy / Sell switch */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setTradeType('BUY');
                      setTradeError('');
                    }}
                    className={`py-2 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer transition-colors border ${tradeType === 'BUY' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-transparent border-zinc-900 text-zinc-500 hover:text-white'}`}
                  >
                    Buy shares
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTradeType('SELL');
                      setTradeError('');
                    }}
                    className={`py-2 rounded-xl font-black text-[10px] uppercase tracking-wider cursor-pointer transition-colors border ${tradeType === 'SELL' ? 'bg-zinc-900 border-zinc-800 text-red-400' : 'bg-transparent border-zinc-900 text-zinc-500 hover:text-white'}`}
                  >
                    Sell shares
                  </button>
                </div>

                {/* Outcome summary text */}
                <div className="bg-zinc-950/40 px-3.5 py-3 rounded-2xl border border-zinc-900/80 space-y-1">
                  <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Target Position</span>
                  <span className="text-xs text-zinc-400 font-bold block">{selectedMarket?.question}</span>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900/60">
                    <span className="text-xs font-extrabold text-white">{selectedOutcome.name}</span>
                    <span className="text-sm font-black text-blue-400">${selectedOutcome.odds.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shares quantity input */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-black uppercase tracking-wider block">Quantity</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="100"
                      value={sharesInput}
                      onChange={(e) => setSharesInput(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-900 focus:border-blue-500 rounded-xl py-2.5 px-3 text-xs font-mono font-bold text-white outline-none h-10"
                    />
                    <span className="absolute right-3 top-3 text-[10px] text-zinc-500 font-black uppercase tracking-wider">Shares</span>
                  </div>
                </div>

                {/* Holdings reminder */}
                {userOutcomePosition && (
                  <div className="bg-zinc-950/20 px-3.5 py-2 rounded-xl text-[10px] flex items-center justify-between">
                    <span className="text-zinc-500 font-bold">Your Balance:</span>
                    <span className="font-extrabold text-blue-400">
                      {userOutcomePosition.shares} Shares (@ ${userOutcomePosition.avgPrice.toFixed(2)})
                    </span>
                  </div>
                )}

                {/* Order specs billing */}
                <div className="space-y-2 text-xs py-1">
                  <div className="flex items-center justify-between text-zinc-400 font-medium">
                    <span>Target Price</span>
                    <span className="font-bold text-zinc-300">${pricePerShare.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-zinc-400 font-medium pb-2 border-b border-zinc-900/60">
                    <span>Volume</span>
                    <span className="font-mono font-bold text-zinc-300">{sharesValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-zinc-400 font-bold">{tradeType === 'BUY' ? 'Estimated Cost' : 'Estimated Return'}</span>
                    <span className="font-mono font-black text-sm text-emerald-400">${costEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {tradeType === 'BUY' && (
                    <div className="pt-2 border-t border-zinc-900/60 space-y-1.5 text-[10px] text-zinc-500 font-medium">
                      <div className="flex items-center justify-between">
                        <span>Max Settle Value</span>
                        <span className="font-bold text-zinc-400">${maxPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Projected Earnings</span>
                        <span className="text-emerald-500 font-bold">+${profitEst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Alerts */}
                {tradeError && (
                  <div className="bg-red-950/20 border border-red-900/30 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{tradeError}</span>
                  </div>
                )}

                {tradeSuccess && (
                  <div className="bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 p-3 rounded-xl text-xs font-bold">
                    🎉 Transaction executed successfully on AMM!
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || selectedMarket?.status === 'SETTLED' || !selectedOutcome}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black py-3 rounded-xl text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 cursor-pointer h-11 transition-all shadow-md shadow-blue-600/15"
                >
                  <span>{selectedMarket?.status === 'SETTLED' ? 'Market Settled' : `${tradeType === 'BUY' ? 'Execute Buy' : 'Execute Sell'}`}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

              </form>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">Select outcome to open desk</p>
            )}

            {/* Platform Book Depth (continuous borderless) */}
            <div className="border-t border-zinc-900 pt-4 space-y-3">
              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider block">Consensus Liquidity Depth</span>
              
              <div className="space-y-2 text-[10px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Buying Yes</span>
                  <span className="font-mono">95,210 Contracts</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: '74%' }}></div>
                </div>

                <div className="flex items-center justify-between text-zinc-400 mt-2">
                  <span>Selling No</span>
                  <span className="font-mono">34,120 Contracts</span>
                </div>
                <div className="w-full bg-zinc-950 rounded-full h-1 overflow-hidden">
                  <div className="bg-indigo-500 h-1 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
