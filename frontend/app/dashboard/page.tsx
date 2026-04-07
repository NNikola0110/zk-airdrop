"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Identity } from "@semaphore-protocol/identity";

const API_URL = "http://localhost:3001";

type CampaignResult = {
  campaignId: number;
  campaignName: string;
  repo: string;
  totalAmount: number;
  isContributor: boolean;
  activeRound: { id: number; name: string; amountPerClaim: number } | null;
};

type EligibilityResponse = {
  githubLogin: string;
  campaigns: CampaignResult[];
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const githubLogin = searchParams.get("githubLogin");

  const [data, setData] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [identityStatus, setIdentityStatus] = useState("");
  const [identitySaved, setIdentitySaved] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("semaphoreIdentityTrapdoor");
    if (saved) setIdentitySaved(true);
  }, []);

  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const url = new URL(`${API_URL}/eligibility/me`);
        if (githubLogin) {
          url.searchParams.set("githubLogin", githubLogin);
        }

        const res = await fetch(url.toString());

        if (!res.ok) {
          throw new Error("Failed to fetch eligibility");
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchEligibility();
  }, [githubLogin]);

  const handleGenerateIdentity = async () => {
    if (!data) return;

    const eligible = data.campaigns.filter((c) => c.isContributor);
    if (eligible.length === 0) return;

    setGenerating(true);

    try {
      setIdentityStatus("Generating Semaphore identity...");

      const identity = new Identity();
      const commitment = identity.commitment.toString();

      localStorage.setItem("semaphoreIdentityTrapdoor", identity.export());

      // Send commitment to ALL eligible campaigns
      for (const campaign of eligible) {
        setIdentityStatus(
          `Joining ${campaign.repo} (${eligible.indexOf(campaign) + 1}/${eligible.length})...`
        );

        const res = await fetch(`${API_URL}/commitments`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            githubLogin: data.githubLogin,
            campaignId: campaign.campaignId,
            commitment,
          }),
        });

        const json = await res.json();

        if (!res.ok && json.error !== "Commitment already exists") {
          throw new Error(json.error || "Failed to save commitment");
        }
      }

      setIdentitySaved(true);
      setIdentityStatus(
        `Identity generated and joined ${eligible.length} campaign(s).`
      );
    } catch (err) {
      setIdentityStatus(
        err instanceof Error ? err.message : "Failed to generate identity"
      );
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-6 text-zinc-300">
          Loading dashboard...
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-3xl border border-red-400/20 bg-red-400/10 p-8 text-red-200">
          <h1 className="text-xl font-semibold mb-2">Something went wrong</h1>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl px-8 py-6 text-zinc-300">
          No data found.
        </div>
      </main>
    );
  }

  const eligibleCampaigns = data.campaigns.filter((c) => c.isContributor);
  const otherCampaigns = data.campaigns.filter((c) => !c.isContributor);

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <p className="text-sm text-zinc-400 mb-2">Contributor Dashboard</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome, {data.githubLogin}
          </h1>
        </div>

        {/* Identity section */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl mb-8">
          <h2 className="text-xl font-semibold mb-3">Anonymous Identity</h2>

          {!identitySaved && eligibleCampaigns.length > 0 && (
            <>
              <p className="text-sm text-zinc-400 mb-4">
                Generate your Semaphore identity to join all eligible campaigns
                anonymously.
              </p>
              <button
                onClick={handleGenerateIdentity}
                disabled={generating}
                className="w-full md:w-auto rounded-2xl bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition disabled:opacity-40"
              >
                {generating ? "Generating..." : "Generate Semaphore Identity"}
              </button>
            </>
          )}

          {!identitySaved && eligibleCampaigns.length === 0 && (
            <p className="text-sm text-zinc-400">
              You are not eligible for any campaigns. Identity generation is not
              available.
            </p>
          )}

          {identitySaved && (
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const saved = localStorage.getItem(
                    "semaphoreIdentityTrapdoor"
                  );
                  if (!saved) return;
                  const blob = new Blob([saved], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "semaphore-identity.json";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10 transition"
              >
                Download Identity Backup
              </button>

              <a
                href="/claim"
                className="rounded-2xl bg-emerald-500 text-white text-center px-5 py-3 font-semibold hover:bg-emerald-400 transition"
              >
                Go to Claim Airdrop
              </a>
            </div>
          )}

          {identityStatus && (
            <div className="mt-4 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-200 break-words">
              {identityStatus}
            </div>
          )}
        </div>

        {/* Eligible campaigns */}
        {eligibleCampaigns.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4">
              Eligible Campaigns ({eligibleCampaigns.length})
            </h2>
            <div className="grid gap-4 mb-8">
              {eligibleCampaigns.map((campaign) => (
                <div
                  key={campaign.campaignId}
                  className="rounded-3xl border border-emerald-400/20 bg-white/5 backdrop-blur-xl p-6 shadow-2xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="font-semibold text-lg">
                        {campaign.campaignName}
                      </p>
                      <p className="text-sm text-zinc-400">{campaign.repo}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-emerald-400/20 bg-emerald-400/10 text-emerald-300">
                      ELIGIBLE
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 text-sm">
                    <div className="rounded-2xl bg-black/20 border border-white/10 p-3">
                      <p className="text-zinc-400 mb-1">Total Pool</p>
                      <p className="font-medium">
                        {campaign.totalAmount} tokens
                      </p>
                    </div>
                    {campaign.activeRound && (
                      <div className="rounded-2xl bg-black/20 border border-white/10 p-3">
                        <p className="text-zinc-400 mb-1">Per Claim</p>
                        <p className="font-medium">
                          {campaign.activeRound.amountPerClaim} tokens
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Not eligible campaigns */}
        {otherCampaigns.length > 0 && (
          <>
            <h2 className="text-xl font-semibold mb-4 text-zinc-400">
              Other Active Campaigns ({otherCampaigns.length})
            </h2>
            <div className="grid gap-4">
              {otherCampaigns.map((campaign) => (
                <div
                  key={campaign.campaignId}
                  className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl opacity-60"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-lg">
                        {campaign.campaignName}
                      </p>
                      <p className="text-sm text-zinc-400">{campaign.repo}</p>
                    </div>
                    <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border border-red-400/20 bg-red-400/10 text-red-300">
                      NOT ELIGIBLE
                    </span>
                  </div>
                  <p className="text-sm text-zinc-500 mt-3">
                    {campaign.totalAmount} tokens — You are not a contributor to
                    this repository.
                  </p>
                </div>
              ))}
            </div>
          </>
        )}

        {data.campaigns.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 text-center text-zinc-400">
            No active campaigns found.
          </div>
        )}
      </div>
    </main>
  );
}
