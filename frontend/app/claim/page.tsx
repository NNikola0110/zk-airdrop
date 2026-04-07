"use client";

import { useState, useEffect } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";

const API_URL = "http://localhost:3001";

type RoundData = {
  id: number;
  name: string;
  amountPerClaim: number;
  campaignId: number;
  startDate: string;
  endDate: string;
};

export default function ClaimPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [round, setRound] = useState<RoundData | null>(null);
  const [hasIdentity, setHasIdentity] = useState(false);
  const [claimed, setClaimed] = useState(false);

  useEffect(() => {
    // Check if user has a saved identity
    const saved = localStorage.getItem("semaphoreIdentityTrapdoor");
    setHasIdentity(!!saved);

    // Check campaignId from localStorage or default
    const campaignId = localStorage.getItem("campaignId") || "1";
    fetchActiveRound(Number(campaignId));
  }, []);

  const fetchActiveRound = async (campaignId: number) => {
    try {
      const res = await fetch(`${API_URL}/rounds/active/${campaignId}`);
      if (res.ok) {
        const data = await res.json();
        setRound(data);
      }
    } catch {
      // No active round
    }
  };

  const handleClaim = async () => {
    setError("");
    setStatus("");

    // Validate wallet
    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setError("Invalid Ethereum wallet address");
      return;
    }

    // Load identity from localStorage
    const savedIdentity = localStorage.getItem("semaphoreIdentityTrapdoor");
    if (!savedIdentity) {
      setError("No Semaphore identity found. Go to Dashboard first to generate one.");
      return;
    }

    if (!round) {
      setError("No active round available for claiming.");
      return;
    }

    setLoading(true);

    try {
      // 1. Restore identity
      setStatus("Restoring your anonymous identity...");
      const identity = Identity.import(savedIdentity);

      // 2. Fetch group members from backend
      setStatus("Fetching group members...");
      const membersRes = await fetch(`${API_URL}/commitments/${round.campaignId}`);
      const membersData = await membersRes.json();

      // 3. Rebuild Semaphore group locally
      setStatus("Building Semaphore group...");
      const group = new Group();
      for (const member of membersData.members) {
        group.addMember(BigInt(member));
      }

      // 4. Generate ZK proof with wallet address as signal, roundId as scope
      setStatus("Generating zero-knowledge proof...");
      const proof = await generateProof(identity, group, walletAddress, round.id);

      // 5. Send proof to backend for verification
      setStatus("Submitting claim...");
      const claimRes = await fetch(`${API_URL}/claim`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roundId: round.id,
          walletAddress,
          proof,
        }),
      });

      const claimData = await claimRes.json();

      if (!claimRes.ok) {
        throw new Error(claimData.error || "Claim failed");
      }

      setStatus(`Airdrop claimed! ${claimData.amount} tokens will be sent to ${walletAddress}`);
      setClaimed(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to claim airdrop");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <a
            href="/dashboard"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            &larr; Back to Dashboard
          </a>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Claim Airdrop
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            Submit a zero-knowledge proof to claim your airdrop anonymously.
            No one will know which GitHub account you are.
          </p>

          {/* Round info */}
          {round ? (
            <div className="rounded-2xl bg-black/20 border border-white/10 p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-zinc-400">Active Round</p>
                <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                  ACTIVE
                </span>
              </div>
              <p className="font-semibold text-lg">{round.name}</p>
              <p className="text-sm text-zinc-400 mt-1">
                {round.amountPerClaim} tokens per claim
              </p>
            </div>
          ) : (
            <div className="rounded-2xl bg-black/20 border border-red-400/20 p-4 mb-6">
              <p className="text-sm text-red-300">
                No active round found. Claiming is not available.
              </p>
            </div>
          )}

          {/* Identity status */}
          {!hasIdentity && (
            <div className="rounded-2xl bg-black/20 border border-yellow-400/20 p-4 mb-6">
              <p className="text-sm text-yellow-300">
                No Semaphore identity found. Go to{" "}
                <a href="/dashboard" className="underline">
                  Dashboard
                </a>{" "}
                to generate one first.
              </p>
            </div>
          )}

          {/* Wallet input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Ethereum Wallet Address
            </label>
            <input
              type="text"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              placeholder="0x..."
              className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/50 transition"
              disabled={loading || claimed}
            />
          </div>

          {/* Claim button */}
          <button
            onClick={handleClaim}
            disabled={loading || !hasIdentity || !round || claimed}
            className="w-full rounded-2xl bg-emerald-500 text-white px-5 py-3 font-semibold hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing..."
              : claimed
              ? "Claimed"
              : "Claim Airdrop Anonymously"}
          </button>

          {/* Status messages */}
          {status && (
            <div
              className={`mt-6 rounded-2xl border p-4 text-sm break-words ${
                claimed
                  ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                  : "border-blue-400/20 bg-blue-400/10 text-blue-200"
              }`}
            >
              {status}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
