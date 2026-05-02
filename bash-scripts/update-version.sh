#!/bin/bash

set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <version>"
  echo "Example: $0 1.2.0"
  exit 1
fi

NEW_VERSION="$1"

if ! [[ "$NEW_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo "Error: Version must be in semver format (e.g., 1.2.0)"
  exit 1
fi

PACKAGE_JSON="package.json"
MANIFEST_JSON="manifest.json"

if [ ! -f "$PACKAGE_JSON" ]; then
  echo "Error: $PACKAGE_JSON not found"
  exit 1
fi

if [ ! -f "$MANIFEST_JSON" ]; then
  echo "Error: $MANIFEST_JSON not found"
  exit 1
fi

OLD_VERSION=$(grep -o '"version": "[^"]*"' "$PACKAGE_JSON" | head -1 | sed 's/"version": "//;s/"$//')

echo "Updating version: $OLD_VERSION → $NEW_VERSION"

sed -i "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/g" "$PACKAGE_JSON"
sed -i "s/\"version\": \"$OLD_VERSION\"/\"version\": \"$NEW_VERSION\"/g" "$MANIFEST_JSON"

echo "Version updated to $NEW_VERSION in:"
echo "  - $PACKAGE_JSON"
echo "  - $MANIFEST_JSON"