import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import crypto from 'crypto';
import { Match, MatchEvent, PredictionMarket, Outcome, UserPosition, Transaction, SettlementProof, UserProfile, SystemFeedLog } from './src/types';
import { SEEDED_MATCHES, generateMarketsForMatch, SEEDED_PROOFS } from './src/mockData';
import { 
  fetchTxOddsFeed, 
  ingestTxOddsFeedData, 
  getTxOddsConfig, 
  updateTxOddsConfig 
} from './src/services/txoddsService';

// Initialize Express
const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey ? new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
}) : null;

// In-Memory Database State
let matches: Match[] = JSON.parse(JSON.stringify(SEEDED_MATCHES));
let markets: { [matchId: string]: PredictionMarket[] } = {};
let settlements: SettlementProof[] = JSON.parse(JSON.stringify(SEEDED_PROOFS));
let systemLogs: SystemFeedLog[] = [
  { id: 'log_init', timestamp: new Date().toISOString(), type: 'INFO', message: 'GoalMarket TxLINE Data Stream Server Initialized.' },
  { id: 'log_seed', timestamp: new Date().toISOString(), type: 'INFO', message: 'Pre-seeded matches and Portugal vs Morocco settlement proofs loaded.' }
];

// Initialize Markets for seeded matches
matches.forEach(m => {
  markets[m.id] = generateMarketsForMatch(m.id, m.homeTeam, m.awayTeam, m.status);
});

