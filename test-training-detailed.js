#!/usr/bin/env node
/**
 * DNA Training Platform - Detailed Diagnostic Test
 *
 * This script will help you identify exactly what's wrong with the signup/login flow.
 * Run: node test-training-detailed.js
 */

const EMAIL = 'thearkidentity@gmail.com';
const NAME = 'DNA Admin';
const API_URL = 'http://localhost:3000';

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, symbol, message) {
  console.log(`${color}${symbol} ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${title}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

async function checkServerRunning() {
  logSection('1. Checking if dev server is running');

  try {
    const response = await fetch(`${API_URL}/`, { method: 'HEAD' });
    if (response.ok || response.status < 500) {
      log(colors.green, '✓', 'Dev server is running');
      return true;
    } else {
      log(colors.red, '✗', `Server returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    log(colors.red, '✗', 'Dev server is NOT running');
    log(colors.yellow, '!', 'Please start it with: npm run dev');
    return false;
  }
}

async function testSignup() {
  logSection('2. Testing Signup Flow');

  log(colors.blue, '→', `Attempting signup for: ${EMAIL}`);

  try {
    const response = await fetch(`${API_URL}/api/training/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, name: NAME }),
    });

    const data = await response.json();

    console.log(`\n  Status: ${response.status}`);
    console.log('  Response:', JSON.stringify(data, null, 2));

    if (response.status === 500) {
      log(colors.red, '✗', 'Internal server error');
      log(colors.yellow, '!', 'This usually means:');
      log(colors.yellow, '  ', '- Missing Supabase credentials in .env.local');
      log(colors.yellow, '  ', '- Database migrations not run');
      log(colors.yellow, '  ', '- Supabase service is down');
      return null;
    }

    if (response.status === 400) {
      if (data.error?.includes('already exists')) {
        log(colors.yellow, '!', 'Account already exists - will try login instead');
        return null;
      } else {
        log(colors.red, '✗', `Validation error: ${data.error}`);
        return null;
      }
    }

    if (data.success) {
      log(colors.green, '✓', 'Signup successful!');

      if (data.devLink) {
        log(colors.green, '✓', 'DEV MODE: Magic link returned in response');
        return data.devLink;
      } else {
        log(colors.yellow, '!', 'Email sent (or would be sent with RESEND_API_KEY)');
        return null;
      }
    }

    return null;

  } catch (error) {
    log(colors.red, '✗', `Request failed: ${error.message}`);
    return null;
  }
}

async function testLogin() {
  logSection('3. Testing Login Flow');

  log(colors.blue, '→', `Attempting login for: ${EMAIL}`);

  try {
    const response = await fetch(`${API_URL}/api/training/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL }),
    });

    const data = await response.json();

    console.log(`\n  Status: ${response.status}`);
    console.log('  Response:', JSON.stringify(data, null, 2));

    if (response.status === 500) {
      log(colors.red, '✗', 'Internal server error');
      log(colors.yellow, '!', 'Check server console for detailed error logs');
      return null;
    }

    if (data.success) {
      log(colors.green, '✓', 'Login request successful!');

      if (data.devLink) {
        log(colors.green, '✓', 'DEV MODE: Magic link returned in response');
        return data.devLink;
      } else {
        log(colors.yellow, '!', 'Email sent (or would be sent with RESEND_API_KEY)');
        return null;
      }
    }

    return null;

  } catch (error) {
    log(colors.red, '✗', `Request failed: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║          DNA Training Platform - Diagnostic Test          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}`);

  const serverRunning = await checkServerRunning();
  if (!serverRunning) {
    process.exit(1);
  }

  // Try signup first
  let magicLink = await testSignup();

  // If signup failed due to existing account, try login
  if (!magicLink) {
    magicLink = await testLogin();
  }

  logSection('Summary');

  if (magicLink) {
    log(colors.green, '✓', 'MAGIC LINK GENERATED!');
    console.log('\n  Copy and paste this URL into your browser:\n');
    console.log(`  ${colors.green}${magicLink}${colors.reset}\n`);
    log(colors.blue, '→', 'You should be redirected to the training dashboard');
  } else {
    log(colors.yellow, '!', 'No magic link received');
    console.log('\n  Possible reasons:');
    log(colors.yellow, '  ', '1. Missing .env.local file with Supabase credentials');
    log(colors.yellow, '  ', '2. Database tables not created (run migrations)');
    log(colors.yellow, '  ', '3. RESEND_API_KEY is set (check your email instead)');
    console.log('\n  Next steps:');
    log(colors.blue, '→', 'Check your server console (terminal running npm run dev)');
    log(colors.blue, '→', 'Look for error messages starting with [TrainingAuth]');
    log(colors.blue, '→', 'See TRAINING-SETUP.md for complete setup guide');
  }

  console.log('');
}

main();
