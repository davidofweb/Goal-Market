import crypto from 'crypto';
import { Match, MatchEvent, PredictionMarket, Outcome, SystemFeedLog } from '../types';
import { generateMarketsForMatch } from '../mockData';

// TXODDS Feed Interface
export interface TxOddsFixture {
  fid: string;
  match_date: string;
  sport: string;
  league_name: string;
  home_team: string;
  away_team: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  score: string; // "H-A" e.g., "1-1"
  minute: number;
  odds: {
    provider: string;
    market: string; // "1x2"
    home: string; // decimal odds
    away: string; // decimal odds
    draw: string; // decimal odds
    timestamp: string;
  }[];
}

export interface TxOddsFeedResponse {
  status: 'success' | 'error';
  version: string;
  client: string;
  mode: 'REAL' | 'SIMULATED';
  timestamp: string;
  results: TxOddsFixture[];
}

// In-Memory Config State
let txoddsClient = process.env.TXODDS_CLIENT || '';
let txoddsIdent = process.env.TXODDS_IDENT || '';
let txoddsMode: 'REAL' | 'SIMULATED' = (txoddsClient && txoddsIdent) ? 'REAL' : 'SIMULATED';

// Pre-seeded list of TXODDS simulated matches to feed the AMM prediction engine
let simulatedTxOddsFixtures: TxOddsFixture[] = [
  {
    fid: 'match_1',
    match_date: new Date(Date.now() - 64 * 60 * 1000).toISOString(),
    sport: 'Soccer',
    league_name: 'FIFA World Cup 2026',
    home_team: 'Brazil',
    away_team: 'Germany',
    status: 'LIVE',
    score: '1-1',
    minute: 64,
    odds: [
      {
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: '1.61',
        away: '5.55',
        draw: '3.10',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    fid: 'match_2',
    match_date: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
    sport: 'Soccer',
    league_name: 'FIFA World Cup 2026',
    home_team: 'Argentina',
    away_team: 'France',
    status: 'UPCOMING',
    score: '0-0',
    minute: 0,
    odds: [
      {
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: '2.10',
        away: '3.10',
        draw: '3.20',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    fid: 'match_3',
    match_date: new Date(Date.now() + 120 * 60 * 1000).toISOString(),
    sport: 'Soccer',
    league_name: 'FIFA World Cup 2026',
    home_team: 'England',
    away_team: 'Spain',
    status: 'UPCOMING',
    score: '0-0',
    minute: 0,
    odds: [
      {
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: '2.50',
        away: '2.80',
        draw: '2.95',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    fid: 'match_4',
    match_date: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    sport: 'Soccer',
    league_name: 'FIFA World Cup 2026',
    home_team: 'Portugal',
    away_team: 'Morocco',
    status: 'COMPLETED',
    score: '2-1',
    minute: 90,
    odds: [
      {
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: '1.00',
        away: '99.00',
        draw: '99.00',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    fid: 'match_5',
    match_date: new Date(Date.now() + 240 * 60 * 1000).toISOString(),
    sport: 'Soccer',
    league_name: 'FIFA World Cup 2026',
    home_team: 'USA',
    away_team: 'Netherlands',
    status: 'UPCOMING',
    score: '0-0',
    minute: 0,
    odds: [
      {
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: '3.80',
        away: '1.85',
        draw: '3.40',
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    fid: 'match_6',
    match_date: new Date(Date.now() + 1440 * 60 * 1000).toISOString(),
    sport: 'Soccer',
    league_name: 'FIFA World Cup 2026',
    home_team: 'Croatia',
    away_team: 'Belgium',
    status: 'UPCOMING',
    score: '0-0',
    minute: 0,
    odds: [
      {
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: '2.70',
        away: '2.60',
        draw: '3.10',
        timestamp: new Date().toISOString()
      }
    ]
  }
];

// Helper to convert decimal odds to Polymarket style display probabilities / prices ($0.01 - $0.99)
function decimalToProbability(decimalOdds: string | number): number {
  const dec = typeof decimalOdds === 'string' ? parseFloat(decimalOdds) : decimalOdds;
  if (isNaN(dec) || dec <= 1) return 0.33;
  // probability = 1 / decimalOdds
  const rawProb = 1 / dec;
  return Math.min(0.99, Math.max(0.01, Math.round(rawProb * 100) / 100));
}

// Get/Set methods for Admin Dashboard configuration
export function getTxOddsConfig() {
  return {
    client: txoddsClient,
    ident: txoddsIdent ? '••••••••••••••••' : '',
    hasIdent: !!txoddsIdent,
    mode: txoddsMode
  };
}

export function updateTxOddsConfig(client: string, ident: string, mode: 'REAL' | 'SIMULATED') {
  txoddsClient = client;
  if (ident && ident !== '••••••••••••••••') {
    txoddsIdent = ident;
  }
  txoddsMode = mode;
  return getTxOddsConfig();
}

// Generates the JSON feed from real API or simulated fixtures
export async function fetchTxOddsFeed(): Promise<TxOddsFeedResponse> {
  const timestamp = new Date().toISOString();

  if (txoddsMode === 'REAL' && txoddsClient && txoddsIdent) {
    try {
      // Connect to the genuine TXODDS sports feed API with credentials
      const response = await fetch(`https://api.txodds.com/api/v2/fixtures?client=${encodeURIComponent(txoddsClient)}&ident=${encodeURIComponent(txoddsIdent)}&sport=Soccer&league=world_cup_2026`, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GoalMarket-VERIFIABLE-ENGINE/1.0'
        }
      });

      if (response.ok) {
        const rawData = await response.json();
        return {
          status: 'success',
          version: '2.4',
          client: txoddsClient,
          mode: 'REAL',
          timestamp,
          results: rawData.results || []
        };
      } else {
        throw new Error(`TXODDS API responded with error status ${response.status}`);
      }
    } catch (e: any) {
      console.error('[TXODDS Service Error] Direct API fetch failed, falling back to secure simulated feed:', e.message);
      // Fallback beautifully so service remains active and resilient
    }
  }

  // SIMULATED mode or fallback: flutters odds slightly to simulate live feed activity
  const updatedSimulatedFixtures = simulatedTxOddsFixtures.map(fixture => {
    if (fixture.status === 'LIVE') {
      // Fluctuate live match minute and score occasionally
      fixture.minute = Math.min(90, fixture.minute + (Math.random() > 0.7 ? 1 : 0));
      
      const [hStr, aStr] = fixture.score.split('-');
      let h = parseInt(hStr);
      let a = parseInt(aStr);
      if (Math.random() > 0.98 && fixture.minute < 90) {
        if (Math.random() > 0.5) h += 1;
        else a += 1;
        fixture.score = `${h}-${a}`;
      }

      // Shift simulated bet365/txodds odds based on game state
      const totalScore = h + a;
      const hOdd = Math.max(1.05, 1.6 + (a - h) * 1.5 + (Math.random() - 0.5) * 0.2);
      const aOdd = Math.max(1.05, 3.5 + (h - a) * 2.0 + (Math.random() - 0.5) * 0.4);
      const dOdd = Math.max(1.05, 2.8 + totalScore * 0.5 + (Math.random() - 0.5) * 0.3);

      fixture.odds = [{
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: hOdd.toFixed(2),
        away: aOdd.toFixed(2),
        draw: dOdd.toFixed(2),
        timestamp: new Date().toISOString()
      }];
    } else if (fixture.status === 'UPCOMING') {
      // Randomly flutter prematch odds a tiny bit
      const currentOdds = fixture.odds[0];
      const homeVal = Math.max(1.1, parseFloat(currentOdds.home) + (Math.random() - 0.5) * 0.05);
      const awayVal = Math.max(1.1, parseFloat(currentOdds.away) + (Math.random() - 0.5) * 0.08);
      const drawVal = Math.max(1.1, parseFloat(currentOdds.draw) + (Math.random() - 0.5) * 0.06);

      fixture.odds = [{
        provider: 'TX_ODDS_PRO',
        market: '1x2',
        home: homeVal.toFixed(2),
        away: awayVal.toFixed(2),
        draw: drawVal.toFixed(2),
        timestamp: new Date().toISOString()
      }];
    }
    return fixture;
  });

  simulatedTxOddsFixtures = updatedSimulatedFixtures;

  return {
    status: 'success',
    version: '2.4',
    client: txoddsClient || 'SIM_DEMO_CLIENT',
    mode: 'SIMULATED',
    timestamp,
    results: simulatedTxOddsFixtures
  };
}

// Ingests matches, updates scores, synchronizes live odds and AMM pricing model
export function ingestTxOddsFeedData(
  feed: TxOddsFeedResponse,
  matches: Match[],
  markets: { [matchId: string]: PredictionMarket[] },
  systemLogs: SystemFeedLog[],
  broadcastSSE: (type: string, data: any) => void
): { updatedCount: number; addedCount: number } {
  let updatedCount = 0;
  let addedCount = 0;

  feed.results.forEach(txFixture => {
    let match = matches.find(m => m.id === txFixture.fid);

    if (!match) {
      // DYNAMIC INGEST: Add match on the fly if it is new to our prediction board!
      const startTimeISO = new Date(txFixture.match_date).toISOString();
      const [homeScore, awayScore] = txFixture.score.split('-').map(s => parseInt(s) || 0);

      const flagMap: { [team: string]: string } = {
        'Croatia': '🇭🇷', 'Belgium': '🇧🇪', 'Brazil': '🇧🇷', 'Germany': '🇩🇪',
        'Argentina': '🇦🇷', 'France': '🇫🇷', 'England': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'Spain': '🇪🇸',
        'Portugal': '🇵🇹', 'Morocco': '🇲🇦', 'USA': '🇺🇸', 'Netherlands': '🇳🇱'
      };

      match = {
        id: txFixture.fid,
        homeTeam: txFixture.home_team,
        awayTeam: txFixture.away_team,
        homeFlag: flagMap[txFixture.home_team] || '🏳️',
        awayFlag: flagMap[txFixture.away_team] || '🏳️',
        group: 'FIFA Group Stage',
        status: txFixture.status,
        homeScore,
        awayScore,
        minute: txFixture.minute,
        startTime: startTimeISO,
        events: []
      };

      matches.push(match);
      markets[match.id] = generateMarketsForMatch(match.id, match.homeTeam, match.awayTeam, match.status);
      addedCount++;

      const ingestLog: SystemFeedLog = {
        id: `log_ingest_add_${Date.now()}_${match.id}`,
        timestamp: new Date().toISOString(),
        type: 'INFO',
        message: `🆕 [TXODDS INGESTION] Discovered new fixture: ${match.homeTeam} vs ${match.awayTeam}. Seeded prediction markets and liquidity pools.`
      };
      systemLogs.push(ingestLog);
      broadcastSSE('LOG', ingestLog);
    } else {
      // Update scores, timeline minute, and game status
      const [homeScore, awayScore] = txFixture.score.split('-').map(s => parseInt(s) || 0);
      
      let changed = false;
      if (match.status !== txFixture.status) {
        match.status = txFixture.status;
        changed = true;
      }
      if (match.homeScore !== homeScore || match.awayScore !== awayScore) {
        // Record automated goal timeline event
        const homeGoal = homeScore > match.homeScore;
        const scorerTeam = homeGoal ? 'HOME' : 'AWAY';
        const teamName = homeGoal ? match.homeTeam : match.awayTeam;
        
        match.homeScore = homeScore;
        match.awayScore = awayScore;
        changed = true;

        const goalEvent: MatchEvent = {
          id: `ev_txodds_goal_${Date.now()}_${match.id}`,
          minute: txFixture.minute || 1,
          type: 'GOAL',
          team: scorerTeam,
          player: `${teamName} Squad`,
          detail: 'Direct verification goal reported via TXODDS real-time feed'
        };
        match.events.push(goalEvent);

        const goalLog: SystemFeedLog = {
          id: `log_goal_${Date.now()}_${match.id}`,
          timestamp: new Date().toISOString(),
          type: 'EVENT',
          message: `⚽ [TXODDS API GOAL] Goal scored in ${match.homeTeam} vs ${match.awayTeam}! Score updated to ${homeScore}-${awayScore} at min ${txFixture.minute}'.`
        };
        systemLogs.push(goalLog);
        broadcastSSE('LOG', goalLog);
      }

      if (match.minute !== txFixture.minute) {
        match.minute = txFixture.minute;
        changed = true;
      }

      if (changed) {
        updatedCount++;
      }
    }

    // Now, synchronize current odds from TXODDS into AMM prediction pool pricing model!
    const oddsObj = txFixture.odds[0];
    if (oddsObj && oddsObj.market === '1x2') {
      const matchMarkets = markets[txFixture.fid];
      if (matchMarkets) {
        const winnerMarket = matchMarkets.find(m => m.type === 'MATCH_WINNER');
        if (winnerMarket && winnerMarket.status === 'ACTIVE') {
          const homeOutcome = winnerMarket.outcomes.find(o => o.id === 'home');
          const awayOutcome = winnerMarket.outcomes.find(o => o.id === 'away');
          const drawOutcome = winnerMarket.outcomes.find(o => o.id === 'draw');

          if (homeOutcome && awayOutcome && drawOutcome) {
            // Translate decimals to probabilities
            const homeProb = decimalToProbability(oddsObj.home);
            const awayProb = decimalToProbability(oddsObj.away);
            const drawProb = decimalToProbability(oddsObj.draw);

            // Normalize so sum is exactly 1.00
            const sum = homeProb + awayProb + drawProb;
            homeOutcome.probability = homeProb / sum;
            awayOutcome.probability = awayProb / sum;
            drawOutcome.probability = drawProb / sum;

            // Re-calculate pricing
            homeOutcome.odds = Math.round(homeOutcome.probability * 100) / 100;
            awayOutcome.odds = Math.round(awayOutcome.probability * 100) / 100;
            drawOutcome.odds = Math.round(drawOutcome.probability * 100) / 100;
          }
        }
      }
    }
  });

  if (updatedCount > 0 || addedCount > 0) {
    broadcastSSE('MATCH_UPDATE', matches);
  }

  return { updatedCount, addedCount };
}
