# PHYGITAL — Local Setup Guide

## Prerequisites
- Node.js 20+ and npm 10+
- (Optional for cloud mode) Supabase CLI and a Google Gemini API key

## Quick Start (Development Sandbox Mode)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy environment template:
   ```bash
   cp .env.example .env
   ```
   With `VITE_DEV_SANDBOX_MODE=true` (default when Supabase env vars are blank), the app runs locally with transparent Development Sandbox labels, real camera/microphone browser APIs, real timestamp-based Offline Sun-Battery timers, and simulated AI/48-hour purge execution.
3. Run tests and start dev server:
   ```bash
   npm test
   npm run dev
   ```
