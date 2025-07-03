#!/bin/bash
# Cinema Equipment Management System - Production Start Script
cd react-app
npm install --production
NODE_ENV=production PORT=${PORT:-5000} HOST=0.0.0.0 node server/server.js