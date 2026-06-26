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
    <div className="space-y-6 animate-fade-in" id="market-detail-view">
      
      {/* Detail Header & Action Row */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>Back to Matches</span>
      </button>

      {/* Match Matchup Headline Banner */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-950/10 via-transparent to-transparent" />
        
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex -space-x-4 items-center">
              <span className="text-4xl filter drop-shadow bg-zinc-900 w-14 h-14 rounded-full flex items-center justify-center border border-zinc-800">{match.homeFlag}</span>
              <span className="text-4xl filter drop-shadow bg-zinc-900 w-14 h-14 rounded-full flex items-center justify-center border border-zinc-800">{match.awayFlag}</span>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-md font-semibold text-zinc-400 uppercase tracking-widest">{match.group}</span>
                {match.status === 'LIVE' && (
                  <span className="text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider animate-pulse flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                    <span>Live • {match.minute}'</span>
                  </span>
                )}
                {match.status === 'COMPLETED' && (
                  <span className="text-xs bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Resolved</span>
                )}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">{match.homeTeam} vs {match.awayTeam}</h2>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {match.status !== 'UPCOMING' ? (
              <div className="text-center bg-zinc-900/40 border border-zinc-800/80 px-5 py-3 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Score</span>
                <span className="text-3xl font-black text-white">{match.homeScore} - {match.awayScore}</span>
              </div>
            ) : (
              <div className="text-center bg-zinc-900/40 border border-zinc-800/80 px-5 py-3 rounded-2xl">
                <span className="text-[10px] text-zinc-500 uppercase font-semibold block mb-0.5">Kickoff</span>
                <span className="text-sm font-bold text-blue-400">
                  {new Date(match.startTime).toLocaleDateString()} at {new Date(match.startTime).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left column (Market options, timeline, commentary), Right column (Trading Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 of grid) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Prediction Markets Selector Board */}
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
              <BarChart3 className="w-4 h-4 text-blue-400" />
              <span>Prediction Contracts</span>
            </h3>

            <div className="space-y-4">
              {markets.map(market => {
                const isSelected = selectedMarket?.id === market.id;
                return (
                  <div
                    key={market.id}
                    onClick={() => handleMarketChange(market)}
                    className={`border rounded-xl p-4 transition-all duration-150 cursor-pointer ${isSelected ? 'bg-zinc-900/60 border-blue-500/50 shadow-lg' : 'bg-zinc-950/20 border-zinc-800/80 hover:border-zinc-700'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-zinc-100">{market.question}</h4>
                      {market.status === 'SETTLED' ? (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Settled</span>
                      ) : (
                        <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Active</span>
                      )}
                    </div>
                    <p className="text-xs text-zinc-400 mb-3 leading-relaxed">{market.description}</p>

                    {/* Outcomes Quick Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
                            className={`px-3 py-2 rounded-lg border text-center transition-colors cursor-pointer ${isOutcomeSelected ? 'bg-blue-600/15 border-blue-500 text-blue-400' : 'bg-zinc-950/60 border-zinc-900 hover:border-zinc-800 text-zinc-300'}`}
                          >
                            <span className="text-xs font-bold block truncate">{out.name}</span>
                            <div className="flex items-center justify-center gap-1.5 mt-0.5">
                              {out.resolved && out.isWinner ? (
                                <span className="text-xs font-black text-emerald-400">WIN $1.00</span>
                              ) : out.resolved && !out.isWinner ? (
                                <span className="text-xs font-black text-zinc-600">$0.00</span>
                              ) : (
                                <>
                                  <span className="text-xs font-black text-white">${out.odds.toFixed(2)}</span>
                                  <span className="text-[10px] text-zinc-500">({Math.round(out.probability * 100)}%)</span>
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

          {/* Custom SVG Odds Movement Chart */}
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Odds Trajectory Tracker</span>
            </h3>

            {/* SVG Render */}
            <div className="relative bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl flex flex-col items-center justify-center min-h-[160px]">
              {selectedMarket ? (
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-zinc-500 font-bold">{selectedMarket.question}</span>
                    <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-zinc-400 animate-spin" /> Live SSE updates active
                    </span>
                  </div>

                  {/* Simulated interactive Area chart using beautiful SVG lines */}
                  <svg viewBox="0 0 400 120" className="w-full h-28 overflow-visible">
                    <defs>
                      <linearGradient id="gradientHome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                      </linearGradient>
                      <linearGradient id="gradientAway" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
                      </linearGradient>
                    </defs>

                    {/* Grid lines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="60" x2="400" y2="60" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2" />
                    <line x1="0" y1="100" x2="400" y2="100" stroke="#1f2937" strokeWidth="0.5" strokeDasharray="2" />

                    {/* Dynamic graphs based on selected outcomes or live events */}
                    {/* Outcome 1 (Home) */}
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

                    {/* Outcome 2 (Away) */}
                    <path
                      d="M 0,60 Q 50,70 100,80 T 200,65 T 300,85 T 400,105"
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="1.5"
                      strokeDasharray="1"
                    />

                    {/* Chart cursors/hotspots */}
                    <circle cx="400" cy="30" r="4" fill="#3b82f6" stroke="#ffffff" strokeWidth="1" />
                    <circle cx="400" cy="105" r="3" fill="#818cf8" stroke="#ffffff" strokeWidth="1" />
                  </svg>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 font-bold mt-2">
                    <span>Kick-off</span>
                    <span>30'</span>
                    <span>Half-time</span>
                    <span>75'</span>
                    <span>Full-time</span>
                  </div>
                </div>
              ) : (
                <span className="text-xs text-zinc-500">No market data selected</span>
              )}
            </div>
          </div>

          {/* Match events timeline */}
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Activity className="w-4 h-4 text-amber-500" />
              <span>TxLINE Sports Feed Timeline</span>
            </h3>

            {match.events.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-xs text-zinc-500">Waiting for live match kick-off log sequences...</p>
              </div>
            ) : (
              <div className="space-y-4 relative pl-4 border-l border-zinc-800">
                {match.events.slice().reverse().map(event => (
                  <div key={event.id} className="relative">
                    {/* Timestamp Dot */}
                    <span className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center">
                      <span className={`w-1 h-1 rounded-full ${event.type === 'GOAL' ? 'bg-emerald-400' : 'bg-zinc-400'}`}></span>
                    </span>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-zinc-400">{event.minute}'</span>
                        <span className={`text-xs font-extrabold ${event.type === 'GOAL' ? 'text-emerald-400' : 'text-zinc-200'}`}>
                          {event.type === 'GOAL' ? '⚽ Goal Scored!' : (event.type === 'YELLOW_CARD' ? '🟨 Yellow Card' : event.player)}
                        </span>
                        {event.team && (
                          <span className="text-[9px] bg-zinc-950 text-zinc-500 px-1 py-0.2 rounded border border-zinc-900 uppercase font-bold">
                            {event.team}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {event.player} {event.detail && <span className="text-zinc-500">({event.detail})</span>}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gemini Smart Previews Panel */}
          <div className="bg-gradient-to-br from-zinc-950 to-blue-950/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400" />
                <span>Gemini Analytical Assistant</span>
              </h3>
              <button
                onClick={runGeminiAnalysis}
                disabled={loadingGemini}
                className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider bg-violet-600/10 border border-violet-500/20 hover:border-violet-500/50 text-violet-400 px-3 py-1.5 rounded-xl cursor-pointer disabled:opacity-50 hover:bg-violet-600/20 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>{loadingGemini ? 'Running Model...' : 'Analyze Market'}</span>
              </button>
            </div>

            {loadingGemini ? (
              <div className="space-y-2 py-4 animate-pulse">
                <div className="h-3 bg-zinc-800 rounded w-1/3"></div>
                <div className="h-3 bg-zinc-800 rounded w-4/5"></div>
                <div className="h-3 bg-zinc-800 rounded w-2/3"></div>
              </div>
            ) : geminiAnalysis ? (
              <div className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl prose prose-invert max-w-none">
                <div className="whitespace-pre-line">{geminiAnalysis}</div>
              </div>
            ) : (
              <p className="text-xs text-zinc-400 leading-relaxed">
                Click "Analyze Market" to generate automated pre-match analysis, probability estimates, and sports-finance commentaries using Gemini's latest 3.5 models.
              </p>
            )}
          </div>

        </div>

        {/* Right Column: Interactive Trading Desk (1/3 of grid) */}
        <div className="space-y-6">
          
          {/* Order Board Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-5 shadow-2xl relative sticky top-6">
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-400" />
                <span>Trade Shares Desk</span>
              </h3>
              <span className="text-[10px] text-zinc-500 font-bold">AMM Instantly Priced</span>
            </div>

            {selectedOutcome ? (
              <form onSubmit={handleConfirmTrade} className="space-y-4">
                
                {/* Buy / Sell toggle bar */}
                <div className="grid grid-cols-2 gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800/80">
                  <button
                    type="button"
                    onClick={() => {
                      setTradeType('BUY');
                      setTradeError('');
                    }}
                    className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${tradeType === 'BUY' ? 'bg-blue-600 text-white shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Buy shares
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTradeType('SELL');
                      setTradeError('');
                    }}
                    className={`py-2 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors ${tradeType === 'SELL' ? 'bg-zinc-800 text-red-400 shadow-lg' : 'text-zinc-400 hover:text-white'}`}
                  >
                    Sell shares
                  </button>
                </div>

                {/* Outcome display summary */}
                <div className="bg-zinc-900/40 p-3.5 border border-zinc-900 rounded-xl space-y-1">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase block">Selected Prediction Contract</span>
                  <span className="text-xs text-zinc-200 font-extrabold block">{selectedMarket?.question}</span>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-900">
                    <span className="text-sm font-bold text-white">{selectedOutcome.name}</span>
                    <span className="text-base font-black text-blue-400">${selectedOutcome.odds.toFixed(2)}</span>
                  </div>
                </div>

                {/* Shares input form */}
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-500 font-black uppercase block">Amount of Shares</label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="100"
                      value={sharesInput}
                      onChange={(e) => setSharesInput(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 focus:border-blue-500 rounded-xl py-3 px-4 text-sm font-mono font-bold text-white outline-none placeholder-zinc-600"
                    />
                    <span className="absolute right-4 top-3.5 text-xs text-zinc-500 font-bold uppercase">Shares</span>
                  </div>
                </div>

                {/* User Active Holdings Indicator */}
                {userOutcomePosition && (
                  <div className="bg-zinc-900/40 border border-zinc-800 px-3 py-2 rounded-xl flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 font-medium">Your Active Position:</span>
                    <span className="font-bold text-blue-400">
                      {userOutcomePosition.shares} Shares (Avg: ${userOutcomePosition.avgPrice.toFixed(2)})
                    </span>
                  </div>
                )}

                {/* Financial Summary Calculation Grid */}
                <div className="bg-zinc-900/20 border border-zinc-900 p-4 rounded-xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Avg share cost</span>
                    <span className="text-zinc-300 font-bold">${pricePerShare.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="text-zinc-500">Total volume</span>
                    <span className="text-zinc-300 font-mono">{sharesValue.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500 font-semibold">{tradeType === 'BUY' ? 'USDC Cost' : 'USDC Return'}</span>
                    <span className="text-sm font-bold text-emerald-400">${costEst.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  {tradeType === 'BUY' && (
                    <>
                      <div className="flex items-center justify-between border-t border-zinc-900 pt-2 text-[11px]">
                        <span className="text-zinc-500">Max Settle Value</span>
                        <span className="text-zinc-300 font-bold">${maxPayout.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Est Profit</span>
                        <span className="text-emerald-400 font-bold">+${profitEst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-zinc-500">Est ROI</span>
                        <span className="text-emerald-400 font-bold">{roiEst.toFixed(1)}%</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Errors & Alerts */}
                {tradeError && (
                  <div className="bg-red-950/40 border border-red-900 text-red-400 p-3 rounded-xl text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{tradeError}</span>
                  </div>
                )}

                {tradeSuccess && (
                  <div className="bg-emerald-950/40 border border-emerald-900 text-emerald-400 p-3 rounded-xl text-xs">
                    🎉 Share trade executed successfully on the AMM!
                  </div>
                )}

                {/* Order Submission Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || selectedMarket?.status === 'SETTLED' || !selectedOutcome}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-bold py-3.5 rounded-xl text-sm transition-colors duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>{selectedMarket?.status === 'SETTLED' ? 'Market Settled' : `${tradeType === 'BUY' ? 'Buy shares' : 'Sell shares'}`}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

              </form>
            ) : (
              <p className="text-xs text-zinc-500 text-center py-6">Select an prediction option to begin order execution.</p>
            )}

            {/* Platform Order Book Depth mockup */}
            <div className="border-t border-zinc-900 pt-4 space-y-2.5">
              <span className="text-[10px] text-zinc-500 font-black uppercase block">Liquidity Order Book Depth</span>
              
              <div className="space-y-1.5 text-[10px]">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Buying Pool Yes</span>
                  <span>95,210 Shares</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: '74%' }}></div>
                </div>

                <div className="flex items-center justify-between text-zinc-400 mt-2">
                  <span>Selling Pool No</span>
                  <span>34,120 Shares</span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-400 h-1.5 rounded-full" style={{ width: '38%' }}></div>
                </div>
              </div>
            </div>

          </div>
          
        </div>

      </div>

    </div>
  );
}
