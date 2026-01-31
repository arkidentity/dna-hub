#!/usr/bin/env node
/**
 * Manually create a training user for testing
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

async function createUser() {
  console.log('\n🔧 Creating training user...\n');
  console.log('Email:', EMAIL);
  console.log('Name:', NAME);
  console.log('');

  try {
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      email_confirm: true,
      user_metadata: {
        name: NAME,
        signup_source: 'training_platform'
      }
    });

    if (error) {
      console.log('❌ Error creating user:', error.message);
      console.log('   Details:', JSON.stringify(error, null, 2));
      return;
    }

    console.log('✓ User created successfully!');
    console.log('  User ID:', data.user.id);
    console.log('');

    // The database triggers should auto-create:
    // - user_roles (dna_trainee)
    // - dna_leader_journeys
    // - dna_content_unlocks

    // Wait a moment for triggers to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify the user was created
    console.log('Verifying user setup...\n');

    const { data: roles } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', data.user.id);

    console.log('✓ Roles:', roles?.map(r => r.role).join(', ') || 'none (triggers may not have fired)');

    const { data: journey } = await supabase
      .from('dna_leader_journeys')
      .select('*')
      .eq('user_id', data.user.id)
      .single();

    console.log('✓ Journey:', journey ? `stage=${journey.current_stage}` : 'not created (triggers may not have fired)');

    console.log('\n✅ Done! Now try logging in.\n');

  } catch (error) {
    console.log('\n❌ Unexpected error:', error.message);
  }
}

createUser();
