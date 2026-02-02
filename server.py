#!/usr/bin/env python3
"""
Mission Control - Simple HTTP Server
Serves the Kanban dashboard and API for task management
"""

import http.server
import socketserver
import json
import os
from pathlib import Path
from urllib.parse import urlparse, parse_qs

PORT = 8080
WORKSPACE_DIR = Path("/root/workspace")
DATA_DIR = WORKSPACE_DIR / "data"

def load_tasks():
    """Load tasks from JSON file"""
    tasks_file = DATA_DIR / "tasks.json"
    if tasks_file.exists():
        with open(tasks_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    return {"tasks": [], "columns": []}

def save_tasks(data):
    """Save tasks to JSON file"""
    tasks_file = DATA_DIR / "tasks.json"
    with open(tasks_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

class MissionControlHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(WORKSPACE_DIR), **kwargs)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        
        # API endpoint for tasks
        if parsed_path.path == '/api/tasks':
            self.send_json_response(load_tasks())
            return
        
        # Serve index.html for root path
        if self.path == '/':
            self.path = '/index.html'
        
        # Default file serving
        return super().do_GET()
    
    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/tasks':
            content_length = int(self.headers.get('Content-Length', 0))
            post_data = self.rfile.read(content_length)
            
            try:
                tasks_data = json.loads(post_data.decode('utf-8'))
                save_tasks(tasks_data)
                self.send_json_response({"status": "success", "message": "Tasks saved"})
            except json.JSONDecodeError as e:
                self.send_json_response({"status": "error", "message": str(e)}, 400)
            return
        
        self.send_error(404)
    
    def send_json_response(self, data, status_code=200):
        """Send JSON response"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"[Mission Control] {self.address_string()} - {format % args}")

def run_server(port=PORT):
    """Run the Mission Control server"""
    with socketserver.TCPServer(("", port), MissionControlHandler) as httpd:
        print(f"🎛️  Mission Control server running at http://localhost:{port}")
        print(f"📁 Workspace: {WORKSPACE_DIR}")
        print("Press Ctrl+C to stop")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Mission Control server stopped")

if __name__ == "__main__":
    import sys
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    run_server(port)
