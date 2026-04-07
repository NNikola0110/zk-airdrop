import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Get active round for a campaign
router.get("/active/:campaignId", async (req, res) => {
  const campaignId = Number(req.params.campaignId);

  if (isNaN(campaignId)) {
    return res.status(400).json({ error: "Invalid campaignId" });
  }

  try {
    const round = await prisma.round.findFirst({
      where: {
        campaignId,
        isActive: true,
        startDate: { lte: new Date() },
        endDate: { gte: new Date() },
      },
    });

    if (!round) {
      return res.status(404).json({ error: "No active round found" });
    }

    return res.json(round);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch active round" });
  }
});

// Create a new round
router.post("/", async (req, res) => {
  const { campaignId, name, amountPerClaim, startDate, endDate } = req.body as {
    campaignId?: number;
    name?: string;
    amountPerClaim?: number;
    startDate?: string;
    endDate?: string;
  };

  if (!campaignId || !name || !amountPerClaim || !startDate || !endDate) {
    return res.status(400).json({
      error: "Missing campaignId, name, amountPerClaim, startDate, or endDate",
    });
  }

  try {
    const round = await prisma.round.create({
      data: {
        campaignId,
        name,
        amountPerClaim,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        isActive: true,
      },
    });

    return res.json(round);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create round" });
  }
});

export default router;