// TXODDS Real-Time Synchronizer & Polling Loop
async function runTxOddsSynchronization() {
  try {
    const feed = await fetchTxOddsFeed();
    const result = ingestTxOddsFeedData(feed, matches, markets, systemLogs, broadcastSSE);
    
    // Log if there were updates
    if (result.updatedCount > 0 || result.addedCount > 0) {
      const syncLog: SystemFeedLog = {
        id: `log_sync_success_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: `🔄 [TXODDS DATA FEED] Synchronized successfully. Mode: ${feed.mode}. Updated: ${result.updatedCount} matches, Added: ${result.addedCount} matches.`
      };
      systemLogs.push(syncLog);
      broadcastSSE('LOG', syncLog);
    }
  } catch (err: any) {
    console.error('[TXODDS Sync Error]:', err.message);
  }
}

// Start polling every 12 seconds
const txOddsSyncInterval = setInterval(runTxOddsSynchronization, 12000);

// Seed User Profiles Dict
let users: { [walletAddress: string]: UserProfile } = {
  // Pre-seed a judge profile to demonstrate analytics immediately
  'SolPrivMkt_judge_1': {
    id: 'usr_judge_1',
    email: 'freedomdavid47@gmail.com',
    loginMethod: 'GOOGLE',
    walletAddress: 'SolPrivMkt_judge_1',
    balance: 87520, // Initial $100,000, bought some shares, won some, has $87,520 cash
    portfolioValue: 12480,
    positions: [
      {
        id: 'pos_pre_1',
        userId: 'usr_judge_1',
        matchId: 'match_1',
        marketId: 'match_1_winner',
        outcomeId: 'home',
        outcomeName: 'Brazil',
        marketQuestion: 'Who will win the match: Brazil vs Germany?',
        matchTitle: 'Brazil vs Germany',
        shares: 15000,
        avgPrice: 0.45,
        currentPrice: 0.62, // odds shifted up since they are leading/drawing
        status: 'OPEN',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'pos_pre_2',
        userId: 'usr_judge_1',
        matchId: 'match_4',
        marketId: 'match_4_winner',
        outcomeId: 'home',
        outcomeName: 'Portugal',
        marketQuestion: 'Who will win the match: Portugal vs Morocco?',
        matchTitle: 'Portugal vs Morocco',
        shares: 8000,
        avgPrice: 0.55,
        currentPrice: 1.00,
        status: 'SETTLED',
        payout: 8000, // won $8000
        timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString()
      }
    ],
    transactions: [
      {
        id: 'tx_pre_1',
        userId: 'usr_judge_1',
        matchId: 'match_4',
        marketId: 'match_4_winner',
        outcomeId: 'home',
        outcomeName: 'Portugal',
        marketQuestion: 'Who will win the match: Portugal vs Morocco?',
        type: 'BUY',
        shares: 8000,
        price: 0.55,
        amount: 4400,
        timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString()
      },
      {
        id: 'tx_pre_2',
        userId: 'usr_judge_1',
        matchId: 'match_1',
        marketId: 'match_1_winner',
        outcomeId: 'home',
        outcomeName: 'Brazil',
        marketQuestion: 'Who will win the match: Brazil vs Germany?',
        type: 'BUY',
        shares: 15000,
        price: 0.45,
        amount: 6750,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      }
    ],
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  }
};

// Cryptographic proofs helper
function generateProofHash(proofData: Omit<SettlementProof, 'signature' | 'validationHash'>): { hash: string; signature: string } {
  const dataString = JSON.stringify(proofData);
  const hash = crypto.createHash('sha256').update(dataString).digest('hex');
  const signature = crypto.createHmac('sha256', 'txline-secret-key-2026').update(hash).digest('hex');
  return { hash, signature };
}

// SSE stream client management
let sseClients: { id: number; res: any }[] = [];

function broadcastSSE(type: string, data: any) {
  const message = `data: ${JSON.stringify({ type, data })}\n\n`;
  sseClients.forEach(client => {
    try {
      client.res.write(message);
    } catch (e) {
      // client stale or closed
    }
  });
}

// Simulation loop variables (for Live Simulation Replay of Argentina vs France)
interface SimState {
  isActive: boolean;
  step: number;
  intervalId?: NodeJS.Timeout;
}
let simState: SimState = {
  isActive: false,
  step: 0
};

// API Route Handlers

// SSE Feed Stream
app.get('/api/feed/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no' // bypass nginx proxy buffering
  });

  const clientId = Date.now();
  const client = { id: clientId, res };
  sseClients.push(client);

  // Send greeting and initial current states
  res.write(`data: ${JSON.stringify({ type: 'CONNECTED', data: { message: 'GoalMarket Real-Time TxLINE Feed Connected.' } })}\n\n`);
  
  // Clean up on client disconnect
  req.on('close', () => {
    sseClients = sseClients.filter(c => c.id !== clientId);
  });
});

// TXODDS API Integration Routes
app.get('/api/txodds/config', (req, res) => {
  res.json(getTxOddsConfig());
});

app.post('/api/txodds/config', (req, res) => {
  const { client, ident, mode } = req.body;
  if (!mode || (mode !== 'REAL' && mode !== 'SIMULATED')) {
    return res.status(400).json({ error: 'Invalid mode parameter' });
  }
  const updated = updateTxOddsConfig(client || '', ident || '', mode);
  
  const configLog: SystemFeedLog = {
    id: `log_config_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'INFO',
    message: `⚙️ [TXODDS CONFIG] API Integration updated. Mode switched to ${mode}. Client: ${client || 'N/A'}`
  };
  systemLogs.push(configLog);
  broadcastSSE('LOG', configLog);

  res.json(updated);
});

app.get('/api/txodds/feed', async (req, res) => {
  try {
    const feed = await fetchTxOddsFeed();
    res.json(feed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/txodds/sync', async (req, res) => {
  try {
    const feed = await fetchTxOddsFeed();
    const result = ingestTxOddsFeedData(feed, matches, markets, systemLogs, broadcastSSE);
    res.json({
      success: true,
      mode: feed.mode,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Matches & Markets
app.get('/api/matches', (req, res) => {
  res.json(matches);
});

app.get('/api/matches/:id', (req, res) => {
  const match = matches.find(m => m.id === req.params.id);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  res.json(match);
});

app.get('/api/markets/:matchId', (req, res) => {
  const matchMarkets = markets[req.params.matchId] || [];
  res.json(matchMarkets);
});

// Settlement Proofs
app.get('/api/proofs', (req, res) => {
  res.json(settlements);
});

// Logs for Admin Dashboard
app.get('/api/logs', (req, res) => {
  res.json(systemLogs.slice(-100)); // last 100 logs
});

// Privy authentication simulation
app.post('/api/profile/auth', (req, res) => {
  const { walletAddress, email, loginMethod } = req.body;
  if (!walletAddress) return res.status(400).json({ error: 'walletAddress is required' });

  let profile = users[walletAddress];
  if (!profile) {
    profile = {
      id: `usr_${Date.now().toString(36)}`,
      email: email || '',
      loginMethod: loginMethod || 'WALLET',
      walletAddress,
      balance: 100000, // Initial mock USDC
      portfolioValue: 0,
      positions: [],
      transactions: [],
      createdAt: new Date().toISOString()
    };
    users[walletAddress] = profile;
    
    // Log profile creation
    const log: SystemFeedLog = {
      id: `log_usr_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'INFO',
      message: `New User Profile authenticated via Privy: ${walletAddress.slice(0, 10)}... assigned $100,000 USDC.`
    };
    systemLogs.push(log);
    broadcastSSE('LOG', log);
  } else {
    // If logging in, update login method
    if (loginMethod) profile.loginMethod = loginMethod;
    if (email) profile.email = email;
  }

  // Recalculate portfolio value before return
  recalculatePortfolioValue(profile);
  res.json(profile);
});

app.get('/api/profile/:walletAddress', (req, res) => {
  const profile = users[req.params.walletAddress];
  if (!profile) return res.status(404).json({ error: 'Profile not found' });
  recalculatePortfolioValue(profile);
  res.json(profile);
});

// Recalculates user portfolio value by examining active shares
function recalculatePortfolioValue(profile: UserProfile) {
  let value = 0;
  profile.positions.forEach(pos => {
    if (pos.status === 'OPEN') {
      const matchMarkets = markets[pos.matchId] || [];
      const market = matchMarkets.find(m => m.id === pos.marketId);
      const outcome = market?.outcomes.find(o => o.id === pos.outcomeId);
      if (outcome) {
        pos.currentPrice = outcome.odds;
        value += pos.shares * outcome.odds;
      }
    }
  });
  profile.portfolioValue = Math.round(value * 100) / 100;
}

// AMM Trading Engine
app.post('/api/trade', (req, res) => {
  const { walletAddress, matchId, marketId, outcomeId, type, shares } = req.body;
  
  if (!walletAddress || !matchId || !marketId || !outcomeId || !type || !shares) {
    return res.status(400).json({ error: 'Missing trading parameters' });
  }

  const profile = users[walletAddress];
  if (!profile) return res.status(404).json({ error: 'User profile not found' });

  const match = matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });
  if (match.status === 'COMPLETED') {
    return res.status(400).json({ error: 'Match is already completed and markets are settled.' });
  }

  const matchMarkets = markets[matchId];
  if (!matchMarkets) return res.status(404).json({ error: 'Markets not found for match' });

  const market = matchMarkets.find(m => m.id === marketId);
  if (!market) return res.status(404).json({ error: 'Market not found' });
  if (market.status !== 'ACTIVE') {
    return res.status(400).json({ error: 'Market is currently suspended or settled.' });
  }

  const outcome = market.outcomes.find(o => o.id === outcomeId);
  if (!outcome) return res.status(404).json({ error: 'Outcome not found' });

  const currentPrice = outcome.odds;
  const transactionAmount = shares * currentPrice;

  if (type === 'BUY') {
    if (profile.balance < transactionAmount) {
      return res.status(400).json({ error: `Insufficient USDC balance. Required: $${transactionAmount.toFixed(2)}, Available: $${profile.balance.toFixed(2)}` });
    }

    // Process Cash Deduction
    profile.balance -= transactionAmount;

    // Check for existing open position
    let position = profile.positions.find(p => p.marketId === marketId && p.outcomeId === outcomeId && p.status === 'OPEN');
    if (position) {
      const totalCost = (position.shares * position.avgPrice) + transactionAmount;
      position.shares += shares;
      position.avgPrice = Math.round((totalCost / position.shares) * 100) / 100;
      position.timestamp = new Date().toISOString();
    } else {
      position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        userId: profile.id,
        matchId,
        marketId,
        outcomeId,
        outcomeName: outcome.name,
        marketQuestion: market.question,
        matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
        shares,
        avgPrice: currentPrice,
        currentPrice,
        status: 'OPEN',
        timestamp: new Date().toISOString()
      };
      profile.positions.unshift(position);
    }

    // Add Transaction Log
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: profile.id,
      matchId,
      marketId,
      outcomeId,
      outcomeName: outcome.name,
      marketQuestion: market.question,
      type: 'BUY',
      shares,
      price: currentPrice,
      amount: transactionAmount,
      timestamp: new Date().toISOString()
    };
    profile.transactions.unshift(tx);

    // Apply AMM odds shift (Buying pushes price up, shifts others down)
    const priceShift = 0.03 * (shares / 20000); // AMM multiplier
    outcome.probability = Math.min(0.95, outcome.probability + priceShift);

    // Normalize other outcomes
    const remainingProb = 1.0 - outcome.probability;
    const others = market.outcomes.filter(o => o.id !== outcomeId);
    const currentOthersSum = others.reduce((s, o) => s + o.probability, 0);

    others.forEach(o => {
      o.probability = (o.probability / currentOthersSum) * remainingProb;
      o.probability = Math.max(0.01, Math.min(0.99, o.probability));
    });

    // Recalculate odds values
    market.outcomes.forEach(o => {
      o.odds = Math.round(o.probability * 100) / 100;
    });

    // Volume & Liquidity Increase
    market.volume += transactionAmount;
    market.liquidity += (transactionAmount * 0.4);

    // Log the trade in system feed
    const systemLog: SystemFeedLog = {
      id: `log_trade_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'EVENT',
      message: `User ${walletAddress.slice(0, 8)}... bought ${shares} shares of "${outcome.name}" at $${currentPrice.toFixed(2)} (Total Volume: $${market.volume.toFixed(0)})`
    };
    systemLogs.push(systemLog);

    // Broadcast update to all listeners
    broadcastSSE('MATCH_UPDATE', matches);
    broadcastSSE('MARKET_UPDATE', { matchId, markets: matchMarkets });
    broadcastSSE('LOG', systemLog);
    broadcastSSE('USER_UPDATE', { walletAddress, profile });

    recalculatePortfolioValue(profile);
    return res.json({ success: true, profile, transaction: tx });

  } else if (type === 'SELL') {
    const position = profile.positions.find(p => p.marketId === marketId && p.outcomeId === outcomeId && p.status === 'OPEN');
    if (!position || position.shares < shares) {
      return res.status(400).json({ error: 'Insufficient shares to sell.' });
    }

    const salePayout = shares * currentPrice;

    // Deduct shares & Add cash
    position.shares -= shares;
    profile.balance += salePayout;

    if (position.shares === 0) {
      position.status = 'CLOSED';
    }

    // Add Transaction Log
    const tx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      userId: profile.id,
      matchId,
      marketId,
      outcomeId,
      outcomeName: outcome.name,
      marketQuestion: market.question,
      type: 'SELL',
      shares,
      price: currentPrice,
      amount: salePayout,
      timestamp: new Date().toISOString()
    };
    profile.transactions.unshift(tx);

    // Apply AMM odds shift (Selling pushes price down, shifts others up)
    const priceShift = 0.03 * (shares / 20000);
    outcome.probability = Math.max(0.05, outcome.probability - priceShift);

    // Normalize other outcomes
    const remainingProb = 1.0 - outcome.probability;
    const others = market.outcomes.filter(o => o.id !== outcomeId);
    const currentOthersSum = others.reduce((s, o) => s + o.probability, 0);

    others.forEach(o => {
      o.probability = (o.probability / currentOthersSum) * remainingProb;
      o.probability = Math.max(0.01, Math.min(0.99, o.probability));
    });

    // Recalculate odds
    market.outcomes.forEach(o => {
      o.odds = Math.round(o.probability * 100) / 100;
    });

    // Volume Adjustment
    market.volume += salePayout;

    // Log in system logs
    const systemLog: SystemFeedLog = {
      id: `log_trade_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'EVENT',
      message: `User ${walletAddress.slice(0, 8)}... sold ${shares} shares of "${outcome.name}" at $${currentPrice.toFixed(2)} (Cash Received: $${salePayout.toFixed(2)})`
    };
    systemLogs.push(systemLog);

    broadcastSSE('MATCH_UPDATE', matches);
    broadcastSSE('MARKET_UPDATE', { matchId, markets: matchMarkets });
    broadcastSSE('LOG', systemLog);
    broadcastSSE('USER_UPDATE', { walletAddress, profile });

    recalculatePortfolioValue(profile);
    return res.json({ success: true, profile, transaction: tx });
  }

  res.status(400).json({ error: 'Invalid trade type' });
});

// Automated Settle Action for a Match
function settleMatchMarkets(matchId: string) {
  const match = matches.find(m => m.id === matchId);
  if (!match) return;

  const matchMarkets = markets[matchId];
  if (!matchMarkets) return;

  const homeScore = match.homeScore;
  const awayScore = match.awayScore;

  const logs: string[] = [];
  const resolvedMarketsList: SettlementProof['resolvedMarkets'] = [];

  matchMarkets.forEach(market => {
    if (market.status === 'SETTLED') return;

    let winningOutcomeId = '';
    let winningOutcomeName = '';

    if (market.type === 'MATCH_WINNER') {
      if (homeScore > awayScore) {
        winningOutcomeId = 'home';
        winningOutcomeName = match.homeTeam;
      } else if (awayScore > homeScore) {
        winningOutcomeId = 'away';
        winningOutcomeName = match.awayTeam;
      } else {
        winningOutcomeId = 'draw';
        winningOutcomeName = 'Draw';
      }
    } else if (market.type === 'TOTAL_GOALS') {
      const over = (homeScore + awayScore) > 2.5;
      winningOutcomeId = over ? 'over_2.5' : 'under_2.5';
      winningOutcomeName = over ? 'Over 2.5 Goals' : 'Under 2.5 Goals';
    } else if (market.type === 'BOTH_TEAMS_TO_SCORE') {
      const yes = homeScore > 0 && awayScore > 0;
      winningOutcomeId = yes ? 'btts_yes' : 'btts_no';
      winningOutcomeName = yes ? 'Yes' : 'No';
    } else if (market.type === 'FIRST_GOAL_SCORER') {
      const firstGoal = match.events.find(ev => ev.type === 'GOAL');
      if (firstGoal) {
        if (firstGoal.team === 'HOME') {
          winningOutcomeId = 'home_star';
          winningOutcomeName = firstGoal.player;
        } else {
          winningOutcomeId = 'away_star';
          winningOutcomeName = firstGoal.player;
        }
      } else {
        winningOutcomeId = 'no_goalscorer';
        winningOutcomeName = 'No Goalscorer';
      }
    }

    // Mark winning/losing outcomes
    market.outcomes.forEach(out => {
      out.resolved = true;
      out.isWinner = (out.id === winningOutcomeId);
    });

    market.status = 'SETTLED';
    resolvedMarketsList.push({
      marketId: market.id,
      question: market.question,
      winningOutcomeId,
      winningOutcomeName
    });

    logs.push(`Resolved market "${market.question}" to winning outcome "${winningOutcomeName}"`);
  });

  // Calculate & Issue User Payouts
  Object.keys(users).forEach(wallet => {
    const profile = users[wallet];
    let profileUpdated = false;

    profile.positions.forEach(pos => {
      if (pos.matchId === matchId && pos.status === 'OPEN') {
        const resolvedMarket = resolvedMarketsList.find(rm => rm.marketId === pos.marketId);
        if (resolvedMarket) {
          pos.status = 'SETTLED';
          if (pos.outcomeId === resolvedMarket.winningOutcomeId) {
            // Winning shares payout $1.00 each
            const payoutAmount = pos.shares * 1.00;
            pos.payout = payoutAmount;
            profile.balance += payoutAmount;
            
            // Log user transaction payout
            profile.transactions.unshift({
              id: `payout_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
              userId: profile.id,
              matchId,
              marketId: pos.marketId,
              outcomeId: pos.outcomeId,
              outcomeName: pos.outcomeName,
              marketQuestion: pos.marketQuestion,
              type: 'SELL', // Settle acts as a sell/redemption at $1.00
              shares: pos.shares,
              price: 1.00,
              amount: payoutAmount,
              timestamp: new Date().toISOString()
            });
            profileUpdated = true;
          } else {
            // Losing shares payout $0.00
            pos.payout = 0;
            profileUpdated = true;
          }
        }
      }
    });

    if (profileUpdated) {
      recalculatePortfolioValue(profile);
      broadcastSSE('USER_UPDATE', { walletAddress: wallet, profile });
    }
  });

  // Create Verifiable Cryptographic Settlement Proof Record
  const baseProof: Omit<SettlementProof, 'signature' | 'validationHash'> = {
    id: `proof_${matchId}`,
    matchId,
    matchTitle: `${match.homeTeam} vs ${match.awayTeam}`,
    completedAt: new Date().toISOString(),
    homeScore,
    awayScore,
    resolvedMarkets: resolvedMarketsList,
    feedSource: 'TxLINE_SSE_STREAM',
    timestamp: new Date().toISOString(),
    status: 'VERIFIED'
  };

  const { hash, signature } = generateProofHash(baseProof);
  const finalProof: SettlementProof = {
    ...baseProof,
    signature,
    validationHash: hash
  };

  settlements.unshift(finalProof);

  // System Feed Logs
  const settlementLog: SystemFeedLog = {
    id: `log_settle_${Date.now()}`,
    timestamp: new Date().toISOString(),
    type: 'SETTLEMENT',
    message: `AUTOMATED SETTLEMENT COMPLETED: ${match.homeTeam} ${homeScore}-${awayScore} ${match.awayTeam}. Resolved 4 markets with verifiable hash ${hash.slice(0, 10)}...`,
    payload: finalProof
  };
  systemLogs.push(settlementLog);

  // Broadcast all settled items
  broadcastSSE('MATCH_UPDATE', matches);
  broadcastSSE('MARKET_UPDATE', { matchId, markets: matchMarkets });
  broadcastSSE('PROOF_UPDATE', settlements);
  broadcastSSE('LOG', settlementLog);
}

// Admin / Demo Simulation Controls
app.post('/api/admin/action', (req, res) => {
  const { action, matchId, data } = req.body;

  if (action === 'RELOAD_DATA') {
    return res.json({ success: true, message: 'Data reload triggered.' });
  }

  if (action === 'RESET_DB') {
    // Completely restore preseeded states
    matches = JSON.parse(JSON.stringify(SEEDED_MATCHES));
    markets = {};
    matches.forEach(m => {
      markets[m.id] = generateMarketsForMatch(m.id, m.homeTeam, m.awayTeam, m.status);
    });
    settlements = JSON.parse(JSON.stringify(SEEDED_PROOFS));
    systemLogs = [
      { id: `log_init_${Date.now()}`, timestamp: new Date().toISOString(), type: 'INFO', message: 'Data state reset to initial pre-seeded values.' }
    ];

    // Reset user balances and positions for demo convenience
    Object.keys(users).forEach(wallet => {
      const u = users[wallet];
      u.balance = 100000;
      u.portfolioValue = 0;
      u.positions = [];
      u.transactions = [];
    });

    // Reset replay simulation if active
    if (simState.intervalId) {
      clearInterval(simState.intervalId);
    }
    simState = { isActive: false, step: 0 };

    broadcastSSE('MATCH_UPDATE', matches);
    broadcastSSE('MARKET_UPDATE', null);
    broadcastSSE('PROOF_UPDATE', settlements);
    broadcastSSE('LOG', systemLogs[0]);
    
    // Broadcast back profile updates for the loaded profile
    const logs: SystemFeedLog = { id: `log_res_${Date.now()}`, timestamp: new Date().toISOString(), type: 'INFO', message: 'All connected trial wallets successfully reset to $100,000 USDC.' };
    systemLogs.push(logs);
    broadcastSSE('LOG', logs);

    return res.json({ success: true, message: 'GoalMarket database state fully reset.' });
  }

  if (action === 'MANUAL_EVENT') {
    const { eventType, team, player, detail } = data;
    const match = matches.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status !== 'LIVE') return res.status(400).json({ error: 'Events can only be injected into live matches.' });

    const newEvent: MatchEvent = {
      id: `ev_manual_${Date.now()}`,
      minute: match.minute || 1,
      type: eventType,
      team,
      player,
      detail: detail || ''
    };

    match.events.push(newEvent);

    if (eventType === 'GOAL') {
      if (team === 'HOME') match.homeScore += 1;
      else match.awayScore += 1;

      // Adjust Winner odds slightly based on goals
      const matchMarkets = markets[matchId];
      if (matchMarkets) {
        const winnerMarket = matchMarkets.find(m => m.type === 'MATCH_WINNER');
        if (winnerMarket) {
          const homeOutcome = winnerMarket.outcomes.find(o => o.id === 'home');
          const awayOutcome = winnerMarket.outcomes.find(o => o.id === 'away');
          const drawOutcome = winnerMarket.outcomes.find(o => o.id === 'draw');

          if (homeOutcome && awayOutcome && drawOutcome) {
            if (team === 'HOME') {
              homeOutcome.probability = Math.min(0.92, homeOutcome.probability + 0.15);
              awayOutcome.probability = Math.max(0.04, awayOutcome.probability - 0.12);
              drawOutcome.probability = Math.max(0.04, drawOutcome.probability - 0.03);
            } else {
              awayOutcome.probability = Math.min(0.92, awayOutcome.probability + 0.15);
              homeOutcome.probability = Math.max(0.04, homeOutcome.probability - 0.12);
              drawOutcome.probability = Math.max(0.04, drawOutcome.probability - 0.03);
            }
            
            // Normalize sum
            const sum = homeOutcome.probability + awayOutcome.probability + drawOutcome.probability;
            homeOutcome.probability /= sum;
            awayOutcome.probability /= sum;
            drawOutcome.probability /= sum;

            winnerMarket.outcomes.forEach(o => {
              o.odds = Math.round(o.probability * 100) / 100;
            });
          }
        }
      }
    }

    const log: SystemFeedLog = {
      id: `log_ev_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'EVENT',
      message: `[TxLINE Stream Feed] Live Match Event in ${match.homeTeam} vs ${match.awayTeam}: ${eventType} for ${team} team by ${player} (${detail || 'No description'}).`
    };
    systemLogs.push(log);

    broadcastSSE('MATCH_UPDATE', matches);
    if (markets[matchId]) broadcastSSE('MARKET_UPDATE', { matchId, markets: markets[matchId] });
    broadcastSSE('LOG', log);

    return res.json({ success: true, match });
  }

  if (action === 'COMPLETE_MATCH') {
    const match = matches.find(m => m.id === matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    if (match.status === 'COMPLETED') return res.status(400).json({ error: 'Match already completed.' });

    match.status = 'COMPLETED';
    match.endTime = new Date().toISOString();
    match.events.push({
      id: `ev_fulltime_${Date.now()}`,
      minute: 90,
      type: 'FULL_TIME',
      player: 'Match Finished'
    });

    const log: SystemFeedLog = {
      id: `log_ft_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'INFO',
      message: `[TxLINE FEED] Official Full-Time whistle. Match ${match.homeTeam} vs ${match.awayTeam} completed. Final Score: ${match.homeScore}-${match.awayScore}.`
    };
    systemLogs.push(log);
    broadcastSSE('LOG', log);

    // Run automatic market settlement
    settleMatchMarkets(matchId);

    return res.json({ success: true, match });
  }

  if (action === 'START_LIVE_REPLAY') {
    // Settle / Cancel any previous running simulation loops
    if (simState.intervalId) clearInterval(simState.intervalId);

    simState.isActive = true;
    simState.step = 0;

    // Initialize Match 2 (Argentina vs France) to LIVE
    const targetMatch = matches.find(m => m.id === 'match_2');
    if (!targetMatch) return res.status(404).json({ error: 'Argentina vs France match seed not found' });

    targetMatch.status = 'LIVE';
    targetMatch.minute = 1;
    targetMatch.homeScore = 0;
    targetMatch.awayScore = 0;
    targetMatch.events = [{ id: 'ev_sim_start', minute: 1, type: 'START', player: 'Match Kick-off' }];

    // Reset Markets for Argentina vs France
    markets['match_2'] = generateMarketsForMatch('match_2', 'Argentina', 'France', 'LIVE');

    const startLog: SystemFeedLog = {
      id: `log_sim_${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'INFO',
      message: '🚨 LIVE simulation stream of Argentina vs France began. Pushing live World Cup telemetry via TxLINE SSE feed.'
    };
    systemLogs.push(startLog);
    
    broadcastSSE('MATCH_UPDATE', matches);
    broadcastSSE('MARKET_UPDATE', { matchId: 'match_2', markets: markets['match_2'] });
    broadcastSSE('LOG', startLog);

    // Scripted events for fast-forward World Cup Replay (Argentina vs France)
    const SIMULATED_TIMELINE_STEPS = [
      { minute: 12, type: 'INFO', message: 'Match pacing: France establishing heavy high-press lines. Argentina counter-attacking.' },
      {
        minute: 23,
        type: 'GOAL',
        team: 'HOME',
        player: 'Lionel Messi',
        detail: 'Incredible penalty penalty kick into the top left corners.',
        log: '⚽ GOAL! Argentina 1 - 0 France. Lionel Messi converts the penalty!'
      },
      { minute: 30, type: 'YELLOW_CARD', team: 'AWAY', player: 'Kylian Mbappé', detail: 'Foul on Rodrigo De Paul' },
      {
        minute: 36,
        type: 'GOAL',
        team: 'HOME',
        player: 'Ángel Di María',
        detail: 'Sensational counter-attack sweep, assisted by Alexis Mac Allister.',
        log: '⚽ GOAL! Argentina 2 - 0 France. Ángel Di María doubles the lead!'
      },
      { minute: 45, type: 'HALF_TIME', player: 'Half-time whistle' },
      { minute: 60, type: 'INFO', message: 'France making double substitution: Kolo Muani & Marcus Thuram replace Giroud & Dembélé.' },
      {
        minute: 80,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Kylian Mbappé',
        detail: 'Thumping penalty under Martinez\'s outstretched hand.',
        log: '⚽ GOAL! Argentina 2 - 1 France. Mbappé pulls one back from the spot!'
      },
      {
        minute: 81,
        type: 'GOAL',
        team: 'AWAY',
        player: 'Kylian Mbappé',
        detail: 'Exquisite, first-time acrobatic side-volley from Kingsley Coman\'s lofted pass.',
        log: '⚽ GOAL! Argentina 2 - 2 France. SENSATIONAL VOLLEY BY MBAPPÉ TO EQUALIZE!'
      },
      { minute: 88, type: 'YELLOW_CARD', team: 'HOME', player: 'Emiliano Martínez', detail: 'Time wasting warning' },
      { minute: 90, type: 'FULL_TIME', player: 'Official Full Time Whistle Blows' }
    ];

    simState.intervalId = setInterval(() => {
      if (!simState.isActive) {
        if (simState.intervalId) clearInterval(simState.intervalId);
        return;
      }

      const currentStepIdx = simState.step;
      if (currentStepIdx >= SIMULATED_TIMELINE_STEPS.length) {
        // Complete match and Settle markets!
        if (simState.intervalId) clearInterval(simState.intervalId);
        simState.isActive = false;

        targetMatch.status = 'COMPLETED';
        targetMatch.endTime = new Date().toISOString();
        
        const complLog: SystemFeedLog = {
          id: `log_compl_${Date.now()}`,
          timestamp: new Date().toISOString(),
          type: 'INFO',
          message: '🏁 Argentina vs France World Cup Simulation officially completed (2 - 2). Settle Engine starting verifiable proof resolution.'
        };
        systemLogs.push(complLog);
        broadcastSSE('LOG', complLog);

        settleMatchMarkets('match_2');
        return;
      }

      const step = SIMULATED_TIMELINE_STEPS[currentStepIdx];
      targetMatch.minute = step.minute;

      if (step.type === 'GOAL' || step.type === 'YELLOW_CARD' || step.type === 'HALF_TIME' || step.type === 'FULL_TIME') {
        const ev: MatchEvent = {
          id: `ev_sim_${Date.now()}_${currentStepIdx}`,
          minute: step.minute,
          type: step.type as any,
          team: step.team as any,
          player: step.player,
          detail: step.detail
        };
        targetMatch.events.push(ev);

        if (step.type === 'GOAL') {
          if (step.team === 'HOME') targetMatch.homeScore += 1;
          else targetMatch.awayScore += 1;

          // Dynamically shift odds under AMM rule!
          const targetMarkets = markets['match_2'];
          if (targetMarkets) {
            const winnerMarket = targetMarkets.find(m => m.type === 'MATCH_WINNER');
            if (winnerMarket) {
              const home = winnerMarket.outcomes.find(o => o.id === 'home');
              const away = winnerMarket.outcomes.find(o => o.id === 'away');
              const draw = winnerMarket.outcomes.find(o => o.id === 'draw');

              if (home && away && draw) {
                if (targetMatch.homeScore === 1 && targetMatch.awayScore === 0) {
                  home.probability = 0.70;
                  away.probability = 0.12;
                  draw.probability = 0.18;
                } else if (targetMatch.homeScore === 2 && targetMatch.awayScore === 0) {
                  home.probability = 0.88;
                  away.probability = 0.03;
                  draw.probability = 0.09;
                } else if (targetMatch.homeScore === 2 && targetMatch.awayScore === 1) {
                  home.probability = 0.68;
                  away.probability = 0.15;
                  draw.probability = 0.17;
                } else if (targetMatch.homeScore === 2 && targetMatch.awayScore === 2) {
                  home.probability = 0.25;
                  away.probability = 0.25;
                  draw.probability = 0.50;
                }

                winnerMarket.outcomes.forEach(o => {
                  o.odds = Math.round(o.probability * 100) / 100;
                });
              }
            }
          }
        }
      }

      const stepLog: SystemFeedLog = {
        id: `log_sim_step_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: step.type === 'GOAL' ? 'EVENT' : 'INFO',
        message: step.log || `[TxLINE SSE Feed] Argentina vs France Minute ${step.minute}: ${step.message || step.player}`
      };
      systemLogs.push(stepLog);

      broadcastSSE('MATCH_UPDATE', matches);
      broadcastSSE('MARKET_UPDATE', { matchId: 'match_2', markets: markets['match_2'] });
      broadcastSSE('LOG', stepLog);

      simState.step += 1;
    }, 12000); // Progresses simulation step every 12s

    return res.json({ success: true, message: 'Simulated World Cup match stream triggered.' });
  }

  res.status(400).json({ error: 'Unknown admin action' });
});

