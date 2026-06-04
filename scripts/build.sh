#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Help function
show_help() {
  echo "Usage: ./build.sh [-t <tag>] [-p <platform>]"
  echo "  -t  Custom image tag (defaults to version in pyproject.toml)"
  echo "  -p  Target platform (e.g., linux/arm64)"
  exit 1
}

TAG=""
PLATFORM=""

# Parse arguments
while getopts "t:p:h" opt; do
  case $opt in
    t) TAG="$OPTARG" ;;
    p) PLATFORM="$OPTARG" ;;
    h) show_help ;;
    *) show_help ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Extract version from pyproject.toml if tag is not specified
if [ -z "$TAG" ]; then
  if [ -f "$SCRIPT_DIR/../pyproject.toml" ]; then
    TAG=$(grep -E '^version\s*=' "$SCRIPT_DIR/../pyproject.toml" | head -n 1 | cut -d'"' -f2)
    echo "Found version '$TAG' in pyproject.toml"
  fi
fi

if [ -z "$TAG" ]; then
  TAG="0.1.0"
  echo "Could not parse version from pyproject.toml, defaulting to '$TAG'"
fi

VERSION_TAG="map2poster:$TAG"
LATEST_TAG="map2poster:latest"

if [ -n "$PLATFORM" ]; then
  echo "Building Docker image for platform '$PLATFORM' locally..."
  docker buildx build --platform "$PLATFORM" --load -t "$VERSION_TAG" -t "$LATEST_TAG" "$SCRIPT_DIR/.."
else
  echo "Building Docker image locally..."
  docker build -t "$VERSION_TAG" -t "$LATEST_TAG" "$SCRIPT_DIR/.."
fi

echo "Successfully built local images:"
echo " - $VERSION_TAG"
echo " - $LATEST_TAG"
