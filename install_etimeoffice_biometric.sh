#!/bin/bash
# install_etimeoffice_biometric.sh
# Installs the etimeoffice_biometric app into ERPNext
# Usage: bash /tmp/etimeoffice_biometric/install_etimeoffice_biometric.sh <site-name>

set -e

BENCH_DIR="/home/frappe/frappe-bench"
APP_SRC="/tmp/etimeoffice_biometric"
APP_NAME="etimeoffice_biometric"
SITE_NAME="${1:-erpnext.local}"

echo ""
echo "=============================================="
echo "  Etimeoffice Biometric - ERPNext Installer  "
echo "=============================================="
echo ""
echo "  Bench : $BENCH_DIR"
echo "  App   : $APP_NAME"
echo "  Site  : $SITE_NAME"
echo ""

cd "$BENCH_DIR"

# Step 1: Remove old app if already present (clean install)
echo "[1/5] Preparing app directory..."
if [ -d "apps/$APP_NAME" ]; then
    echo "      Removing old version..."
    rm -rf "apps/$APP_NAME"
    # Remove from apps.txt if present
    sed -i "/^${APP_NAME}$/d" "apps/apps.txt" 2>/dev/null || true
fi
echo "      Done."

# Step 2: Use bench get-app with local path to properly register the app
echo "[2/5] Registering app with bench (bench get-app)..."
bench get-app "$APP_SRC"
echo "      Done."

# Step 3: Install Python dependencies
echo "[3/5] Installing Python dependencies..."
env/bin/pip install -q requests croniter
echo "      Done."

# Step 4: Install app on site
echo "[4/5] Installing app on site: $SITE_NAME ..."
bench --site "$SITE_NAME" install-app "$APP_NAME"
echo "      Done."

# Step 5: Run migrate
echo "[5/5] Running bench migrate..."
bench --site "$SITE_NAME" migrate
echo "      Done."

echo ""
echo "Installation complete!"
echo ""
echo "  Next steps:"
echo "  1. Log in to ERPNext as Administrator"
echo "  2. Search for 'Biometric Settings' - enter your API credentials"
echo "  3. Go to Home > Etimeoffice Biometric > Biometric Data Fetch"
echo "  4. Click Test Connection to verify"
echo "  5. Run a manual fetch for a test date range"
echo ""
