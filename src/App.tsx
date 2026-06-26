import React, { useState, useEffect } from 'react';
import { Trophy, ShieldAlert, BarChart3, User, Terminal, HelpCircle, Activity, LayoutGrid, Coins, AlertCircle } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';
import { Match, PredictionMarket, SettlementProof, UserProfile, SystemFeedLog } from './types';

// Subcomponents
import WalletConnect from './components/WalletConnect';
import Dashboard from './components/Dashboard';
import MarketDetail from './components/MarketDetail';
import ResolutionCenter from './components/ResolutionCenter';
import Analytics from './components/Analytics';
import Profile from './components/Profile';

export default function App() {
  // Navigation Routing States
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'RESOLUTION' | 'ANALYTICS' | 'PORTFOLIO'>('DASHBOARD');
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);

  // App Data States
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [markets, setMarkets] = useState<{ [matchId: string]: PredictionMarket[] }>({});
  const [proofs, setProofs] = useState<SettlementProof[]>([]);
  const [logs, setLogs] = useState<SystemFeedLog[]>([]);
  
  // Real-Time feed states
  const [streamOnline, setStreamOnline] = useState(false);
  const [systemError, setSystemError] = useState('');

  // Initial Data Fetching
  useEffect(() => {
    async function fetchInitialData() {
      try {
        const [matchesRes, proofsRes, logsRes] = await Promise.all([
          fetch('/api/matches'),
          fetch('/api/proofs'),
          fetch('/api/logs')
        ]);

        if (!matchesRes.ok || !proofsRes.ok || !logsRes.ok) {
          throw new Error('Failure loading backend database schemas');
        }

        const matchesData: Match[] = await matchesRes.json();
        const proofsData: SettlementProof[] = await proofsRes.json();
        const logsData: SystemFeedLog[] = await logsRes.json();

        setMatches(matchesData);
        setProofs(proofsData);
        setLogs(logsData);

        // Fetch markets for all matches
        const marketsMap: { [matchId: string]: PredictionMarket[] } = {};
        await Promise.all(
          matchesData.map(async (m) => {
            const mRes = await fetch(`/api/markets/${m.id}`);
            if (mRes.ok) {
              marketsMap[m.id] = await mRes.json();
            }
          })
        );
        setMarkets(marketsMap);

        // Load cached trial wallet profile if exists
        const cachedWallet = localStorage.getItem('goalmarket_wallet_address');
        if (cachedWallet) {
          const profileRes = await fetch(`/api/profile/${cachedWallet}`);
          if (profileRes.ok) {
            const profileData: UserProfile = await profileRes.json();
            setUser(profileData);
          }
        }

      } catch (err: any) {
        setSystemError(`Connection failed: ${err.message || 'Check terminal status.'}`);
      }
    }

    fetchInitialData();
  }, []);

  // SSE Real-Time feeds listener
  useEffect(() => {
    // Connect to Server-Sent Events (SSE) stream on our backend
    const sse = new EventSource('/api/feed/stream');

    sse.onopen = () => {
      setStreamOnline(true);
      setSystemError('');
    };

    sse.onerror = () => {
      setStreamOnline(false);
    };

    sse.onmessage = (event) => {
      try {
        const { type, data } = JSON.parse(event.data);

        if (type === 'CONNECTED') {
          setStreamOnline(true);
        } else if (type === 'MATCH_UPDATE') {
          setMatches(data);
          // Auto update markets map
          data.forEach(async (m: Match) => {
            const mRes = await fetch(`/api/markets/${m.id}`);
            if (mRes.ok) {
              const updatedMarkets = await mRes.json();
              setMarkets(prev => ({ ...prev, [m.id]: updatedMarkets }));
            }
          });
        } else if (type === 'MARKET_UPDATE') {
          if (data && data.matchId && data.markets) {
            setMarkets(prev => ({ ...prev, [data.matchId]: data.markets }));
          } else {
            // Bulk update fallback
            matches.forEach(async (m) => {
              const mRes = await fetch(`/api/markets/${m.id}`);
              if (mRes.ok) {
                const updatedMarkets = await mRes.json();
                setMarkets(prev => ({ ...prev, [m.id]: updatedMarkets }));
              }
            });
          }
        } else if (type === 'PROOF_UPDATE') {
          setProofs(data);
        } else if (type === 'LOG') {
          setLogs(prev => [...prev.slice(-99), data]);
        } else if (type === 'USER_UPDATE') {
          if (user && data.walletAddress === user.walletAddress) {
            setUser(data.profile);
          }
        }
      } catch (e) {
        // failed parsing feed tick
      }
    };

    return () => {
      sse.close();
    };
  }, [user, matches]);

  const { ready: privyReady, authenticated: privyAuthenticated, user: privyUser, logout: privyLogout } = usePrivy();

  // Privy-to-Backend Sync Effect
  useEffect(() => {
    if (!privyReady) return;

    async function syncProfile() {
      if (privyAuthenticated && privyUser) {
        const walletAddress = privyUser.wallet?.address || 
          privyUser.linkedAccounts?.find(a => a.type === 'wallet')?.address || 
          `privy_${privyUser.id.replace('did:privy:', '').substring(0, 16)}`;
        
        const email = privyUser.email?.address || 
          privyUser.google?.email || 
          privyUser.linkedAccounts?.find(a => a.type === 'email')?.address || '';

        const loginMethod = privyUser.google ? 'GOOGLE' : privyUser.email ? 'EMAIL' : 'WALLET';

        try {
          const response = await fetch('/api/profile/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              walletAddress,
              email,
              loginMethod,
            }),
          });

          if (response.ok) {
            const profileData: UserProfile = await response.json();
            setUser(profileData);
            localStorage.setItem('goalmarket_wallet_address', walletAddress);
          }
        } catch (e) {
          console.error('Failed syncing Privy user profile with backend API', e);
        }
      } else {
        setUser(null);
        localStorage.removeItem('goalmarket_wallet_address');
      }
    }

    syncProfile();
  }, [privyReady, privyAuthenticated, privyUser]);

  // Fallback / simulation interface handler
  const handleLogin = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('goalmarket_wallet_address', profile.walletAddress);
  };

  const handleLogout = () => {
    if (privyAuthenticated) {
      privyLogout().catch(console.error);
    }
    setUser(null);
    localStorage.removeItem('goalmarket_wallet_address');
  };

  // AMM Trade request handler
  const handleTrade = async (tradeParams: {
    matchId: string;
    marketId: string;
    outcomeId: string;
    type: 'BUY' | 'SELL';
    shares: number;
  }) => {
    if (!user) return false;
    
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tradeParams,
          walletAddress: user.walletAddress
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'AMM matching failure');
      }

      const data = await res.json();
      setUser(data.profile);
      return true;
    } catch (err: any) {
      alert(err.message || 'Trade processing rejected.');
      return false;
    }
  };

  // Admin scenario controllers
  const handleAdminAction = async (action: string, matchId?: string, data?: any) => {
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, matchId, data })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Directive rejected');
      }

      // Re-fetch database states immediately
      const [mRes, pRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/api/proofs')
      ]);

      if (mRes.ok) setMatches(await mRes.json());
      if (pRes.ok) setProofs(await pRes.json());
      
      // Re-sync active user portfolio
      if (user) {
        const profileRes = await fetch(`/api/profile/${user.walletAddress}`);
        if (profileRes.ok) setUser(await profileRes.json());
      }

      return true;
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch oracle command');
      return false;
    }
  };

  const activeSelectedMatch = matches.find(m => m.id === selectedMatchId);

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex font-sans selection:bg-blue-600 selection:text-white antialiased">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-zinc-950/80 border-r border-zinc-900 flex-col justify-between hidden md:flex sticky top-0 h-screen p-6">
        <div className="space-y-8">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-white block tracking-tight">GoalMarket</span>
              <span className="text-[10px] text-zinc-500 font-bold block">Verifiable Exchange</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('DASHBOARD');
                setSelectedMatchId(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${activeTab === 'DASHBOARD' && !selectedMatchId ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>Match Dashboard</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('RESOLUTION');
                setSelectedMatchId(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${activeTab === 'RESOLUTION' ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Resolution Center</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('ANALYTICS');
                setSelectedMatchId(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${activeTab === 'ANALYTICS' ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Exchange Stats</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('PORTFOLIO');
                setSelectedMatchId(null);
              }}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer ${activeTab === 'PORTFOLIO' ? 'bg-blue-600/10 text-blue-400' : 'text-zinc-400 hover:text-white'}`}
            >
              <User className="w-4 h-4" />
              <span>My Portfolio</span>
            </button>
          </nav>

        </div>

        {/* Footer info */}
        <div className="border-t border-zinc-900 pt-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${streamOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              {streamOnline ? 'TxLINE Feed Live' : 'Feed Offline'}
            </span>
          </div>
          <span className="text-[9px] text-zinc-600 block">World Cup prediction exchange testnet.</span>
        </div>
      </aside>

      {/* Main Panel Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header Bar */}
        <header className="h-16 border-b border-zinc-900 bg-black/40 backdrop-blur sticky top-0 z-30 px-6 sm:px-8 flex items-center justify-between">
          
          {/* Mobile Header Brand */}
          <div className="flex items-center gap-2.5 md:hidden">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-white" />
            </div>
            <span className="font-extrabold text-sm text-white">GoalMarket</span>
          </div>

          <div className="hidden md:block">
            {/* Context breadcrumb or simple quote */}
            <span className="text-xs text-zinc-500 font-medium">World Cup Qatar-style Live Data feed</span>
          </div>

          {/* Privy Web3 Dropdown / Connector */}
          <WalletConnect
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
          />

        </header>

        {/* System Failure Warn Box */}
        {systemError && (
          <div className="m-6 sm:m-8 mb-0 bg-red-950/40 border border-red-900 text-red-400 p-4 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{systemError}</span>
          </div>
        )}

        {/* Dynamic Nav Tabs for Mobile Views */}
        <div className="flex md:hidden bg-zinc-950 border-b border-zinc-900 overflow-x-auto py-2.5 px-4 gap-4 scrollbar-none">
          <button
            onClick={() => {
              setActiveTab('DASHBOARD');
              setSelectedMatchId(null);
            }}
            className={`text-xs font-extrabold uppercase tracking-wider shrink-0 cursor-pointer ${activeTab === 'DASHBOARD' && !selectedMatchId ? 'text-blue-400' : 'text-zinc-500'}`}
          >
            Matches
          </button>
          <button
            onClick={() => {
              setActiveTab('RESOLUTION');
              setSelectedMatchId(null);
            }}
            className={`text-xs font-extrabold uppercase tracking-wider shrink-0 cursor-pointer ${activeTab === 'RESOLUTION' ? 'text-blue-400' : 'text-zinc-500'}`}
          >
            Resolution
          </button>
          <button
            onClick={() => {
              setActiveTab('ANALYTICS');
              setSelectedMatchId(null);
            }}
            className={`text-xs font-extrabold uppercase tracking-wider shrink-0 cursor-pointer ${activeTab === 'ANALYTICS' ? 'text-blue-400' : 'text-zinc-500'}`}
          >
            Stats
          </button>
          <button
            onClick={() => {
              setActiveTab('PORTFOLIO');
              setSelectedMatchId(null);
            }}
            className={`text-xs font-extrabold uppercase tracking-wider shrink-0 cursor-pointer ${activeTab === 'PORTFOLIO' ? 'text-blue-400' : 'text-zinc-500'}`}
          >
            Portfolio
          </button>
        </div>

        {/* Core Content Body */}
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          
          {selectedMatchId && activeSelectedMatch ? (
            <MarketDetail
              match={activeSelectedMatch}
              markets={markets[selectedMatchId] || []}
              user={user}
              onBack={() => setSelectedMatchId(null)}
              onTrade={handleTrade}
            />
          ) : (
            <>
              {activeTab === 'DASHBOARD' && (
                <Dashboard
                  matches={matches}
                  markets={markets}
                  onSelectMatch={(id) => {
                    setSelectedMatchId(id);
                  }}
                  streamOnline={streamOnline}
                />
              )}

              {activeTab === 'RESOLUTION' && (
                <ResolutionCenter proofs={proofs} />
              )}

              {activeTab === 'ANALYTICS' && (
                <Analytics matches={matches} markets={markets} />
              )}

              {activeTab === 'PORTFOLIO' && (
                <Profile
                  user={user}
                  onConnectPrompt={() => {
                    // Trigger connect wallet click
                    const button = document.getElementById('btn-connect-wallet');
                    if (button) button.click();
                  }}
                />
              )}
            </>
          )}

        </main>

      </div>

    </div>
  );
}
