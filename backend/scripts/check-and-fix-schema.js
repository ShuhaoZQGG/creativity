// Script to check and fix all missing columns in ab_tests table
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkAndFixSchema() {
  try {
    console.log('Checking ab_tests table schema...\n');

    // Get current columns
    const columns = await prisma.$queryRawUnsafe(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'ab_tests'
      ORDER BY ordinal_position;
    `);

    console.log('Current columns in ab_tests table:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
    });

    // Define required columns based on Prisma schema
    const requiredColumns = [
      { name: 'id', type: 'TEXT', nullable: false },
      { name: 'user_id', type: 'TEXT', nullable: false },
      { name: 'name', type: 'TEXT', nullable: true },
      { name: 'creative_ids', type: 'TEXT[]', nullable: false },
      { name: 'meta_campaign_id', type: 'TEXT', nullable: true },
      { name: 'meta_ad_set_id', type: 'TEXT', nullable: true },
      { name: 'budget', type: 'DOUBLE PRECISION', nullable: true },
      { name: 'objective', type: 'TEXT', nullable: true },
      { name: 'audience', type: 'JSONB', nullable: true },
      { name: 'duration_days', type: 'INTEGER', nullable: true },
      { name: 'results', type: 'JSONB', nullable: true },
      { name: 'status', type: 'TEXT', nullable: false },
      { name: 'winner_creative_id', type: 'TEXT', nullable: true },
      { name: 'start_date', type: 'TIMESTAMP', nullable: true },
      { name: 'end_date', type: 'TIMESTAMP', nullable: true },
      { name: 'created_at', type: 'TIMESTAMP', nullable: false },
      { name: 'updated_at', type: 'TIMESTAMP', nullable: false },
    ];

    const existingColumnNames = columns.map(c => c.column_name);
    const missingColumns = requiredColumns.filter(
      req => !existingColumnNames.includes(req.name)
    );

    if (missingColumns.length === 0) {
      console.log('\n✓ All required columns exist!');
      return;
    }

    console.log('\n⚠ Missing columns:');
    missingColumns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });

    console.log('\nAdding missing columns...');

    for (const col of missingColumns) {
      const nullable = col.nullable ? '' : ' NOT NULL';
      let defaultValue = '';

      // Add default values for NOT NULL columns
      if (!col.nullable) {
        if (col.type === 'TEXT') {
          defaultValue = " DEFAULT ''";
        } else if (col.type === 'TEXT[]') {
          defaultValue = " DEFAULT '{}'";
        } else if (col.type === 'TIMESTAMP') {
          defaultValue = ' DEFAULT NOW()';
        }
      }

      const sql = `ALTER TABLE "ab_tests" ADD COLUMN "${col.name}" ${col.type}${nullable}${defaultValue};`;
      console.log(`  Executing: ${sql}`);

      try {
        await prisma.$executeRawUnsafe(sql);
        console.log(`  ✓ Added ${col.name}`);
      } catch (error) {
        console.error(`  ✗ Failed to add ${col.name}:`, error.message);
      }
    }

    console.log('\n✓ Schema update completed!');
  } catch (error) {
    console.error('Error checking/fixing schema:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

checkAndFixSchema()
  .then(() => {
    console.log('\nDone!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nFailed:', error);
    process.exit(1);
  });
