#!/bin/bash
# DNA Hub - Environment Setup Helper
# Run: bash setup-env.sh

echo "======================================"
echo "DNA Hub - Environment Setup"
echo "======================================"
echo ""

if [ -f .env.local ]; then
    echo "⚠️  .env.local already exists!"
    echo ""
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

echo "Creating .env.local from template..."
cp .env.example .env.local

echo "✓ Created .env.local"
echo ""
echo "Next steps:"
echo "1. Open .env.local in your editor"
echo "2. Replace placeholder values with your actual credentials:"
echo "   - Get Supabase credentials from: https://supabase.com/dashboard/project/_/settings/api"
echo "   - Get Resend API key from: https://resend.com/api-keys (optional for dev)"
echo "3. Save the file"
echo "4. Restart your dev server (npm run dev)"
echo "5. Run the test: node test-training-detailed.js"
echo ""
echo "Opening .env.local now..."

# Try to open with common editors
if command -v code &> /dev/null; then
    code .env.local
elif command -v nano &> /dev/null; then
    nano .env.local
elif command -v vi &> /dev/null; then
    vi .env.local
else
    echo "Please open .env.local manually in your preferred editor"
fi
