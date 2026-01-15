#!/bin/bash

# Configuration
NODE_VERSION="v22.12.0"
MONGO_VERSION="7.0.4"
OS="darwin"
ARCH="arm64"

# Create bin directory
mkdir -p bin

# Download Node.js
if [ ! -d "bin/node-$NODE_VERSION-$OS-$ARCH" ]; then
    echo "Downloading Node.js..."
    curl -o node.tar.gz "https://nodejs.org/dist/$NODE_VERSION/node-$NODE_VERSION-$OS-$ARCH.tar.gz"
    tar -xzf node.tar.gz -C bin/
    rm node.tar.gz
    echo "Node.js setup complete."
else
    echo "Node.js already installed."
fi

# Download MongoDB
if [ ! -d "bin/mongodb-macos-$ARCH-$MONGO_VERSION" ]; then
    echo "Downloading MongoDB..."
    # MongoDB download URL structure can vary, using a known working pattern or generic
    # For macOS ARM64
    curl -O "https://fastdl.mongodb.org/osx/mongodb-macos-$ARCH-$MONGO_VERSION.tgz"
    tar -xzf "mongodb-macos-$ARCH-$MONGO_VERSION.tgz" -C bin/
    rm "mongodb-macos-$ARCH-$MONGO_VERSION.tgz"
    echo "MongoDB setup complete."
else
    echo "MongoDB already installed."
fi

# Create data directory for MongoDB
mkdir -p db_data
