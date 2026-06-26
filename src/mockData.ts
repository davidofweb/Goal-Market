import { Match, PredictionMarket, SettlementProof } from './types';

export const SEEDED_MATCHES: Match[] = [
  {
    id: 'match_1',
    homeTeam: 'Brazil',
    awayTeam: 'Germany',
    homeFlag: '🇧🇷',
    awayFlag: '🇩🇪',
    group: 'Group A',
    status: 'LIVE',
    homeScore: 1,
    awayScore: 1,
    minute: 64,
    startTime: new Date(Date.now() - 64 * 60 * 1000).toISOString(),
    events: [
      { id: 'ev_1_1', minute: 1, type: 'START', player: 'Match Started' },
      { id: 'ev_1_2', minute: 22, type: 'GOAL', team: 'HOME', player: 'Vinícius Júnior', detail: 'Assist by Neymar' },
      { id: 'ev_1_3', minute: 38, type: 'YELLOW_CARD', team: 'AWAY', player: 'Antonio Rüdiger', detail: 'Foul on Vinícius Júnior' },
      { id: 'ev_1_4', minute: 45, type: 'HALF_TIME', player: 'Half Time' },
      { id: 'ev_1_5', minute: 52, type: 'GOAL', team: 'AWAY', player: 'Florian Wirtz', detail: 'Stunning 25-yard volley' }
    ]
  },
  {
    id: 'match_2',
    homeTeam: 'Argentina',
    awayTeam: 'France',
    homeFlag: '🇦🇷',
    awayFlag: '🇫🇷',
    group: 'Group C',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    startTime: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Starts in 15 mins
    events: []
  },
  {
    id: 'match_3',
    homeTeam: 'England',
    awayTeam: 'Spain',
    homeFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
    awayFlag: '🇪🇸',
    group: 'Group B',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    startTime: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // Starts in 2 hours
    events: []
  },
  {
    id: 'match_4',
    homeTeam: 'Portugal',
    awayTeam: 'Morocco',
    homeFlag: '🇵🇹',
    awayFlag: '🇲🇦',
    group: 'Group D',
    status: 'COMPLETED',
    homeScore: 2,
    awayScore: 1,
    minute: 90,
    startTime: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    events: [
      { id: 'ev_4_1', minute: 1, type: 'START', player: 'Match Started' },
      { id: 'ev_4_2', minute: 14, type: 'GOAL', team: 'HOME', player: 'Cristiano Ronaldo', detail: 'Header from corner kick' },
      { id: 'ev_4_3', minute: 41, type: 'GOAL', team: 'AWAY', player: 'Youssef En-Nesyri', detail: 'Header from assist by Ziyech' },
      { id: 'ev_4_4', minute: 45, type: 'HALF_TIME', player: 'Half Time' },
      { id: 'ev_4_5', minute: 78, type: 'GOAL', team: 'HOME', player: 'Rafael Leão', detail: 'Curled shot inside far post' },
      { id: 'ev_4_6', minute: 90, type: 'FULL_TIME', player: 'Full Time' }
    ]
  },
  {
    id: 'match_5',
    homeTeam: 'USA',
    awayTeam: 'Netherlands',
    homeFlag: '🇺🇸',
    awayFlag: '🇳🇱',
    group: 'Group E',
    status: 'UPCOMING',
    homeScore: 0,
    awayScore: 0,
    minute: 0,
    startTime: new Date(Date.now() + 240 * 60 * 1000).toISOString(), // Starts in 4 hours
    events: []
  }
];

