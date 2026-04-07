"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Identity } from "@semaphore-protocol/identity";

type EligibilityResponse = {
  githubLogin: string;
  repo: string;
  campaignId: number;
  campaignName: string;
  isContributor: boolean;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const githubLogin = searchParams.get("githubLogin");

  const [data, setData] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commitmentStatus, setCommitmentStatus] = useState("");
  const [identitySaved, setIdentitySaved] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("semaphoreIdentityTrapdoor");
    if (saved) setIdentitySaved(true);
  }, []);

  useEffect(() => {
    const fetchEligibility = async () => {
      try {
        const url = new URL("http://localhost:3001/eligibility/me");
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

    try {
      setCommitmentStatus("Generating Semaphore identity...");

      const identity = new Identity();
      const commitment = identity.commitment.toString();

      localStorage.setItem("semaphoreIdentityTrapdoor", identity.export());

      setCommitmentStatus("Saving commitment to backend...");

      const res = await fetch("http://localhost:3001/commitments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          githubLogin: data.githubLogin,
          campaignId: data.campaignId,
          commitment,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save commitment");
      }

      // Save campaignId for claim page
      localStorage.setItem("campaignId", String(data.campaignId));

      setIdentitySaved(true);
      setCommitmentStatus("Semaphore identity generated and commitment saved.");
    } catch (err) {
      setCommitmentStatus(
        err instanceof Error ? err.message : "Failed to generate identity"
      );
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

  const eligible = data.isContributor;

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm text-zinc-400 mb-2">Contributor Dashboard</p>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
              Welcome, {data.githubLogin}
            </h1>
          </div>

          <span
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold border ${
              eligible
                ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/20 bg-red-400/10 text-red-300"
            }`}
          >
            {eligible ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </span>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-5">Campaign Info</h2>

            <div className="space-y-4 text-sm">
              <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                <p className="text-zinc-400 mb-1">GitHub User</p>
                <p className="font-medium break-all">{data.githubLogin}</p>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                <p className="text-zinc-400 mb-1">Repository</p>
                <p className="font-medium break-all">{data.repo}</p>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                <p className="text-zinc-400 mb-1">Campaign</p>
                <p className="font-medium">{data.campaignName}</p>
              </div>

              <div className="rounded-2xl bg-black/20 border border-white/10 p-4">
                <p className="text-zinc-400 mb-1">Eligibility</p>
                <p className="font-medium">
                  {eligible
                    ? "You can continue to identity generation."
                    : "This account is not eligible for the active campaign."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 shadow-2xl">
            <h2 className="text-xl font-semibold mb-5">Anonymous Identity</h2>

            <p className="text-sm text-zinc-400 leading-6 mb-6">
              Generate your Semaphore identity locally and store the resulting
              commitment in the backend. This is the first step toward an
              anonymous claim flow.
            </p>

            {eligible ? (
              <button
                onClick={handleGenerateIdentity}
                className="w-full rounded-2xl bg-white text-black px-5 py-3 font-semibold hover:bg-zinc-200 transition"
              >
                Generate Semaphore Identity
              </button>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                Identity generation is available only for eligible contributors.
              </div>
            )}

            {commitmentStatus && (
              <div className="mt-6 rounded-2xl border border-blue-400/20 bg-blue-400/10 p-4 text-sm text-blue-200 break-words">
                {commitmentStatus}
              </div>
            )}

            {identitySaved && (
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => {
                    const saved = localStorage.getItem("semaphoreIdentityTrapdoor");
                    if (!saved) return;
                    const blob = new Blob([saved], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "semaphore-identity.json";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="w-full rounded-2xl border border-white/10 bg-black/20 px-5 py-3 text-sm font-semibold text-zinc-300 hover:bg-white/10 transition"
                >
                  Download Identity Backup
                </button>

                <a
                  href="/claim"
                  className="block w-full rounded-2xl bg-emerald-500 text-white text-center px-5 py-3 font-semibold hover:bg-emerald-400 transition"
                >
                  Go to Claim Airdrop
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}