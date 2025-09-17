#!/usr/bin/env python
"""
Run Django server with daphne for ASGI support
"""
import os
import sys
import subprocess

if __name__ == '__main__':
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'webpush.settings')
    
    # Run with daphne for ASGI support
    subprocess.run(['daphne', '-b', '0.0.0.0', '-p', '8000', 'webpush.asgi:application'])
