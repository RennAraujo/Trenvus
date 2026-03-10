#!/bin/bash
# Verify that the security agent protection is active
# Run this script to ensure the agent cannot be modified by git pull/merge

echo "=========================================="
echo "Security Agent Protection Verification"
echo "=========================================="
echo ""

AGENT_FILE=".agents/skills/exchange-security-leak-prevention/SKILL.md"
GITATTRIBUTES=".gitattributes"
ERRORS=0

# Check if agent file exists
echo "1. Checking if agent file exists..."
if [ -f "$AGENT_FILE" ]; then
    echo "   ✓ Agent file found: $AGENT_FILE"
else
    echo "   ✗ Agent file NOT FOUND: $AGENT_FILE"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check .gitattributes exists
echo "2. Checking .gitattributes..."
if [ -f "$GITATTRIBUTES" ]; then
    echo "   ✓ .gitattributes exists"
else
    echo "   ✗ .gitattributes NOT FOUND"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check merge=ours in .gitattributes
echo "3. Checking merge=ours configuration..."
if grep -q "$AGENT_FILE merge=ours" "$GITATTRIBUTES" 2>/dev/null; then
    echo "   ✓ Agent file has merge=ours protection"
else
    echo "   ✗ Agent file MISSING merge=ours protection"
    echo "   Fix: echo \"$AGENT_FILE merge=ours\" >> $GITATTRIBUTES"
    ERRORS=$((ERRORS + 1))
fi

if grep -q ".agents/skills/exchange-security-leak-prevention/ merge=ours" "$GITATTRIBUTES" 2>/dev/null; then
    echo "   ✓ Agent directory has merge=ours protection"
else
    echo "   ✗ Agent directory MISSING merge=ours protection"
    echo "   Fix: echo \".agents/skills/exchange-security-leak-prevention/ merge=ours\" >> $GITATTRIBUTES"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check git merge driver
echo "4. Checking git merge driver configuration..."
MERGE_DRIVER=$(git config --local merge.ours.driver 2>/dev/null)
if [ "$MERGE_DRIVER" = "true" ]; then
    echo "   ✓ merge.ours.driver is set to 'true'"
else
    echo "   ✗ merge.ours.driver is NOT configured"
    echo "   Fix: git config --local merge.ours.driver \"true\""
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Check git attributes using git check-attr
echo "5. Verifying with git check-attr..."
ATTR_RESULT=$(git check-attr merge "$AGENT_FILE" 2>/dev/null | grep -o 'ours' || echo "")
if [ "$ATTR_RESULT" = "ours" ]; then
    echo "   ✓ Git confirms 'merge=ours' for agent file"
else
    echo "   ✗ Git does NOT show 'merge=ours' for agent file"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# Summary
echo "=========================================="
if [ $ERRORS -eq 0 ]; then
    echo "✅ PROTECTION IS ACTIVE"
    echo ""
    echo "The security agent is protected from:"
    echo "  • git pull (won't overwrite)"
    echo "  • git merge (will keep local version)"
    echo "  • accidental modifications via remote"
    echo ""
    echo "To test: Try 'git pull' - the agent file should not change"
    exit 0
else
    echo "❌ PROTECTION IS INCOMPLETE ($ERRORS issues found)"
    echo ""
    echo "Run the suggested fixes above or execute:"
    echo "  ./restore-protection.sh"
    exit 1
fi
echo "=========================================="
