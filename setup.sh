#!/bin/bash
set -e

echo "=== ZK Airdrop - Setup ==="

# Backend
echo ""
echo "[1/4] Installing backend dependencies..."
cd backend
npm install
echo "[2/4] Running Prisma migrations..."
npx prisma migrate dev
npx prisma generate
cd ..

# Frontend
echo ""
echo "[3/4] Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Contracts
echo ""
echo "[4/4] Installing contract dependencies..."
cd contracts
forge install semaphore-protocol/semaphore
forge install OpenZeppelin/openzeppelin-contracts
forge build
cd ..

echo ""
echo "=== Setup complete! ==="
echo ""
echo "To run the project:"
echo "  Terminal 1:  cd backend  && npm run dev"
echo "  Terminal 2:  cd frontend && npm run dev"
echo ""
echo "Don't forget to configure backend/.env with your GitHub OAuth credentials."
