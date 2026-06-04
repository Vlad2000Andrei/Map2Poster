#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

# Help function
show_help() {
  echo "Usage: ./publish.sh -u <dockerhub_username> [-t <tag>] [-p <platforms>]"
  echo "  -u  Docker Hub username (required)"
  echo "  -t  Custom image tag (defaults to version in pyproject.toml)"
  echo "  -p  Target platforms (comma-separated, defaults to 'linux/amd64,linux/arm64')"
  exit 1
}

USERNAME=""
TAG=""
PLATFORMS="linux/amd64,linux/arm64"

# Parse arguments
while getopts "u:t:p:h" opt; do
  case $opt in
    u) USERNAME="$OPTARG" ;;
    t) TAG="$OPTARG" ;;
    p) PLATFORMS="$OPTARG" ;;
    h) show_help ;;
    *) show_help ;;
  esac
done

if [ -z "$USERNAME" ]; then
  echo "Error: Docker Hub username (-u) is required."
  show_help
fi

# Convert username to lowercase
USERNAME=$(echo "$USERNAME" | tr '[:upper:]' '[:lower:]')

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

IMAGE_BASE="$USERNAME/map2poster"
VERSION_TAG="$IMAGE_BASE:$TAG"
LATEST_TAG="$IMAGE_BASE:latest"

echo "Building and pushing multi-platform Docker image for platforms '$PLATFORMS'..."
docker buildx build --platform "$PLATFORMS" -t "$VERSION_TAG" -t "$LATEST_TAG" --push "$SCRIPT_DIR/.."

echo "Successfully published $VERSION_TAG and $LATEST_TAG to Docker Hub!"
