"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

type EligibilityResponse = {
  githubLogin: string;
  repo: string;
  isContributor: boolean;
};

export default function DashboardPage() {
  const searchParams = useSearchParams();
  const githubLogin = searchParams.get("githubLogin");

  const [data, setData] = useState<EligibilityResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) {
    return <main className="p-8">Loading...</main>;
  }

  if (error) {
    return <main className="p-8 text-red-600">Error: {error}</main>;
  }

  if (!data) {
    return <main className="p-8">No data</main>;
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-lg w-full rounded-2xl shadow-md border p-8">
        <h1 className="text-2xl font-bold mb-6">Contributor Status</h1>

        <div className="space-y-3 text-sm">
          <p>
            <span className="font-semibold">GitHub user:</span> {data.githubLogin}
          </p>
          <p>
            <span className="font-semibold">Repo:</span> {data.repo}
          </p>
          <p>
            <span className="font-semibold">Status:</span>{" "}
            {data.isContributor ? "ELIGIBLE" : "NOT ELIGIBLE"}
          </p>
        </div>
      </div>
    </main>
  );
}