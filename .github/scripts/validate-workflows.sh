#!/usr/bin/env bash
# =============================================================================
# Workflow Validation Script
# =============================================================================
#
# Validates GitHub Actions workflow files for:
# - YAML syntax correctness
# - Required fields presence
# - Best practices compliance
#
# Usage: ./validate-workflows.sh [workflow_dir]
# Default: .github/workflows
# =============================================================================

set -euo pipefail

WORKFLOW_DIR="${1:-.github/workflows}"
ERRORS=0
WARNINGS=0

# Colors for output
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log_error() {
    echo -e "${RED}ERROR${NC}: $1"
    ((ERRORS++))
}

log_warning() {
    echo -e "${YELLOW}WARNING${NC}: $1"
    ((WARNINGS++))
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Check if required tools are available
check_dependencies() {
    local missing=()

    if ! command -v python3 &> /dev/null; then
        missing+=("python3")
    fi

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required tools: ${missing[*]}"
        exit 1
    fi
}

# Validate YAML syntax
validate_yaml_syntax() {
    local file="$1"
    if python3 -c "import yaml; yaml.safe_load(open('$file'))" 2>/dev/null; then
        return 0
    else
        return 1
    fi
}

# Check for required workflow fields
validate_required_fields() {
    local file="$1"
    local content
    content=$(cat "$file")

    # Check for 'name' field
    if ! echo "$content" | grep -q "^name:"; then
        log_warning "$file: Missing 'name' field"
    fi

    # Check for 'on' trigger
    if ! echo "$content" | grep -q "^on:"; then
        log_error "$file: Missing 'on' trigger field"
        return 1
    fi

    # Check for 'jobs' section
    if ! echo "$content" | grep -q "^jobs:"; then
        log_error "$file: Missing 'jobs' section"
        return 1
    fi

    return 0
}

# Check for best practices
validate_best_practices() {
    local file="$1"
    local content
    content=$(cat "$file")

    # Check for timeout-minutes in jobs
    if ! echo "$content" | grep -q "timeout-minutes:"; then
        log_warning "$file: No timeout-minutes set for jobs (best practice)"
    fi

    # Check for pinned action versions
    if echo "$content" | grep -qE "uses: [^@]+@(main|master|latest)"; then
        log_warning "$file: Using unpinned action versions (main/master/latest)"
    fi

    # Check for explicit permissions
    if echo "$content" | grep -qE "permissions:" && ! echo "$content" | grep -qE "^\s+permissions:"; then
        # Has permissions at workflow or job level - good
        :
    else
        log_warning "$file: Consider adding explicit permissions for security"
    fi

    return 0
}

# Main validation
main() {
    echo "Validating GitHub Actions workflows in: $WORKFLOW_DIR"
    echo "=================================================="

    check_dependencies

    if [ ! -d "$WORKFLOW_DIR" ]; then
        log_error "Workflow directory not found: $WORKFLOW_DIR"
        exit 1
    fi

    local workflow_files
    workflow_files=$(find "$WORKFLOW_DIR" -name "*.yml" -o -name "*.yaml" 2>/dev/null | sort)

    if [ -z "$workflow_files" ]; then
        log_warning "No workflow files found in $WORKFLOW_DIR"
        exit 0
    fi

    for file in $workflow_files; do
        echo ""
        echo "Checking: $file"
        echo "---"

        # YAML syntax
        if validate_yaml_syntax "$file"; then
            log_success "YAML syntax valid"
        else
            log_error "$file: Invalid YAML syntax"
            continue
        fi

        # Required fields
        if validate_required_fields "$file"; then
            log_success "Required fields present"
        fi

        # Best practices
        validate_best_practices "$file"
    done

    echo ""
    echo "=================================================="
    echo "Validation complete."
    echo "Errors: $ERRORS"
    echo "Warnings: $WARNINGS"

    if [ $ERRORS -gt 0 ]; then
        exit 1
    fi

    exit 0
}

main "$@"
