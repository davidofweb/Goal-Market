import React, { useState } from 'react';
import { ShieldAlert, Award, Hash, CheckCircle, Clock, Copy, Search, Terminal, Database, HelpCircle } from 'lucide-react';
import { SettlementProof } from '../types';

interface ResolutionCenterProps {
  proofs: SettlementProof[];
}

export default function ResolutionCenter({ proofs }: ResolutionCenterProps) {
  const [selectedProof, setSelectedProof] = useState<SettlementProof | null>(proofs[0] || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredProofs = proofs.filter(p =>
    p.matchTitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in" id="resolution-center-view">
      
      {/* Header Banner - Card-less & direct */}
      <div className="space-y-2 border-b border-zinc-900 pb-6">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
          <span>Oracle Settlement Ledger</span>
        </h2>
        <p className="text-sm text-zinc-400 max-w-2xl font-medium leading-relaxed">
          Decentralized verification index. Audit cryptographic-like proofs, SHA-256 state signatures, and official telemetry datasets pushed directly from the World Cup oracles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Ticker (1/3 width) - borderless list of matches */}
        <div className="lg:col-span-1 space-y-5">
          
          {/* Flat search field */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by match..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-900 focus:border-blue-500 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-300 outline-none h-9"
            />
          </div>

          <div className="divide-y divide-zinc-900/60 max-h-[480px] overflow-y-auto scrollbar-none">
            {filteredProofs.length === 0 ? (
              <p className="text-xs text-zinc-500 py-6 text-center font-bold">No resolved events available.</p>
            ) : (
              filteredProofs.map(proof => {
                const isSelected = selectedProof?.id === proof.id;
                return (
                  <div
                    key={proof.id}
                    onClick={() => setSelectedProof(proof)}
                    className={`py-4 cursor-pointer text-left transition-colors px-1 ${isSelected ? 'bg-zinc-950/40' : 'hover:bg-zinc-950/20'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-black uppercase">VERIFIED</span>
                      <span className="text-[9px] text-zinc-500 font-mono font-bold">
                        {new Date(proof.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-sm font-extrabold text-white group-hover:text-blue-400">{proof.matchTitle}</h4>
                    <span className="text-[9px] font-mono text-zinc-500 block mt-1">Hash: {proof.validationHash.slice(0, 16)}...</span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Audit Details (2/3 width) - Borderless structured telemetry */}
        <div className="lg:col-span-2">
          {selectedProof ? (
            <div className="space-y-8 animate-fade-in">
              
              {/* Header section (Fluid, seamless) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-900">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest block">Audit Target</span>
                  <h3 className="text-xl font-black text-white">{selectedProof.matchTitle}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Consensus completed: {new Date(selectedProof.completedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/15 px-3 py-1.5 rounded-xl self-start sm:self-auto">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[9px] text-emerald-400 font-black uppercase tracking-wider">Fully Verified</span>
                </div>
              </div>

              {/* Resolved Contracts list */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Settlement Decisions</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedProof.resolvedMarkets.map((rm, idx) => (
                    <div key={idx} className="bg-zinc-950/40 border border-zinc-900 p-3.5 rounded-xl space-y-2">
                      <span className="text-xs text-zinc-400 font-bold block leading-relaxed">{rm.question}</span>
                      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2.5 mt-1">
                        <span className="text-[9px] text-zinc-500 uppercase font-bold">Consensus Winner</span>
                        <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">{rm.winningOutcomeName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Hashes & Keys block */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-400" />
                  <span>Validator Signatures</span>
                </h4>

                <div className="space-y-4 bg-zinc-950/40 border border-zinc-900/80 p-4 rounded-2xl">
                  {/* Hash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                      <span>SHA-256 Validation Hash</span>
                      <button
                        onClick={() => handleCopyText(selectedProof.validationHash, 'hash')}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-extrabold"
                      >
                        {copiedId === 'hash' ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-2.5 font-mono text-[10px] text-zinc-300 break-all select-all">
                      {selectedProof.validationHash}
                    </div>
                  </div>

                  {/* Signatures */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[9px] font-black text-zinc-500 uppercase tracking-wider">
                      <span>ECDSA Consensus Key</span>
                      <button
                        onClick={() => handleCopyText(selectedProof.signature, 'sig')}
                        className="text-blue-400 hover:text-blue-300 transition-colors font-extrabold"
                      >
                        {copiedId === 'sig' ? 'COPIED' : 'COPY'}
                      </button>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900/60 rounded-xl p-2.5 font-mono text-[10px] text-zinc-400 break-all select-all">
                      {selectedProof.signature}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-zinc-900/60 pt-3 text-zinc-500 font-bold uppercase tracking-wider">
                    <div>
                      <span>Telemetry Feed</span>
                      <span className="font-mono text-zinc-300 block mt-0.5 normal-case">{selectedProof.feedSource}</span>
                    </div>
                    <div>
                      <span>Official Scoreboard</span>
                      <span className="font-mono text-emerald-400 block mt-0.5">{selectedProof.homeScore} - {selectedProof.awayScore} (Full Time)</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON panel */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span>Raw Telemetry Feed Block</span>
                </h4>
                <pre className="bg-zinc-950/80 border border-zinc-900 rounded-xl p-4 font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-48 leading-relaxed scrollbar-none">
                  {JSON.stringify(selectedProof, null, 2)}
                </pre>
              </div>

            </div>
          ) : (
            <div className="py-20 text-center space-y-2 border-t border-b border-zinc-900">
              <Database className="w-8 h-8 text-zinc-700 mx-auto" />
              <p className="text-xs font-bold text-zinc-500">Select an oracle proof from the index to inspect validator keys.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
