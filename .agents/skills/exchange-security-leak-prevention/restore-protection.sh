#!/bin/bash
# Restore protection for the security agent
# Run this if verify-protection.sh shows issues

echo "=========================================="
echo "Restoring Security Agent Protection"
echo "=========================================="
echo ""

AGENT_DIR=".agents/skills/exchange-security-leak-prevention"
AGENT_FILE="$AGENT_DIR/SKILL.md"
GITATTRIBUTES=".gitattributes"

# Create .gitattributes if it doesn't exist
echo "1. Ensuring .gitattributes exists..."
if [ ! -f "$GITATTRIBUTES" ]; then
    touch "$GITATTRIBUTES"
    echo "   ✓ Created $GITATTRIBUTES"
else
    echo "   ✓ $GITATTRIBUTES already exists"
fi
echo ""

# Add merge=ours for agent file
echo "2. Configuring merge=ours for agent file..."
if ! grep -q "$AGENT_FILE merge=ours" "$GITATTRIBUTES" 2>/dev/null; then
    echo "$AGENT_FILE merge=ours" >> "$GITATTRIBUTES"
    echo "   ✓ Added merge=ours for agent file"
else
    echo "   ✓ merge=ours already configured for agent file"
fi
echo ""

# Add merge=ours for agent directory
echo "3. Configuring merge=ours for agent directory..."
if ! grep -q "$AGENT_DIR/ merge=ours" "$GITATTRIBUTES" 2>/dev/null; then
    echo "$AGENT_DIR/ merge=ours" >> "$GITATTRIBUTES"
    echo "   ✓ Added merge=ours for agent directory"
else
    echo "   ✓ merge=ours already configured for agent directory"
fi
echo ""

# Configure git merge driver
echo "4. Configuring git merge driver..."
git config --local merge.ours.driver "true"
echo "   ✓ Set merge.ours.driver to 'true'"
echo ""

# Verify
echo "5. Verifying configuration..."
./.agents/skills/exchange-security-leak-prevention/verify-protection.sh
