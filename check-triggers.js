#!/usr/bin/env node
/**
 * Check if database triggers exist
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Read .env.local
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

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTriggers() {
  console.log('\n🔍 Checking database triggers and functions...\n');

  try {
    // Query to check if triggers exist
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          trigger_name,
          event_object_table,
          action_statement
        FROM information_schema.triggers
        WHERE trigger_name LIKE '%training%' OR trigger_name LIKE '%init%'
        ORDER BY trigger_name;
      `
    });

    if (error) {
      console.log('Note: Cannot query triggers directly (this is normal)');
      console.log('We need to check manually in Supabase SQL Editor\n');

      console.log('📋 Required trigger to check in Supabase SQL Editor:');
      console.log('   Run this query:');
      console.log('');
      console.log('   SELECT trigger_name, event_object_table');
      console.log('   FROM information_schema.triggers');
      console.log("   WHERE trigger_name = 'init_training_user_on_signup';");
      console.log('');
      console.log('   Expected result: Should show the trigger on auth.users table');
      console.log('');

      return;
    }

    if (data && data.length > 0) {
      console.log('✓ Found triggers:');
      data.forEach(t => {
        console.log(`  - ${t.trigger_name} on ${t.event_object_table}`);
      });
    } else {
      console.log('❌ No training-related triggers found');
    }

  } catch (error) {
    console.log('Error checking triggers:', error.message);
  }

  console.log('\n');
}

checkTriggers();
