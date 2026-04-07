import { Router } from "express";

const router = Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID!;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET!;
const GITHUB_CALLBACK_URL = process.env.GITHUB_CALLBACK_URL!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

router.get("/github", (_req, res) => {
  const githubAuthUrl =
    `https://github.com/login/oauth/authorize` +
    `?client_id=${GITHUB_CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(GITHUB_CALLBACK_URL)}` +
    `&scope=read:user`;

  res.redirect(githubAuthUrl);
});

router.get("/github/callback", async (req, res) => {
  const code = req.query.code as string | undefined;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const tokenResponse = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: GITHUB_CLIENT_ID,
          client_secret: GITHUB_CLIENT_SECRET,
          code,
          redirect_uri: GITHUB_CALLBACK_URL,
        }),
      }
    );

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      [key: string]: unknown;
    };

    if (!tokenData.access_token) {
      return res.status(400).json({
        error: "Failed to get access token",
        details: tokenData,
      });
    }

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "zk-airdrop-local",
      },
    });

    const userData = (await userResponse.json()) as {
      login?: string;
      [key: string]: unknown;
    };

    const githubLogin = userData.login;

    if (!githubLogin) {
      return res.status(400).json({
        error: "Failed to fetch GitHub user",
        details: userData,
      });
    }

    return res.redirect(
      `${FRONTEND_URL}/dashboard?githubLogin=${encodeURIComponent(githubLogin)}`
    );
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "GitHub auth failed" });
  }
});

export default router;
