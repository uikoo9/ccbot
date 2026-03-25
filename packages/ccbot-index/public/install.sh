#!/usr/bin/env bash
# CCBot installation script
# Usage: curl -fsSL https://www.ccbot.dev/install.sh | sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
REPO="uikoo9/ccbot"
BINARY_NAME="ccbot"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

# Detect OS and architecture
detect_platform() {
    local os="$(uname -s)"
    local arch="$(uname -m)"

    case "$os" in
        Linux)
            OS="linux"
            ;;
        Darwin)
            OS="macos"
            ;;
        MINGW* | MSYS* | CYGWIN*)
            OS="win"
            ;;
        *)
            echo -e "${RED}Unsupported OS: $os${NC}"
            exit 1
            ;;
    esac

    case "$arch" in
        x86_64 | amd64)
            ARCH="x64"
            ;;
        aarch64 | arm64)
            ARCH="arm64"
            ;;
        *)
            echo -e "${RED}Unsupported architecture: $arch${NC}"
            exit 1
            ;;
    esac

    PLATFORM="${OS}-${ARCH}"
}

# Get latest release version
get_latest_version() {
    echo -e "${YELLOW}Fetching latest version...${NC}"
    VERSION=$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')

    if [ -z "$VERSION" ]; then
        echo -e "${RED}Failed to fetch latest version${NC}"
        exit 1
    fi

    echo -e "${GREEN}Latest version: $VERSION${NC}"
}

# Download and install
install_ccbot() {
    local binary_name="ccbot-${PLATFORM}"
    if [ "$OS" = "win" ]; then
        binary_name="${binary_name}.exe"
    fi

    local download_url="https://github.com/${REPO}/releases/download/${VERSION}/${binary_name}"

    echo -e "${YELLOW}Downloading from: $download_url${NC}"

    # Create temp directory
    local tmp_dir=$(mktemp -d)
    local tmp_file="${tmp_dir}/${BINARY_NAME}"

    # Download
    if ! curl -fsSL "$download_url" -o "$tmp_file"; then
        echo -e "${RED}Failed to download ccbot${NC}"
        rm -rf "$tmp_dir"
        exit 1
    fi

    # Make executable
    chmod +x "$tmp_file"

    # Install
    echo -e "${YELLOW}Installing to $INSTALL_DIR...${NC}"

    if [ -w "$INSTALL_DIR" ]; then
        mv "$tmp_file" "$INSTALL_DIR/$BINARY_NAME"
    else
        sudo mv "$tmp_file" "$INSTALL_DIR/$BINARY_NAME"
    fi

    rm -rf "$tmp_dir"

    echo -e "${GREEN}✓ CCBot installed successfully!${NC}"
    echo ""
    echo -e "Run ${GREEN}ccbot --version${NC} to verify installation"
    echo -e "Run ${GREEN}ccbot --help${NC} to get started"
}

# Check if ccbot is already installed
check_existing() {
    if command -v ccbot &> /dev/null; then
        local current_version=$(ccbot --version 2>/dev/null || echo "unknown")
        echo -e "${YELLOW}CCBot is already installed (version: $current_version)${NC}"
        read -p "Do you want to reinstall? [y/N] " -n 1 -r < /dev/tty
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo "Installation cancelled"
            exit 0
        fi
    fi
}

# Main
main() {
    echo ""
    echo "╔═╗╔═╗╔╗ ╔═╗╔╦╗"
    echo "║  ║  ╠╩╗║ ║ ║ "
    echo "╚═╝╚═╝╚═╝╚═╝ ╩ "
    echo ""
    echo "CCBot Installer"
    echo ""

    detect_platform
    echo -e "${GREEN}Detected platform: $PLATFORM${NC}"

    check_existing
    get_latest_version
    install_ccbot
}

main
