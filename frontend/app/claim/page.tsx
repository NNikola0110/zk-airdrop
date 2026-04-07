"use client";

import { useState, useEffect } from "react";
import { Identity } from "@semaphore-protocol/identity";
import { Group } from "@semaphore-protocol/group";
import { generateProof } from "@semaphore-protocol/proof";

const API_URL = "http://localhost:3001";

type CampaignWithRound = {
  id: number;
  name: string;
  repoOwner: string;
  repoName: string;
  totalAmount: number;
  rounds: {
    id: number;
    name: string;
    amountPerClaim: number;
    endDate: string;
  }[];
  _count: { commitments: number };
};

export default function ClaimPage() {
  const [walletAddress, setWalletAddress] = useState("");
  const [campaigns, setCampaigns] = useState<CampaignWithRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasIdentity, setHasIdentity] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);
  const [claimedIds, setClaimedIds] = useState<Set<number>>(new Set());
  const [statuses, setStatuses] = useState<Record<number, string>>({});
  const [errors, setErrors] = useState<Record<number, string>>({});

  useEffect(() => {
    const saved = localStorage.getItem("semaphoreIdentityTrapdoor");
    setHasIdentity(!!saved);

    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/campaigns`);
      if (res.ok) {
        const data = await res.json();
        setCampaigns(data);
      }
    } catch {
      // Failed to fetch
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (campaign: CampaignWithRound) => {
    const round = campaign.rounds[0];
    if (!round) return;

    setErrors((prev) => ({ ...prev, [campaign.id]: "" }));
    setStatuses((prev) => ({ ...prev, [campaign.id]: "" }));

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      setErrors((prev) => ({
        ...prev,
        [campaign.id]: "Invalid Ethereum wallet address",
      }));
      return;
    }

    const savedIdentity = localStorage.getItem("semaphoreIdentityTrapdoor");
    if (!savedIdentity) {
      setErrors((prev) => ({
        ...prev,
        [campaign.id]: "No Semaphore identity found. Go to Dashboard first.",
      }));
      return;
    }

    setClaimingId(campaign.id);

    try {
      setStatuses((prev) => ({
        ...prev,
        [campaign.id]: "Restoring your anonymous identity...",
      }));
      const identity = Identity.import(savedIdentity);

      setStatuses((prev) => ({
        ...prev,
        [campaign.id]: "Fetching group members...",
      }));
      const membersRes = await fetch(`${API_URL}/commitments/${campaign.id}`);
      const membersData = await membersRes.json();

      setStatuses((prev) => ({
        ...prev,
        [campaign.id]: "Building Semaphore group...",
      }));
      const group = new Group();
      for (const member of membersData.members) {
        group.addMember(BigInt(member));
      }

      setStatuses((prev) => ({
        ...prev,
        [campaign.id]: "Generating zero-knowledge proof...",
      }));
      const proof = await generateProof(
        identity,
        group,
        walletAddress,
        round.id
      );

      setStatuses((prev) => ({
        ...prev,
        [campaign.id]: "Submitting claim...",
      }));
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

      setStatuses((prev) => ({
        ...prev,
        [campaign.id]: `Claimed! ${claimData.amount} tokens will be sent to ${walletAddress}`,
      }));
      setClaimedIds((prev) => new Set(prev).add(campaign.id));
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        [campaign.id]:
          err instanceof Error ? err.message : "Failed to claim airdrop",
      }));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <a
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition"
          >
            &larr; Back to Dashboard
          </a>
        </div>

        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Claim Airdrop
        </h1>
        <p className="text-zinc-400 text-sm mb-8">
          Submit a zero-knowledge proof to claim your airdrop anonymously. No
          one will know which GitHub account you are.
        </p>

        {/* Identity warning */}
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
        <div className="mb-8">
          <label className="block text-sm font-medium text-zinc-300 mb-2">
            Ethereum Wallet Address
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="0x..."
            className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/50 transition"
          />
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-6 text-zinc-300">
            Loading campaigns...
          </div>
        )}

        {/* Campaign list */}
        {!loading && campaigns.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-zinc-400">
            No active campaigns found.
          </div>
        )}

        <div className="space-y-4">
          {campaigns.map((campaign) => {
            const round = campaign.rounds[0];
            const isClaimed = claimedIds.has(campaign.id);
            const isClaiming = claimingId === campaign.id;

            return (
              <div
                key={campaign.id}
                className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-semibold text-lg">{campaign.name}</p>
                    <p className="text-sm text-zinc-400">
                      {campaign.repoOwner}/{campaign.repoName}
                    </p>
                  </div>
                  {isClaimed && (
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      CLAIMED
                    </span>
                  )}
                </div>

                <div className="grid gap-3 md:grid-cols-3 text-sm mb-4">
                  <div className="rounded-2xl bg-black/20 border border-white/10 p-3">
                    <p className="text-zinc-400 mb-1">Total Pool</p>
                    <p className="font-medium">{campaign.totalAmount} tokens</p>
                  </div>
                  {round && (
                    <>
                      <div className="rounded-2xl bg-black/20 border border-white/10 p-3">
                        <p className="text-zinc-400 mb-1">Per Claim</p>
                        <p className="font-medium">
                          {round.amountPerClaim} tokens
                        </p>
                      </div>
                      <div className="rounded-2xl bg-black/20 border border-white/10 p-3">
                        <p className="text-zinc-400 mb-1">Ends</p>
                        <p className="font-medium">
                          {new Date(round.endDate).toLocaleDateString()}
                        </p>
                      </div>
                    </>
                  )}
                </div>

                {round && !isClaimed && (
                  <button
                    onClick={() => handleClaim(campaign)}
                    disabled={isClaiming || !hasIdentity || claimingId !== null}
                    className="w-full rounded-2xl bg-emerald-500 text-white px-5 py-3 font-semibold hover:bg-emerald-400 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isClaiming ? "Processing..." : "Claim Anonymously"}
                  </button>
                )}

                {!round && (
                  <div className="rounded-2xl bg-black/20 border border-red-400/20 p-3 text-sm text-red-300">
                    No active round for this campaign.
                  </div>
                )}

                {statuses[campaign.id] && (
                  <div
                    className={`mt-3 rounded-2xl border p-4 text-sm break-words ${
                      isClaimed
                        ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
                        : "border-blue-400/20 bg-blue-400/10 text-blue-200"
                    }`}
                  >
                    {statuses[campaign.id]}
                  </div>
                )}

                {errors[campaign.id] && (
                  <div className="mt-3 rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
                    {errors[campaign.id]}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
