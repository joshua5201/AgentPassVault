#!/bin/sh
# Copy hooks to .git/hooks
cp scripts/hooks/pre-push .git/hooks/pre-push
chmod +x .git/hooks/pre-push
echo "Git hooks installed."
