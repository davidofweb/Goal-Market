import React, { useState, useEffect } from 'react';
import { Terminal, Play, RotateCcw, ShieldAlert, Cpu, Radio, ListFilter, Activity, Flame, Settings, RefreshCw, Eye, Database, Network, Server, Key } from 'lucide-react';
import { Match, SystemFeedLog } from '../types';

interface AdminPanelProps {
  matches: Match[];
  logs: SystemFeedLog[];
  onTriggerAction: (action: string, matchId?: string, data?: any) => Promise<boolean>;
}

export default function AdminPanel({ matches, logs, onTriggerAction }: AdminPanelProps) {
  const [selectedMatchId, setSelectedMatchId] = useState<string>(matches[0]?.id || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminMessage, setAdminMessage] = useState('');
  
  // State for manual event injector
  const [eventType, setEventType] = useState<'GOAL' | 'YELLOW_CARD' | 'RED_CARD'>('GOAL');
  const [eventTeam, setEventTeam] = useState<'HOME' | 'AWAY'>('HOME');
  const [playerInput, setPlayerInput] = useState('Lionel Messi');
  const [detailInput, setDetailInput] = useState('Outstanding curling strike');

  // States for TXODDS Data Hub
  const [txClient, setTxClient] = useState('');
  const [txIdent, setTxIdent] = useState('');
  const [txMode, setTxMode] = useState<'REAL' | 'SIMULATED'>('SIMULATED');
  const [rawFeed, setRawFeed] = useState<any>(null);
  const [showFeedDetails, setShowFeedDetails] = useState(false);
  const [isSyncingFeed, setIsSyncingFeed] = useState(false);
  const [configSaving, setConfigSaving] = useState(false);
  const [configMessage, setConfigMessage] = useState('');

  useEffect(() => {
    fetchTxOddsConfig();
  }, []);

  const fetchTxOddsConfig = async () => {
    try {
      const res = await fetch('/api/txodds/config');
      if (res.ok) {
        const data = await res.json();
        setTxClient(data.client || '');
        setTxIdent(data.hasIdent ? '••••••••••••••••' : '');
        setTxMode(data.mode || 'SIMULATED');
      }
    } catch (e) {
      console.error('Failed to load TXODDS config', e);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfigSaving(true);
    setConfigMessage('');
    try {
      const res = await fetch('/api/txodds/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client: txClient.trim(),
          ident: txIdent.trim(),
          mode: txMode
        })
      });
      if (res.ok) {
        const data = await res.json();
        setTxClient(data.client || '');
        setTxIdent(data.hasIdent ? '••••••••••••••••' : '');
        setTxMode(data.mode || 'SIMULATED');
        setConfigMessage('TXODDS Credentials Saved successfully!');
        setTimeout(() => setConfigMessage(''), 3000);
      } else {
        setConfigMessage('Failed to save config.');
      }
    } catch (err: any) {
      setConfigMessage(`Error: ${err.message}`);
    } finally {
      setConfigSaving(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncingFeed(true);
    try {
      const res = await fetch('/api/txodds/sync', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        // Trigger page data reload
        await onTriggerAction('RELOAD_DATA');
        setAdminMessage(`Sync complete. Mode: ${data.mode}. Updated: ${data.updatedCount}, Added: ${data.addedCount}`);
        setTimeout(() => setAdminMessage(''), 4000);
      }
    } catch (e: any) {
      setAdminMessage(`Sync error: ${e.message}`);
    } finally {
      setIsSyncingFeed(false);
    }
  };

  const handleInspectFeed = async () => {
    if (showFeedDetails) {
      setShowFeedDetails(false);
      return;
    }
    try {
      const res = await fetch('/api/txodds/feed');
      if (res.ok) {
        setRawFeed(await res.json());
        setShowFeedDetails(true);
      }
    } catch (e) {
      console.error('Failed to fetch TXODDS raw feed', e);
    }
  };

  const selectedMatch = matches.find(m => m.id === selectedMatchId);

  const handleAdminCommand = async (action: string, matchId?: string, data?: any) => {
    setIsSubmitting(true);
    setAdminMessage('');
    try {
      const success = await onTriggerAction(action, matchId, data);
      if (success) {
        setAdminMessage(`Admin Command "${action}" successfully executed.`);
        setTimeout(() => setAdminMessage(''), 3000);
      } else {
        setAdminMessage('Failed to execute admin directive.');
      }
    } catch (e: any) {
      setAdminMessage(`Error: ${e.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInjectEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMatchId) return;
    
    handleAdminCommand('MANUAL_EVENT', selectedMatchId, {
      eventType,
      team: eventTeam,
      player: playerInput.trim(),
      detail: detailInput.trim()
    });
  };

  return (
    <div className="space-y-6 animate-fade-in" id="admin-workspace-view">
      
      {/* Header */}
      <div className="space-y-2 border-b border-zinc-900 pb-4">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <Terminal className="w-6 h-6 text-blue-400" />
          <span>Oracle Control Workspace</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Orchestrate simulated telemetry pipelines. Trigger live match instances, inject real-time score feeds, run fast-forward settlement simulations, and audit system SSE broadcast streams.
        </p>
      </div>

      {adminMessage && (
        <div className="bg-zinc-900 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400 animate-pulse" />
          <span>{adminMessage}</span>
        </div>
      )}

      {/* Main Grid: Left is controls, Right is System Log Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Controls Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Simulation & Reset Core Panel */}
          <div className="bg-gradient-to-br from-zinc-950 to-blue-950/15 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>World Cup Simulation Scenarios</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Play Argentina vs France Live simulation */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 hover:border-violet-500/30 p-4 rounded-xl flex flex-col justify-between space-y-4 transition-colors">
                <div className="space-y-1">
                  <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Flame className="w-3.5 h-3.5 text-violet-400" /> Auto-Simulation
                  </span>
                  <h4 className="text-xs font-black text-white">France vs Argentina Live Stream</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Kicks off a scripted World Cup replay ticking forward every 12 seconds with live goals, cards, fluctuating AMM odds, and automatic Settlement Engine payouts upon whistle.
                  </p>
                </div>
                
                <button
                  onClick={() => handleAdminCommand('START_LIVE_REPLAY')}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>Launch Live Simulation</span>
                </button>
              </div>

              {/* Reset State Board */}
              <div className="bg-zinc-900/40 border border-zinc-800/80 hover:border-red-500/30 p-4 rounded-xl flex flex-col justify-between space-y-4 transition-colors">
                <div className="space-y-1">
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-red-400" /> State Restoration
                  </span>
                  <h4 className="text-xs font-black text-white">Full Database Reset</h4>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Clears all custom event streams, restores default World Cup matches, archives pre-seeded settlement proofs, and restores connected trial user wallets to $100,000 USDC.
                  </p>
                </div>
                
                <button
                  onClick={() => handleAdminCommand('RESET_DB')}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-red-400 font-bold py-2.5 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Factory Defaults</span>
                </button>
              </div>
            </div>
          </div>

          {/* TXODDS World Cup Data API Hub */}
          <div className="bg-zinc-900/30 border border-zinc-800 rounded-2xl p-5 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                <span>TXODDS World Cup Feed Hub</span>
              </h3>
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${txMode === 'REAL' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${txMode === 'REAL' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {txMode === 'REAL' ? 'TXODDS Direct API' : 'Simulated Sandbox'}
                </span>
              </div>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Synchronize direct real-time sports results, scheduling fixtures, and active market odds directly from the professional **TXODDS sports betting data provider** API endpoints.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Left Column: API Credentials & Mode Toggle */}
              <form onSubmit={handleSaveConfig} className="space-y-4 bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white tracking-wide uppercase text-[10px] flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-zinc-400" /> API Connections Config
                  </span>
                  {configMessage && (
                    <span className="text-[10px] text-emerald-400 font-bold">{configMessage}</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold text-[10px]">Feed Connection Mode</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setTxMode('SIMULATED')}
                      className={`py-2 rounded-lg font-bold text-[10px] uppercase cursor-pointer transition-all ${txMode === 'SIMULATED' ? 'bg-amber-500/10 border border-amber-500/40 text-amber-400 font-extrabold' : 'bg-zinc-900 border border-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Simulated Sandbox
                    </button>
                    <button
                      type="button"
                      onClick={() => setTxMode('REAL')}
                      className={`py-2 rounded-lg font-bold text-[10px] uppercase cursor-pointer transition-all ${txMode === 'REAL' ? 'bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 font-extrabold' : 'bg-zinc-900 border border-zinc-900 text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Production API
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold text-[10px] block">TXODDS Client ID</label>
                    <input
                      type="text"
                      placeholder="e.g. bwc_ex_client"
                      value={txClient}
                      onChange={(e) => setTxClient(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 outline-none focus:border-emerald-500 font-medium font-mono text-[11px]"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-zinc-500 uppercase font-bold text-[10px] block">TXODDS Secret Ident</label>
                    <input
                      type="password"
                      placeholder="Ident Token"
                      value={txIdent}
                      onChange={(e) => setTxIdent(e.target.value)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-zinc-300 outline-none focus:border-emerald-500 font-medium text-[11px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={configSaving}
                  className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-emerald-400 font-bold py-2 rounded-lg text-[11px] cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Credentials & Mode</span>
                </button>
              </form>

              {/* Right Column: Execution Operations */}
              <div className="space-y-4 bg-zinc-950/40 border border-zinc-900 p-4 rounded-xl flex flex-col justify-between text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-white uppercase text-[10px] block tracking-wide">Telemetry Operations</span>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Trigger an immediate feed ingestion pull. This queries the target provider, processes fixtures and live odds, updates existing schedules, and broadcasts real-time updates.
                  </p>
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    onClick={handleManualSync}
                    disabled={isSyncingFeed}
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingFeed ? 'animate-spin' : ''}`} />
                    <span>Synchronize TXODDS Feed</span>
                  </button>

                  <button
                    onClick={handleInspectFeed}
                    className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showFeedDetails ? 'Hide Raw JSON Feed' : 'Inspect Raw JSON Payload'}</span>
                  </button>
                </div>
              </div>
            </div>

            {showFeedDetails && rawFeed && (
              <div className="space-y-2 bg-zinc-950 border border-zinc-900 p-4 rounded-xl text-xs font-mono">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                  <span className="text-zinc-500 font-bold uppercase text-[9px] flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5" /> http://api.txodds.com/api/v2/fixtures response
                  </span>
                  <span className="text-zinc-600 text-[10px]">Size: {JSON.stringify(rawFeed).length} bytes</span>
                </div>
                <pre className="max-h-[220px] overflow-y-auto text-[10px] text-emerald-500 p-1 rounded-md leading-relaxed whitespace-pre-wrap selection:bg-zinc-800 scrollbar-thin scrollbar-thumb-zinc-800">
                  {JSON.stringify(rawFeed, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Interactive Live Injector panel */}
          <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Activity className="w-4 h-4 text-blue-400" />
              <span>Manual Oracle Telemetry Injector</span>
            </h3>

            <form onSubmit={handleInjectEvent} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                {/* Match selector */}
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold block">Select Target Match</label>
                  <select
                    value={selectedMatchId}
                    onChange={(e) => setSelectedMatchId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-blue-500 text-zinc-300 font-medium"
                  >
                    {matches.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.homeTeam} vs {m.awayTeam} ({m.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event types */}
                <div className="space-y-1.5">
                  <label className="text-zinc-500 uppercase font-bold block">Event Metric Type</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 outline-none focus:border-blue-500 text-zinc-300 font-medium"
                  >
                    <option value="GOAL">⚽ GOAL INJECTION</option>
                    <option value="YELLOW_CARD">🟨 YELLOW CARD INJECTION</option>
                    <option value="RED_CARD">🟥 RED CARD INJECTION</option>
                  </select>
                </div>
              </div>

              {selectedMatch && selectedMatch.status === 'LIVE' ? (
                <>
                  <div className="grid grid-cols-2 gap-4 bg-zinc-950/40 p-3 rounded-lg border border-zinc-900">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 uppercase font-bold block">Responsible Team</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setEventTeam('HOME')}
                          className={`py-2 rounded-md font-bold text-[10px] uppercase cursor-pointer ${eventTeam === 'HOME' ? 'bg-blue-600/10 border border-blue-500 text-blue-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
                        >
                          {selectedMatch.homeTeam} (Home)
                        </button>
                        <button
                          type="button"
                          onClick={() => setEventTeam('AWAY')}
                          className={`py-2 rounded-md font-bold text-[10px] uppercase cursor-pointer ${eventTeam === 'AWAY' ? 'bg-indigo-600/10 border border-indigo-500 text-indigo-400' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
                        >
                          {selectedMatch.awayTeam} (Away)
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 uppercase font-bold block">Match Score Timeline</label>
                      <div className="text-lg font-black text-white h-9 flex items-center">
                        {selectedMatch.homeTeam} {selectedMatch.homeScore} - {selectedMatch.awayScore} {selectedMatch.awayTeam} (Min: {selectedMatch.minute}')
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-zinc-500 uppercase font-bold block">Player Name</label>
                      <input
                        type="text"
                        required
                        value={playerInput}
                        onChange={(e) => setPlayerInput(e.target.value)}
                        placeholder="Neymar"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-500 uppercase font-bold block">Event Detail</label>
                      <input
                        type="text"
                        value={detailInput}
                        onChange={(e) => setDetailInput(e.target.value)}
                        placeholder="Power shot from inside the box"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-zinc-300 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-t border-zinc-900/80 pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      Inject Event Stream Tick
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdminCommand('COMPLETE_MATCH', selectedMatchId)}
                      disabled={isSubmitting}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200 hover:text-emerald-400 font-bold py-2.5 rounded-lg text-xs cursor-pointer disabled:opacity-50"
                    >
                      Blow Final Whistle (Auto-Settle)
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-zinc-950/60 border border-zinc-900 p-6 rounded-xl text-center">
                  <p className="text-xs text-zinc-500 font-bold">Injections can only be processed on LIVE matches. Argentina vs France can be initialized via "Launch Live Simulation" above.</p>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* System Log Monitor (1/3 width) */}
        <div className="lg:col-span-1 bg-zinc-950 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between max-h-[640px]">
          
          <div className="space-y-4 flex-1 flex flex-col min-h-0">
            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2 border-b border-zinc-900 pb-3">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>TxLINE Stream Feed Auditor</span>
            </h3>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3 font-mono text-[10px] min-h-0">
              {logs.slice().reverse().map((log, index) => {
                const color = log.type === 'SETTLEMENT' ? 'text-yellow-400 font-bold' : (log.type === 'EVENT' ? 'text-emerald-400' : (log.type === 'ERROR' ? 'text-red-400' : 'text-zinc-400'));
                return (
                  <div key={log.id || index} className="space-y-1 border-b border-zinc-900/60 pb-2">
                    <div className="flex items-center justify-between text-[8px] text-zinc-500">
                      <span>[{log.type}]</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                    </div>
                    <p className={`leading-relaxed break-words ${color}`}>{log.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border-t border-zinc-900 pt-3 text-[9px] text-zinc-500 text-center font-medium mt-3">
            Auditing direct SSE clients: {Math.max(1, matches.length - 2)} connected.
          </div>

        </div>

      </div>

    </div>
  );
}
