"use client";

export default function HomePage() {
  const handleLogin = () => {
    window.location.href = "http://localhost:3001/auth/github";
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-black text-white flex items-center justify-center px-6">
      <div className="w-full max-w-2xl">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-10">
          <div className="mb-8">
            <p className="inline-flex items-center rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              GitHub Contributor Airdrop
            </p>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            zk-airdrop
          </h1>

          <p className="text-zinc-300 text-base md:text-lg leading-7 max-w-xl mb-8">
            Log in with GitHub to check whether you are eligible for the active
            contributor campaign and prepare your anonymous identity for the
            airdrop flow.
          </p>

          <div className="grid gap-4 md:grid-cols-3 mb-10">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold mb-1">1. GitHub Login</p>
              <p className="text-sm text-zinc-400">
                Authenticate and fetch your GitHub username.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold mb-1">2. Eligibility Check</p>
              <p className="text-sm text-zinc-400">
                Verify if you contributed to the active repo campaign.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm font-semibold mb-1">3. Identity Setup</p>
              <p className="text-sm text-zinc-400">
                Generate your Semaphore identity for anonymous claims.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={handleLogin}
              className="rounded-2xl bg-white text-black px-6 py-3 font-semibold hover:bg-zinc-200 transition"
            >
              Continue with GitHub
            </button>

            <a
              href="/sponsor"
              className="rounded-2xl bg-purple-500 text-white px-6 py-3 font-semibold hover:bg-purple-400 transition"
            >
              Sponsor a Repo
            </a>

            <a
              href="/distributions"
              className="rounded-2xl border border-white/10 bg-white/5 px-6 py-3 font-semibold text-zinc-300 hover:bg-white/10 transition"
            >
              View Distributions
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}