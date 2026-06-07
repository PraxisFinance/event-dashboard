/**
 * Seed admin rows from AUTH_ALLOWED_ADDRESSES.
 *
 * Usage:
 *   pnpm seed
 *   # or
 *   npx tsx scripts/seed.ts
 */

import { PrismaClient } from "@prisma/client/edge";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const db = new PrismaClient();

async function main() {
  const raw = process.env.AUTH_ALLOWED_ADDRESSES ?? "";
  const addresses = raw
    .split(",")
    .map((a) => a.trim())
    .filter(Boolean);

  if (addresses.length === 0) {
    console.log("AUTH_ALLOWED_ADDRESSES is empty — nothing to seed.");
    return;
  }

  console.log(`Seeding ${addresses.length} admin address(es)…`);

  for (const walletAddress of addresses) {
    const admin = await db.admin.upsert({
      where: { walletAddress: walletAddress.toLowerCase() },
      update: {},
      create: { walletAddress: walletAddress.toLowerCase() },
    });
    console.log(`  ✓ ${admin.walletAddress} (id: ${admin.id})`);
  }

  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
