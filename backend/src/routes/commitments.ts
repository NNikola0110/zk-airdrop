import { Router } from "express";
import { prisma } from "../lib/prisma";
import { getOrCreateGroup, addMemberToGroup } from "../lib/semaphoreGroup";

const router = Router();

// Save a new identity commitment and add to Semaphore group
router.post("/", async (req, res) => {
  const { githubLogin, campaignId, commitment } = req.body as {
    githubLogin?: string;
    campaignId?: number;
    commitment?: string;
  };

  if (!githubLogin || !campaignId || !commitment) {
    return res.status(400).json({
      error: "Missing githubLogin, campaignId, or commitment",
    });
  }

  try {
    const latestEligibility = await prisma.eligibility.findFirst({
      where: { githubLogin, campaignId },
      orderBy: { checkedAt: "desc" },
    });

    if (!latestEligibility || !latestEligibility.isEligible) {
      return res.status(403).json({
        error: "User is not eligible for this campaign",
      });
    }

    const existingCommitment = await prisma.identityCommitment.findUnique({
      where: { commitment },
    });

    if (existingCommitment) {
      return res.status(409).json({ error: "Commitment already exists" });
    }

    const savedCommitment = await prisma.identityCommitment.create({
      data: { githubLogin, campaignId, commitment },
    });

    // Add to in-memory Semaphore group
    await getOrCreateGroup(campaignId);
    addMemberToGroup(campaignId, BigInt(commitment));

    return res.json({
      success: true,
      commitmentId: savedCommitment.id,
      commitment: savedCommitment.commitment,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to save commitment" });
  }
});

// Get all commitments for a campaign (needed by frontend to build group for proof)
router.get("/:campaignId", async (req, res) => {
  const campaignId = Number(req.params.campaignId);

  if (isNaN(campaignId)) {
    return res.status(400).json({ error: "Invalid campaignId" });
  }

  try {
    const commitments = await prisma.identityCommitment.findMany({
      where: { campaignId },
      orderBy: { id: "asc" },
      select: { commitment: true },
    });

    return res.json({
      campaignId,
      members: commitments.map((c) => c.commitment),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch commitments" });
  }
});

export default router;
