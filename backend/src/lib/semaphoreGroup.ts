import { Group } from "@semaphore-protocol/group";
import { prisma } from "./prisma";

// In-memory cache of groups per campaign
const groups: Map<number, Group> = new Map();

export async function getOrCreateGroup(campaignId: number): Promise<Group> {
  if (groups.has(campaignId)) {
    return groups.get(campaignId)!;
  }

  // Load existing commitments from DB and rebuild the group
  const commitments = await prisma.identityCommitment.findMany({
    where: { campaignId },
    orderBy: { id: "asc" },
  });

  const group = new Group();
  for (const c of commitments) {
    group.addMember(BigInt(c.commitment));
  }

  groups.set(campaignId, group);
  return group;
}

export function addMemberToGroup(campaignId: number, commitment: bigint) {
  const group = groups.get(campaignId);
  if (group) {
    group.addMember(commitment);
  }
}

export function clearGroupCache(campaignId: number) {
  groups.delete(campaignId);
}
