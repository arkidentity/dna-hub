#!/usr/bin/env node
/**
 * Check if required database tables exist
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Manually read .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const requiredTables = [
  'training_magic_links',
  'dna_leader_journeys',
  'user_roles',
  'dna_content_unlocks',
];

async function checkTables() {
  console.log('\n🔍 Checking database tables...\n');

  for (const table of requiredTables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);

      if (error) {
        console.log(`❌ Table '${table}' - NOT FOUND`);
        console.log(`   Error: ${error.message}`);
      } else {
        console.log(`✓ Table '${table}' - EXISTS`);
      }
    } catch (err) {
      console.log(`❌ Table '${table}' - ERROR: ${err.message}`);
    }
  }

  console.log('\n');
}

checkTables();
