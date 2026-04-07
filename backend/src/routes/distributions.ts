import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

// Public endpoint - lists all distributions for auditability
router.get("/", async (req, res) => {
  const roundId = req.query.roundId ? Number(req.query.roundId) : undefined;

  try {
    const distributions = await prisma.distribution.findMany({
      where: roundId ? { roundId } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        round: {
          select: {
            name: true,
            campaign: { select: { name: true } },
          },
        },
      },
    });

    const totalDistributed = distributions.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    return res.json({
      totalDistributed,
      count: distributions.length,
      distributions: distributions.map((d) => ({
        walletAddress: d.walletAddress,
        amount: d.amount,
        roundName: d.round.name,
        campaignName: d.round.campaign.name,
        claimedAt: d.createdAt,
        // nullifierHash is public - proves uniqueness without revealing identity
        nullifierHash: d.nullifierHash,
      })),
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to fetch distributions" });
  }
});

export default router;
