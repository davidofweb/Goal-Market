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
    <div className="space-y-6 animate-fade-in" id="resolution-center-view">
      
      {/* Title & Description Header */}
      <div className="space-y-2 border-b border-zinc-900 pb-4">
        <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <ShieldAlert className="w-6 h-6 text-emerald-400" />
          <span>Verifiable Resolution Center</span>
        </h2>
        <p className="text-sm text-zinc-400">
          Decentralized settlement validation dashboard. Review cryptographic-like proofs, SHA-256 validation signatures, and official match records pushed directly from the TxLINE data feeds.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Panel: List of Settled Match Proofs (1/3 width) */}
        <div className="lg:col-span-1 space-y-4">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search settled matches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900/50 border border-zinc-800 focus:border-blue-500 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-300 outline-none transition-colors duration-150"
            />
          </div>

          <div className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
            {filteredProofs.length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">No matching settled records available.</p>
            ) : (
              filteredProofs.map(proof => {
                const isSelected = selectedProof?.id === proof.id;
                return (
                  <div
                    key={proof.id}
                    onClick={() => setSelectedProof(proof)}
                    className={`p-4 rounded-xl border transition-all duration-150 cursor-pointer text-left ${isSelected ? 'bg-zinc-900/60 border-blue-500' : 'bg-zinc-950/20 border-zinc-900 hover:border-zinc-800'}`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-400 font-bold uppercase tracking-wider px-2 py-0.5 rounded">Verified</span>
                      <span className="text-[9px] text-zinc-500 font-mono font-bold">
                        {new Date(proof.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-zinc-100">{proof.matchTitle}</h4>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-mono text-zinc-500 truncate block w-4/5">Hash: {proof.validationHash.slice(0, 14)}...</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Panel: Detailed Cryptographic Proof & Settlement Records (2/3 width) */}
        <div className="lg:col-span-2">
          {selectedProof ? (
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-2xl">
              
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-900">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest block">Settlement Record</span>
                  <h3 className="text-lg font-black text-white leading-tight">{selectedProof.matchTitle}</h3>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Completed at: {new Date(selectedProof.completedAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-xl text-center">
                  <span className="text-[10px] text-emerald-500 font-extrabold uppercase block tracking-wider">Oracle Consensus</span>
                  <span className="text-sm font-black text-emerald-400 flex items-center gap-1.5 justify-center mt-0.5">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Fully Verified
                  </span>
                </div>
              </div>

              {/* Resolved Prediction Contracts List */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  <span>Settle Decisions Ledger</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedProof.resolvedMarkets.map((rm, idx) => (
                    <div key={idx} className="bg-zinc-950/40 border border-zinc-900 p-3 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] text-zinc-500 font-bold block mb-1">{rm.question}</span>
                      <div className="flex items-center justify-between border-t border-zinc-900/60 pt-2 mt-2">
                        <span className="text-[10px] text-zinc-400">Winning Outcome:</span>
                        <span className="text-xs font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">{rm.winningOutcomeName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cryptographic hashes & Signatures */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Hash className="w-4 h-4 text-blue-400" />
                  <span>Validator Cryptography Keys</span>
                </h4>

                <div className="space-y-3 bg-zinc-950/60 border border-zinc-900 p-4 rounded-xl">
                  
                  {/* Validation Hash */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>SHA-256 validation hash</span>
                      <button
                        onClick={() => handleCopyText(selectedProof.validationHash, 'hash')}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {copiedId === 'hash' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 font-mono text-[10px] text-zinc-300 break-all select-all">
                      {selectedProof.validationHash}
                    </div>
                  </div>

                  {/* Cryptographic Signature */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      <span>TxLINE Oracle Signatures (ECDSA secp256k1)</span>
                      <button
                        onClick={() => handleCopyText(selectedProof.signature, 'sig')}
                        className="text-blue-400 hover:text-blue-300 font-medium"
                      >
                        {copiedId === 'sig' ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 rounded-lg p-2.5 font-mono text-[10px] text-zinc-400 break-all select-all">
                      {selectedProof.signature}
                    </div>
                  </div>

                  {/* Validator details */}
                  <div className="grid grid-cols-2 gap-4 text-[10px] border-t border-zinc-900/80 pt-3 mt-3 text-zinc-500 font-medium">
                    <div>
                      <span>Telemetry source:</span>
                      <span className="font-bold text-zinc-300 block font-mono">{selectedProof.feedSource}</span>
                    </div>
                    <div>
                      <span>Official final score:</span>
                      <span className="font-bold text-emerald-400 block font-mono">{selectedProof.homeScore} - {selectedProof.awayScore} (Full Time)</span>
                    </div>
                  </div>

                </div>
              </div>

              {/* Raw JSON viewer */}
              <div className="space-y-2">
                <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-zinc-400" />
                  <span>Raw Decrypted Stream Telemetry</span>
                </h4>
                <div className="relative">
                  <pre className="bg-zinc-950 border border-zinc-900 rounded-xl p-4 font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-48 leading-relaxed">
                    {JSON.stringify(selectedProof, null, 2)}
                  </pre>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-zinc-950 border border-zinc-900 rounded-2xl p-12 text-center space-y-3">
              <Database className="w-12 h-12 text-zinc-800 mx-auto" />
              <p className="text-sm text-zinc-500">Select an oracle proof record from the list to begin verification.</p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
