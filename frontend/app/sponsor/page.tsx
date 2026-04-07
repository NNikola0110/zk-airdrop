"use client";

import { useState } from "react";

const API_URL = "http://localhost:3001";

type CampaignResult = {
  id: number;
  name: string;
  repo: string;
  totalAmount: number;
  sponsorAddress: string;
  contributorCount: number;
  amountPerClaim: number;
  round: { id: number; name: string; endDate: string };
};

export default function SponsorPage() {
  const [repoUrl, setRepoUrl] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [sponsorAddress, setSponsorAddress] = useState("");
  const [durationDays, setDurationDays] = useState("30");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<CampaignResult | null>(null);

  const handleCreate = async () => {
    setError("");
    setResult(null);

    // Parse repo URL (supports "owner/repo" or full GitHub URL)
    let repoOwner = "";
    let repoName = "";

    if (repoUrl.includes("github.com")) {
      const parts = repoUrl.replace(/\/$/, "").split("/");
      repoOwner = parts[parts.length - 2];
      repoName = parts[parts.length - 1];
    } else if (repoUrl.includes("/")) {
      const parts = repoUrl.split("/");
      repoOwner = parts[0];
      repoName = parts[1];
    }

    if (!repoOwner || !repoName) {
      setError("Invalid repo format. Use 'owner/repo' or full GitHub URL.");
      return;
    }

    if (!totalAmount || Number(totalAmount) <= 0) {
      setError("Amount must be greater than 0.");
      return;
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(sponsorAddress)) {
      setError("Invalid Ethereum wallet address.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repoOwner,
          repoName,
          totalAmount: Number(totalAmount),
          sponsorAddress,
          durationDays: Number(durationDays),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create campaign");
      }

      setResult(data.campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            &larr; Back to Home
          </a>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="mb-6">
            <p className="inline-flex items-center rounded-full border border-purple-400/20 bg-purple-400/10 px-3 py-1 text-xs font-medium text-purple-300">
              Sponsor an Airdrop
            </p>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-2">
            Fund a Repository
          </h1>
          <p className="text-zinc-400 text-sm mb-8">
            Choose a GitHub repository and fund an airdrop for its contributors.
            Tokens will be distributed equally among all eligible contributors.
          </p>

          {!result ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  GitHub Repository
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="owner/repo or https://github.com/owner/repo"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/50 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Total Amount (tokens)
                </label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/50 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Your Wallet Address
                </label>
                <input
                  type="text"
                  value={sponsorAddress}
                  onChange={(e) => setSponsorAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/50 transition"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Duration (days)
                </label>
                <input
                  type="number"
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="30"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/50 transition"
                  disabled={loading}
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={loading}
                className="w-full rounded-2xl bg-purple-500 text-white px-5 py-3 font-semibold hover:bg-purple-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Airdrop Campaign"}
              </button>

              {error && (
                <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                  {error}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5">
                <p className="text-emerald-300 font-semibold mb-3">
                  Campaign created successfully!
                </p>

                <div className="space-y-3 text-sm">
                  <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                    <p className="text-zinc-400 mb-1">Repository</p>
                    <p className="font-medium">{result.repo}</p>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                    <p className="text-zinc-400 mb-1">Total Amount</p>
                    <p className="font-medium">{result.totalAmount} tokens</p>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                    <p className="text-zinc-400 mb-1">Contributors Found</p>
                    <p className="font-medium">{result.contributorCount}</p>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                    <p className="text-zinc-400 mb-1">Amount Per Contributor</p>
                    <p className="font-medium">
                      {result.amountPerClaim.toFixed(2)} tokens
                    </p>
                  </div>

                  <div className="rounded-xl bg-black/20 border border-white/10 p-3">
                    <p className="text-zinc-400 mb-1">Ends</p>
                    <p className="font-medium">
                      {new Date(result.round.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-zinc-400">
                Contributors can now log in with GitHub to verify eligibility and
                claim their airdrop anonymously.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setResult(null);
                    setRepoUrl("");
                    setTotalAmount("");
                    setSponsorAddress("");
                  }}
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 font-semibold text-zinc-300 hover:bg-white/10 transition"
                >
                  Create Another
                </button>

                <a
                  href="/"
                  className="flex-1 rounded-2xl bg-white text-black text-center px-5 py-3 font-semibold hover:bg-zinc-200 transition"
                >
                  Back to Home
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
