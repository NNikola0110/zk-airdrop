"use client";

export default function HomePage() {
  const handleLogin = () => {
    window.location.href = "http://localhost:3001/auth/github";
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl shadow-md border p-8">
        <h1 className="text-2xl font-bold mb-4">zk-airdrop</h1>
        <p className="text-sm text-gray-600 mb-6">
          Login with GitHub to start the contributor check flow.
        </p>

        <button
          onClick={handleLogin}
          className="w-full rounded-xl px-4 py-3 bg-black text-white font-medium"
        >
          Login with GitHub
        </button>
      </div>
    </main>
  );
}