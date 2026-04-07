import { Router } from "express";
import { verifyProof } from "@semaphore-protocol/proof";
import { prisma } from "../lib/prisma";
import { getOrCreateGroup } from "../lib/semaphoreGroup";

const router = Router();

router.post("/", async (req, res) => {
  const { roundId, walletAddress, proof } = req.body as {
    roundId?: number;
    walletAddress?: string;
    proof?: any;
  };

  // Input validation
  if (!roundId || !walletAddress || !proof) {
    return res.status(400).json({
      error: "Missing roundId, walletAddress, or proof",
    });
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
    return res.status(400).json({ error: "Invalid wallet address" });
  }

  try {
    // 1. Find the round and check if it's active
    const round = await prisma.round.findUnique({
      where: { id: roundId },
      include: { campaign: true },
    });

    if (!round) {
      return res.status(404).json({ error: "Round not found" });
    }

    if (!round.isActive) {
      return res.status(400).json({ error: "Round is not active" });
    }

    const now = new Date();
    if (now < round.startDate || now > round.endDate) {
      return res.status(400).json({ error: "Round is not within active period" });
    }

    // 2. Check nullifier - prevent double claims
    const nullifierHash = proof.nullifier;

    const existingNullifier = await prisma.nullifier.findUnique({
      where: { nullifierHash: String(nullifierHash) },
    });

    if (existingNullifier) {
      return res.status(409).json({ error: "Airdrop already claimed for this round" });
    }

    // 3. Rebuild the Semaphore group and verify the proof
    const group = await getOrCreateGroup(round.campaignId);

    const isValid = await verifyProof(proof);

    if (!isValid) {
      return res.status(400).json({ error: "Invalid ZK proof" });
    }

    // 4. Save nullifier and distribution atomically
    await prisma.$transaction([
      prisma.nullifier.create({
        data: {
          nullifierHash: String(nullifierHash),
          roundId,
        },
      }),
      prisma.distribution.create({
        data: {
          walletAddress,
          amount: round.amountPerClaim,
          nullifierHash: String(nullifierHash),
          roundId,
        },
      }),
    ]);

    return res.json({
      success: true,
      walletAddress,
      amount: round.amountPerClaim,
      message: "Airdrop claimed successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to process claim" });
  }
});

export default router;
