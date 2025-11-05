// Script to apply the name column migration to ab_tests table
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function applyMigration() {
  try {
    console.log('Applying migration: add name column to ab_tests table...');

    // Check if column already exists
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'ab_tests' AND column_name = 'name';
    `);

    if (result.length > 0) {
      console.log('✓ Column "name" already exists in ab_tests table');
      return;
    }

    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "ab_tests" ADD COLUMN "name" TEXT;
    `);

    console.log('✓ Successfully added "name" column to ab_tests table');
  } catch (error) {
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration()
  .then(() => {
    console.log('Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
