#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./docker/push-dockerhub.sh <dockerhub_user> [version]
# Example:
#   ./docker/push-dockerhub.sh nhatcuong 1.0.0

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <dockerhub_user> [version]"
  exit 1
fi

DOCKERHUB_USER="$1"
VERSION="${2:-$(date +%Y.%m.%d.%H%M)}"
IMAGE_NAME="ghost-labor"
IMAGE="${DOCKERHUB_USER}/${IMAGE_NAME}"

echo "Logging into Docker Hub..."
docker login

echo "Building image..."
docker build -f docker/Dockerfile -t "${IMAGE}:${VERSION}" -t "${IMAGE}:latest" .

echo "Pushing tags..."
docker push "${IMAGE}:${VERSION}"
docker push "${IMAGE}:latest"

echo "Done."
echo "Pushed:"
echo "  - ${IMAGE}:${VERSION}"
echo "  - ${IMAGE}:latest"
