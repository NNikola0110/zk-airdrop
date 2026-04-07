import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Sponsor creates a new campaign for a repo
router.post("/", async (req, res) => {
  const { repoOwner, repoName, totalAmount, sponsorAddress, durationDays } =
    req.body as {
      repoOwner?: string;
      repoName?: string;
      totalAmount?: number;
      sponsorAddress?: string;
      durationDays?: number;
    };

  if (!repoOwner || !repoName || !totalAmount || !sponsorAddress) {
    return res.status(400).json({
      error: "Missing repoOwner, repoName, totalAmount, or sponsorAddress",
    });
  }

  if (totalAmount <= 0) {
    return res.status(400).json({ error: "totalAmount must be positive" });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(sponsorAddress)) {
    return res.status(400).json({ error: "Invalid sponsor wallet address" });
  }

  try {
    // Check if repo exists on GitHub
    const repoCheck = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "zk-airdrop-local",
        },
      }
    );

    if (!repoCheck.ok) {
      return res.status(404).json({ error: "GitHub repository not found" });
    }

    // Count contributors to calculate amount per claim
    const contribRes = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/contributors`,
      {
        headers: {
          Accept: "application/vnd.github+json",
          "User-Agent": "zk-airdrop-local",
        },
      }
    );

    const contributors = (await contribRes.json()) as Array<unknown>;
    const contributorCount = contributors.length || 1;
    const amountPerClaim = totalAmount / contributorCount;

    // Create campaign + round in a transaction
    const days = durationDays || 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);

    const campaign = await prisma.campaign.create({
      data: {
        name: `${repoOwner}/${repoName} Airdrop`,
        repoOwner,
        repoName,
        totalAmount,
        sponsorAddress,
        isActive: true,
        rounds: {
          create: {
            name: "Round 1",
            isActive: true,
            amountPerClaim,
            startDate,
            endDate,
          },
        },
      },
      include: { rounds: true },
    });

    return res.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        repo: `${repoOwner}/${repoName}`,
        totalAmount,
        sponsorAddress,
        contributorCount,
        amountPerClaim,
        round: campaign.rounds[0],
      },
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create campaign" });
  }
});

// List all active campaigns
router.get("/", async (_req, res) => {
  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      include: {
        rounds: { where: { isActive: true } },
        _count: { select: { commitments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.json(campaigns);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch campaigns" });
  }
});

export default router;
