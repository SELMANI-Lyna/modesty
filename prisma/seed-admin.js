/**
 * One-off Admin Seeder Script
 *
 * Usage:
 *   node prisma/seed-admin.js
 *   node prisma/seed-admin.js <email> <password>
 *   ADMIN_EMAIL=custom@example.com ADMIN_PASSWORD=secret node prisma/seed-admin.js
 */

require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ ERROR: DATABASE_URL is not set in environment or .env/.env.local");
  process.exit(1);
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const args = process.argv.slice(2);
  const emailInput = args[0] || process.env.ADMIN_EMAIL || "admin@shop.local";
  const passwordInput = args[1] || process.env.ADMIN_PASSWORD || "admin123456";

  const email = emailInput.trim().toLowerCase();

  if (!email || !passwordInput) {
    console.error("❌ ERROR: Both email and password must be provided.");
    process.exit(1);
  }

  console.log(`\n🌱 Seeding Admin Account for: ${email}...`);

  // Hash password using bcrypt (12 salt rounds)
  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(passwordInput, saltRounds);

  // Upsert the Admin record in PostgreSQL
  const admin = await prisma.admin.upsert({
    where: { email },
    update: {
      passwordHash,
    },
    create: {
      email,
      passwordHash,
    },
  });

  console.log("✅ SUCCESS: Admin record created/updated successfully!");
  console.log("--------------------------------------------------");
  console.log(`  Admin ID : ${admin.id}`);
  console.log(`  Email    : ${admin.email}`);
  console.log("  Password : [SECURELY HASHED with bcrypt]");
  console.log("--------------------------------------------------");
  console.log("You can now log in at /admin/login using these credentials.\n");
}

seedAdmin()
  .catch((err) => {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
