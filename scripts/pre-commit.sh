#!/usr/bin/env bash
set -e

# Colour definitions
declare -r RED='\033[0;31m'
declare -r GREEN='\033[0;32m'
declare -r YELLOW='\033[1;33m'
declare -r BLUE='\033[0;34m'
declare -r NC='\033[0m'

# Timing variables
SCRIPT_START=$(date +%s)
PHASE_START=$(date +%s)

# Log file variables
COMPILE_LOG=""
TEST_GAS_LOG=""
DOCGEN_LOG=""
TEST_COV_LOG=""
TEST_SCRIPTS_LOG=""

# Phase state variables
TEST_COV_PID=""

# Logging utilities
log_info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[SUCCESS] $1${NC}"
}

log_error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

log_phase() {
    echo -e "${YELLOW}$1${NC}"
}

log_separator() {
    echo -e "${BLUE}=================================${NC}"
}

# Timing utilities
start_phase() {
    PHASE_START=$(date +%s)
}

end_phase() {
    local phase_end=$(date +%s)
    local phase_duration=$((phase_end - PHASE_START))
    log_success "$1 completed successfully in ${phase_duration}s"
    echo ""
}

# Initialize temporary log files
initialize_log_files() {
    COMPILE_LOG=$(mktemp)
    TEST_GAS_LOG=$(mktemp)
    DOCGEN_LOG=$(mktemp)
    TEST_COV_LOG=$(mktemp)
    TEST_SCRIPTS_LOG=$(mktemp)
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary log files..."
    rm -f "$COMPILE_LOG" "$TEST_GAS_LOG" "$DOCGEN_LOG" "$TEST_COV_LOG" "$TEST_SCRIPTS_LOG"
}

# Display script header
display_header() {
    log_separator
    echo -e "${BLUE}  PRE-COMMIT CHECKS STARTED${NC}"
    log_separator
    echo ""
}

# Monitor background process and show progress
monitor_coverage_progress() {
    local pid=$1
    local count=0

    while kill -0 $pid 2>/dev/null; do
        sleep 30
        ((count++))
        log_info "Coverage tests still running... (${count}m elapsed)"
    done
}

# Phase 1: Compilation and Gas Calculation
run_phase1() {
    log_phase "[PHASE 1] Running docgen and gas calculation..."
    start_phase

    log_info "Cleaning TypeScript-generated JS files to ensure fresh build..."
    npm run clean:ts-js

    log_info "Generating contract documentation..."
    npm run docgen

    log_info "Running gas calculation tests..."
    npm run test:gas

    end_phase "Phase 1"
    log_success "All contracts compiled and gas calculations completed successfully"
}

# Phase 2: Start Coverage (parallel) + Documentation, Formatting, and Linting (sequential)
run_phase2() {
    log_phase "[PHASE 2] Starting coverage tests and running prettier/lint..."
    start_phase

    log_info "Starting coverage tests in background (this may take a while)..."
    log_info "Coverage output will be displayed after all tasks complete"
    echo ""

    # Start coverage tests in background, redirecting output to log file
    npm run test:coverage > "$TEST_COV_LOG" 2>&1 &
    TEST_COV_PID=$!

    log_info "Coverage tests running in background (PID: $TEST_COV_PID)"

    # Start progress monitor in background
    monitor_coverage_progress $TEST_COV_PID &
    local monitor_pid=$!

    echo ""

    log_info "Formatting code with Prettier..."
    npm run prettier

    log_info "Running ESLint checks..."
    npm run lint

    # Kill monitor if still running
    kill $monitor_pid 2>/dev/null || true

    end_phase "Phase 2"
    log_success "Documentation, formatting, and linting completed"
}

# Phase 3: Wait for Coverage and Run Deployment Tests
run_phase3() {
    log_phase "[PHASE 3] Finalizing coverage tests and running deployment tests..."
    start_phase

    log_info "Starting deployment script tests..."
    npm run test:scripts

    log_info "Checking coverage test status..."

    # Check if coverage is still running
    if kill -0 $TEST_COV_PID 2>/dev/null; then
        log_info "Waiting for coverage tests to complete (PID: $TEST_COV_PID)..."

        # Monitor progress while waiting
        monitor_coverage_progress $TEST_COV_PID &
        local monitor_pid=$!

        # Temporarily disable exit on error to handle background process exit codes
        set +e
        wait $TEST_COV_PID
        local test_cov_exit=$?
        set -e

        # Kill monitor if still running
        kill $monitor_pid 2>/dev/null || true
    else
        # Process already finished
        set +e
        wait $TEST_COV_PID
        local test_cov_exit=$?
        set -e
    fi

    echo ""
    log_info "Coverage tests completed. Displaying output:"
    log_separator
    cat "$TEST_COV_LOG"
    log_separator
    echo ""

    if [ $test_cov_exit -ne 0 ]; then
        log_error "Coverage tests failed with exit code $test_cov_exit"
        log_error "Please review test failures and coverage requirements"
        return 1
    fi

    log_success "Coverage tests passed"
    echo ""

    end_phase "Phase 3"
}

# Display final summary
display_summary() {
    local script_end=$(date +%s)
    local script_duration=$((script_end - SCRIPT_START))

    log_separator
    log_success "All pre-commit checks passed successfully!"
    log_success "Total execution time: ${script_duration}s"
    log_separator
}

# Main execution flow
main() {
    # Setup
    initialize_log_files
    trap cleanup EXIT

    # Display header
    display_header

    # Execute phases
    run_phase1
    run_phase2
    run_phase3

    # Display summary
    display_summary
}

# Run main function
main