// Gemini smart sports commentary & analytical matching predictions
app.post('/api/gemini/analyze', async (req, res) => {
  const { matchId } = req.body;
  const match = matches.find(m => m.id === matchId);
  if (!match) return res.status(404).json({ error: 'Match not found' });

  // Fallback if Gemini client is not configured
  if (!ai) {
    const mockAnalysis = `**Pre-match Analytical Model Prediction for ${match.homeTeam} vs ${match.awayTeam}**\n\n* **Expected Probability**: ${match.homeTeam} 48% | ${match.awayTeam} 32% | Draw 20%\n* **Market Sentiment**: Moderate bias toward ${match.homeTeam} on high trading liquidity.\n* **Analysis**: Our statistical models suggest high tactical rigidity. Recommended predicting Over 1.5 Goals with ${match.homeTeam} maintaining possession metrics.`;
    return res.json({ text: mockAnalysis });
  }

  try {
    const matchStatusDetail = match.status === 'LIVE' ? `currently LIVE (${match.homeScore}-${match.awayScore} in min ${match.minute})` : (match.status === 'COMPLETED' ? `completed with final score ${match.homeScore}-${match.awayScore}` : `upcoming`);
    
    const prompt = `You are an elite sports finance analyst and prediction market advisor for Polymarket.
    Provide an analytical, high-quality, quantitative match analysis and smart prediction overview for the World Cup match between ${match.homeTeam} and ${match.awayTeam}.
    The match status is ${matchStatusDetail}.
    
    Structure the output with:
    - **Expected Outcome Probabilities**: Assign professional probability ranges (e.g. 45% / 35% / 20%).
    - **Market Depth & Trading Sentiment**: Mention how smart prediction traders should approach "Team to Win" and "Over/Under Goals" markets.
    - **Tactical Breakdown**: Provide a very brief tactical reason (e.g., offense vs defense).
    
    Ensure the output is written in clean, punchy Markdown display formatting. Do not include excessive introductory chatter. Keep it under 250 words total.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    res.json({ text: response.text });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Gemini API call failed' });
  }
});

// Serve Frontend Vite / Static Assets
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    // Vite Dev Server Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[GoalMarket Server] Running at http://localhost:${PORT}`);
  });
}

startServer();
