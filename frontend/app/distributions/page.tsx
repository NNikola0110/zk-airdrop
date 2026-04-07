"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:3001";

type Distribution = {
  walletAddress: string;
  amount: number;
  roundName: string;
  campaignName: string;
  claimedAt: string;
  nullifierHash: string;
};

type DistributionsResponse = {
  totalDistributed: number;
  count: number;
  distributions: Distribution[];
};

export default function DistributionsPage() {
  const [data, setData] = useState<DistributionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDistributions = async () => {
      try {
        const res = await fetch(`${API_URL}/distributions`);
        if (!res.ok) throw new Error("Failed to fetch distributions");
        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchDistributions();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            &larr; Back to Home
          </a>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Airdrop Distributions
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          Public audit log of all airdrop claims. No GitHub identities are
          revealed — only wallet addresses and nullifier hashes.
        </p>

        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-6 text-zinc-300">
            Loading distributions...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-400/20 bg-red-400/10 p-6 text-red-200">
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-2 mb-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                <p className="text-sm text-zinc-400 mb-1">Total Distributed</p>
                <p className="text-2xl font-bold">{data.totalDistributed} tokens</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5">
                <p className="text-sm text-zinc-400 mb-1">Total Claims</p>
                <p className="text-2xl font-bold">{data.count}</p>
              </div>
            </div>

            {/* Distribution list */}
            {data.distributions.length === 0 ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-zinc-400">
                No distributions yet.
              </div>
            ) : (
              <div className="space-y-4">
                {data.distributions.map((d, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-5"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs text-zinc-500">
                        {d.campaignName} / {d.roundName}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {new Date(d.claimedAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                      <div>
                        <p className="text-zinc-400 mb-1">Wallet</p>
                        <p className="font-mono text-xs break-all">
                          {d.walletAddress}
                        </p>
                      </div>
                      <div>
                        <p className="text-zinc-400 mb-1">Amount</p>
                        <p className="font-semibold">{d.amount} tokens</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-zinc-400 text-xs mb-1">
                        Nullifier Hash (proof of unique claim)
                      </p>
                      <p className="font-mono text-xs text-zinc-500 break-all">
                        {d.nullifierHash}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
