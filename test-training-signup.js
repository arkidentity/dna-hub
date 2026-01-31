// Quick test script for DNA Training signup/login
// Run: node test-training-signup.js

const EMAIL = 'thearkidentity@gmail.com'; // Change this to your email
const API_URL = 'http://localhost:3000';

async function testSignup() {
  console.log('\n🧪 Testing DNA Training Signup...\n');

  try {
    const response = await fetch(`${API_URL}/api/training/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL }),
    });

    const data = await response.json();

    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));

    if (data.devLink) {
      console.log('\n✅ DEV MODE: Magic link generated!');
      console.log('\n🔗 Click this link to log in:\n');
      console.log(data.devLink);
      console.log('\n');
    } else if (data.success) {
      console.log('\n✅ Email would be sent (but no RESEND_API_KEY configured)');
      console.log('Check your server console for the [EMAIL - DEV MODE] log\n');
    } else {
      console.log('\n❌ Error:', data.error);
    }
  } catch (error) {
    console.error('\n❌ Failed to connect:', error.message);
    console.log('\nMake sure your dev server is running: npm run dev\n');
  }
}

testSignup();
