#!/bin/sh
# Portable Maven Wrapper script

set -e

WRAPPER_DIR="$(cd "$(dirname "$0")" && pwd)"
MAVEN_VERSION="3.9.9"
MAVEN_HOME="$HOME/.m2/wrapper/dists/apache-maven-${MAVEN_VERSION}"

if command -v mvn >/dev/null 2>&1; then
    exec mvn "$@"
fi

if [ ! -d "$MAVEN_HOME" ]; then
    echo "Maven not found locally. Downloading Apache Maven ${MAVEN_VERSION}..."
    mkdir -p "$MAVEN_HOME"
    TMP_ZIP="/tmp/apache-maven-${MAVEN_VERSION}.tar.gz"
    curl -fsSL "https://archive.apache.org/dist/maven/maven-3/${MAVEN_VERSION}/binaries/apache-maven-${MAVEN_VERSION}-bin.tar.gz" -o "$TMP_ZIP"
    tar -xzf "$TMP_ZIP" -C "$MAVEN_HOME" --strip-components 1
    rm -f "$TMP_ZIP"
fi

exec "$MAVEN_HOME/bin/mvn" "$@"
