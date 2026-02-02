#!/bin/bash
# Mission Control Startup Script

WORKSPACE_DIR="/root/workspace"
PID_FILE="/tmp/mission-control.pid"

check_running() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

start() {
    if check_running; then
        echo "✓ Mission Control is already running (PID: $(cat $PID_FILE))"
        echo "  Access: http://localhost:8080"
        return
    fi

    echo "🚀 Starting Mission Control..."
    cd "$WORKSPACE_DIR" || exit 1
    
    nohup python3 server.py > /tmp/mission-control.log 2>&1 &
    PID=$!
    echo $PID > "$PID_FILE"
    
    # Wait for server to start
    sleep 2
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✓ Mission Control started successfully!"
        echo "  PID: $PID"
        echo "  URL: http://localhost:8080"
        echo "  Log: /tmp/mission-control.log"
    else
        echo "✗ Failed to start Mission Control"
        echo "  Check log: /tmp/mission-control.log"
        rm -f "$PID_FILE"
    fi
}

stop() {
    if ! check_running; then
        echo "✓ Mission Control is not running"
        return
    fi
    
    PID=$(cat "$PID_FILE")
    echo "🛑 Stopping Mission Control (PID: $PID)..."
    kill "$PID" 2>/dev/null
    
    # Wait for process to terminate
    for i in {1..5}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done
    
    rm -f "$PID_FILE"
    
    if ps -p "$PID" > /dev/null 2>&1; then
        echo "✗ Failed to stop cleanly, force killing..."
        kill -9 "$PID" 2>/dev/null
    fi
    
    echo "✓ Mission Control stopped"
}

status() {
    if check_running; then
        PID=$(cat "$PID_FILE")
        echo "✓ Mission Control is running"
        echo "  PID: $PID"
        echo "  URL: http://localhost:8080"
        echo "  Uptime: $(ps -o etime= -p $PID 2>/dev/null || echo 'unknown')"
    else
        echo "✗ Mission Control is not running"
    fi
}

restart() {
    stop
    sleep 1
    start
}

# Main
case "${1:-start}" in
    start)   start ;;
    stop)    stop ;;
    restart) restart ;;
    status)  status ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
