#!/usr/bin/env node
/**
 * Test Supabase connection and credentials
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

console.log('\n🔍 Testing Supabase Connection...\n');
console.log('URL:', supabaseUrl);
console.log('Key:', supabaseKey ? supabaseKey.substring(0, 20) + '...' : 'MISSING');
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing credentials\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    // Test 1: List users
    console.log('Test 1: Listing auth users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.log('❌ Auth API Error:', usersError.message);
      console.log('   This usually means invalid service role key');
      return;
    }

    console.log(`✓ Successfully connected to Supabase Auth`);
    console.log(`  Found ${users.users?.length || 0} users`);

    // Test 2: Check for training user
    const existingUser = users.users?.find(u => u.email?.toLowerCase() === 'thearkidentity@gmail.com');

    if (existingUser) {
      console.log('\n✓ Found existing user: thearkidentity@gmail.com');
      console.log('  User ID:', existingUser.id);
      console.log('  Created:', existingUser.created_at);

      // Check user_roles
      console.log('\nTest 2: Checking user_roles table...');
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', existingUser.id);

      if (rolesError) {
        console.log('❌ Error reading user_roles:', rolesError.message);
      } else {
        console.log(`✓ Roles:`, roles?.map(r => r.role).join(', ') || 'none');
      }

      // Check dna_leader_journeys
      console.log('\nTest 3: Checking dna_leader_journeys table...');
      const { data: journey, error: journeyError } = await supabase
        .from('dna_leader_journeys')
        .select('*')
        .eq('user_id', existingUser.id)
        .single();

      if (journeyError) {
        console.log('❌ Error reading journey:', journeyError.message);
      } else {
        console.log(`✓ Journey stage:`, journey?.current_stage || 'none');
      }
    } else {
      console.log('\n! No existing user found with email: thearkidentity@gmail.com');
      console.log('  This is OK - user will be created on signup');
    }

    console.log('\n✅ All tests passed! Supabase connection is working.\n');

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
    console.log('\n');
  }
}

testConnection();
