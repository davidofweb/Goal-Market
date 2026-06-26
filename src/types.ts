export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  group: string;
  status: 'UPCOMING' | 'LIVE' | 'COMPLETED';
  homeScore: number;
  awayScore: number;
  minute: number;
  startTime: string; // ISO string
  endTime?: string;
  events: MatchEvent[];
}

export interface MatchEvent {
  id: string;
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'HALF_TIME' | 'FULL_TIME' | 'START';
  team?: 'HOME' | 'AWAY';
  player: string;
  detail?: string;
}

export interface PredictionMarket {
  id: string;
  matchId: string;
  type: 'MATCH_WINNER' | 'TOTAL_GOALS' | 'BOTH_TEAMS_TO_SCORE' | 'FIRST_GOAL_SCORER';
  question: string;
  description: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'SETTLED';
  volume: number;
  liquidity: number;
  countdownMinutes?: number;
  outcomes: Outcome[];
}

export interface Outcome {
  id: string; // e.g., 'home_win', 'away_win', 'draw', 'over_2.5', 'under_2.5', etc.
  name: string; // e.g., 'Argentina', 'France', 'Draw', 'Over 2.5', 'Yes', 'No'
  probability: number; // between 0.01 and 0.99 (represents 1% to 99%)
  odds: number; // display price, e.g., $0.54 (matching Polymarket style)
  resolved?: boolean;
  isWinner?: boolean;
}

export interface UserPosition {
  id: string;
  userId: string;
  matchId: string;
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  marketQuestion: string;
  matchTitle: string;
  shares: number;
  avgPrice: number; // e.g., $0.54
  currentPrice: number; // current odds
  status: 'OPEN' | 'CLOSED' | 'SETTLED';
  payout?: number;
  timestamp: string;
}

export interface Transaction {
  id: string;
  userId: string;
  matchId: string;
  marketId: string;
  outcomeId: string;
  outcomeName: string;
  marketQuestion: string;
  type: 'BUY' | 'SELL';
  shares: number;
  price: number;
  amount: number; // shares * price
  timestamp: string;
}

export interface SettlementProof {
  id: string;
  matchId: string;
  matchTitle: string;
  completedAt: string;
  homeScore: number;
  awayScore: number;
  resolvedMarkets: {
    marketId: string;
    question: string;
    winningOutcomeId: string;
    winningOutcomeName: string;
  }[];
  feedSource: 'TxLINE_SSE_STREAM' | 'TxLINE_WORLD_CUP_API_V4';
  timestamp: string;
  signature: string; // Cryptographic-like proof signature
  validationHash: string; // Verification SHA-256 hash
  status: 'VERIFIED' | 'PENDING';
}

export interface UserProfile {
  id: string;
  email?: string;
  loginMethod: 'GOOGLE' | 'EMAIL' | 'WALLET' | null;
  walletAddress: string;
  privateKey?: string;
  balance: number; // Simulated USDC
  portfolioValue: number;
  positions: UserPosition[];
  transactions: Transaction[];
  createdAt: string;
}

export interface SystemFeedLog {
  id: string;
  timestamp: string;
  type: 'INFO' | 'EVENT' | 'ERROR' | 'SETTLEMENT';
  message: string;
  payload?: any;
}
