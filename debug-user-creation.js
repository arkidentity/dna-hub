#!/usr/bin/env node
/**
 * Debug user creation with detailed error logging
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

const EMAIL = 'thearkidentity@gmail.com';
const NAME = 'Travis';

async function debugUserCreation() {
  console.log('\n🔍 Debugging user creation...\n');

  // Step 1: Check if user already exists
  console.log('Step 1: Checking if user exists...');
  const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers();

  if (listError) {
    console.log('❌ Error listing users:', listError);
    return;
  }

  const existing = existingUsers.users?.find(u => u.email?.toLowerCase() === EMAIL.toLowerCase());

  if (existing) {
    console.log('✓ User already exists!');
    console.log('  User ID:', existing.id);
    console.log('  Email:', existing.email);
    console.log('  Created:', existing.created_at);
    console.log('  Metadata:', JSON.stringify(existing.user_metadata, null, 2));

    console.log('\n✅ User exists - you can try logging in now!\n');
    return existing;
  }

  console.log('! User does not exist, attempting to create...\n');

  // Step 2: Try to create user with detailed error handling
  console.log('Step 2: Creating user...');
  console.log('  Email:', EMAIL);
  console.log('  Name:', NAME);

  const { data, error } = await supabase.auth.admin.createUser({
    email: EMAIL,
    email_confirm: true,
    user_metadata: {
      name: NAME,
      signup_source: 'training_platform'
    }
  });

  if (error) {
    console.log('\n❌ Error creating user:');
    console.log('  Message:', error.message);
    console.log('  Status:', error.status);
    console.log('  Code:', error.code);
    console.log('  Full error:', JSON.stringify(error, null, 2));

    console.log('\n🔧 Possible causes:');
    console.log('  1. Database trigger failing (check Supabase logs)');
    console.log('  2. Row Level Security (RLS) policies blocking inserts');
    console.log('  3. Missing table permissions');
    console.log('\n📋 Next step: Check Supabase Dashboard > Logs > Postgres Logs');
    return;
  }

  console.log('\n✓ User created successfully!');
  console.log('  User ID:', data.user.id);
  console.log('  Email:', data.user.email);

  // Wait for triggers to complete
  console.log('\n⏳ Waiting for database triggers to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Step 3: Verify related records were created
  console.log('\nStep 3: Verifying related records...');

  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', data.user.id);

  if (rolesError) {
    console.log('❌ Error checking roles:', rolesError.message);
  } else {
    console.log('✓ User roles:', roles?.map(r => r.role).join(', ') || 'NONE - trigger may have failed');
  }

  const { data: journey, error: journeyError } = await supabase
    .from('dna_leader_journeys')
    .select('*')
    .eq('user_id', data.user.id)
    .single();

  if (journeyError) {
    console.log('❌ Error checking journey:', journeyError.message);
  } else {
    console.log('✓ Journey stage:', journey?.current_stage || 'NONE - trigger may have failed');
  }

  const { data: unlocks, error: unlocksError } = await supabase
    .from('dna_content_unlocks')
    .select('*')
    .eq('user_id', data.user.id);

  if (unlocksError) {
    console.log('❌ Error checking unlocks:', unlocksError.message);
  } else {
    console.log('✓ Content unlocks:', unlocks?.map(u => u.content_type).join(', ') || 'NONE - trigger may have failed');
  }

  console.log('\n✅ Done!\n');
  return data.user;
}

debugUserCreation();
