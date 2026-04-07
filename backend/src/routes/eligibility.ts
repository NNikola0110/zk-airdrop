import { Router } from "express";
import { prisma } from "../lib/prisma";
import { checkIfUserIsContributor } from "../lib/github";

const router = Router();

router.get("/me", async (req, res) => {
  const githubLogin = req.query.githubLogin as string | undefined;

  if (!githubLogin) {
    return res.status(400).json({ error: "Missing githubLogin" });
  }

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "desc" },
    });

    if (!campaign) {
      return res.status(404).json({ error: "No active campaign found" });
    }

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

    return res.json({
      githubLogin,
      repo: `${campaign.repoOwner}/${campaign.repoName}`,
      campaignId: campaign.id,
      campaignName: campaign.name,
      isContributor,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to check contributor status" });
  }
});

export default router;