export function generateMarketsForMatch(matchId: string, homeTeam: string, awayTeam: string, status: string): PredictionMarket[] {
  const isCompleted = status === 'COMPLETED';
  
  return [
    {
      id: `${matchId}_winner`,
      matchId,
      type: 'MATCH_WINNER',
      question: `Who will win the match: ${homeTeam} vs ${awayTeam}?`,
      description: 'Settles on official full-time results, including injury time (excludes extra time or penalties).',
      status: isCompleted ? 'SETTLED' : (status === 'LIVE' ? 'ACTIVE' : 'ACTIVE'),
      volume: 124500 + Math.floor(Math.random() * 85000),
      liquidity: 45000 + Math.floor(Math.random() * 20000),
      countdownMinutes: status === 'UPCOMING' ? 120 : undefined,
      outcomes: [
        {
          id: 'home',
          name: homeTeam,
          probability: 0.45,
          odds: 0.45,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? true : false) : undefined
        },
        {
          id: 'away',
          name: awayTeam,
          probability: 0.35,
          odds: 0.35,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? false : false) : undefined
        },
        {
          id: 'draw',
          name: 'Draw',
          probability: 0.20,
          odds: 0.20,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? false : false) : undefined
        }
      ]
    },
    {
      id: `${matchId}_total_goals`,
      matchId,
      type: 'TOTAL_GOALS',
      question: `Will there be over 2.5 goals scored?`,
      description: 'Settles on total goals scored by both teams at full-time.',
      status: isCompleted ? 'SETTLED' : 'ACTIVE',
      volume: 85200 + Math.floor(Math.random() * 50000),
      liquidity: 32000 + Math.floor(Math.random() * 10000),
      outcomes: [
        {
          id: 'over_2.5',
          name: 'Over 2.5 Goals',
          probability: 0.52,
          odds: 0.52,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? true : false) : undefined
        },
        {
          id: 'under_2.5',
          name: 'Under 2.5 Goals',
          probability: 0.48,
          odds: 0.48,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? false : false) : undefined
        }
      ]
    },
    {
      id: `${matchId}_btts`,
      matchId,
      type: 'BOTH_TEAMS_TO_SCORE',
      question: 'Will both teams score in this match?',
      description: 'Both teams must score at least one goal in standard regular time for Yes to win.',
      status: isCompleted ? 'SETTLED' : 'ACTIVE',
      volume: 54100 + Math.floor(Math.random() * 30000),
      liquidity: 20000 + Math.floor(Math.random() * 5000),
      outcomes: [
        {
          id: 'btts_yes',
          name: 'Yes',
          probability: 0.61,
          odds: 0.61,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? true : false) : undefined
        },
        {
          id: 'btts_no',
          name: 'No',
          probability: 0.39,
          odds: 0.39,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? false : false) : undefined
        }
      ]
    },
    {
      id: `${matchId}_first_scorer`,
      matchId,
      type: 'FIRST_GOAL_SCORER',
      question: `Who will score the first goal of the match?`,
      description: 'First goalscorer in regular time. Own goals do not count towards specific players.',
      status: isCompleted ? 'SETTLED' : 'ACTIVE',
      volume: 38400 + Math.floor(Math.random() * 15000),
      liquidity: 12000 + Math.floor(Math.random() * 4000),
      outcomes: [
        {
          id: 'home_star',
          name: homeTeam === 'Brazil' ? 'Vinícius Júnior' : (homeTeam === 'Argentina' ? 'Lionel Messi' : 'Home Star'),
          probability: 0.28,
          odds: 0.28,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? true : false) : undefined
        },
        {
          id: 'away_star',
          name: awayTeam === 'Germany' ? 'Florian Wirtz' : (awayTeam === 'France' ? 'Kylian Mbappé' : 'Away Star'),
          probability: 0.24,
          odds: 0.24,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? false : false) : undefined
        },
        {
          id: 'no_goalscorer',
          name: 'No Goalscorer',
          probability: 0.08,
          odds: 0.08,
          resolved: isCompleted,
          isWinner: isCompleted ? (matchId === 'match_4' ? false : false) : undefined
        }
      ]
    }
  ];
}

export const SEEDED_PROOFS: SettlementProof[] = [
  {
    id: 'proof_match_4',
    matchId: 'match_4',
    matchTitle: 'Portugal vs Morocco',
    completedAt: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    homeScore: 2,
    awayScore: 1,
    resolvedMarkets: [
      {
        marketId: 'match_4_winner',
        question: 'Who will win the match: Portugal vs Morocco?',
        winningOutcomeId: 'home',
        winningOutcomeName: 'Portugal'
      },
      {
        marketId: 'match_4_total_goals',
        question: 'Will there be over 2.5 goals scored?',
        winningOutcomeId: 'over_2.5',
        winningOutcomeName: 'Over 2.5 Goals'
      },
      {
        marketId: 'match_4_btts',
        question: 'Will both teams score in this match?',
        winningOutcomeId: 'btts_yes',
        winningOutcomeName: 'Yes'
      },
      {
        marketId: 'match_4_first_scorer',
        question: 'Who will score the first goal of the match?',
        winningOutcomeId: 'home_star',
        winningOutcomeName: 'Cristiano Ronaldo'
      }
    ],
    feedSource: 'TxLINE_SSE_STREAM',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    signature: '7e23afc5bbda10e8de001a1d9f658a0b0d62c9bf1840efbe7cfa0e768782d92161f38e072b22b781da6f1f8b418a09bc29ad10ef50d87c2f0f498901be802c0c',
    validationHash: 'a589fc10214a1f81d860d2bc4a921d7e2e8b2611e9fa6ca0be7cd2fa0a12e3e9',
    status: 'VERIFIED'
  }
];
