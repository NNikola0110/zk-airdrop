import { Router } from "express";
import { prisma } from "../lib/prisma";
import { checkIfUserIsContributor } from "../lib/github";

const router = Router();

// Check eligibility across ALL active campaigns
router.get("/me", async (req, res) => {
  const githubLogin = req.query.githubLogin as string | undefined;

  if (!githubLogin) {
    return res.status(400).json({ error: "Missing githubLogin" });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { isActive: true },
      include: { rounds: { where: { isActive: true } } },
    });

    if (campaigns.length === 0) {
      return res.status(404).json({ error: "No active campaigns found" });
    }

    const results = [];

    for (const campaign of campaigns) {
      const isContributor = await checkIfUserIsContributor(
        githubLogin,
        campaign.repoOwner,
        campaign.repoName
      );

      await prisma.eligibility.create({
        data: {
          githubLogin,
          isEligible: isContributor,
          campaignId: campaign.id,
        },
      });

      results.push({
        campaignId: campaign.id,
        campaignName: campaign.name,
        repo: `${campaign.repoOwner}/${campaign.repoName}`,
        totalAmount: campaign.totalAmount,
        isContributor,
        activeRound: campaign.rounds[0] || null,
      });
    }

    return res.json({
      githubLogin,
      campaigns: results,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to check contributor status" });
  }
});

export default router;
