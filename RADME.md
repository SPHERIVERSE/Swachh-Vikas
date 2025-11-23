# 📘 Swachh-Vikas -- An Integrated Digital Waste Management Ecosystem

[![License](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Tech
Stack](https://img.shields.io/badge/Tech-Next.js%20%7C%20NestJS%20%7C%20Prisma-007ACC)](https://github.com/your-org/swachh-vikas)

A modern, gamified, incentive-driven, and role-based platform that
unifies citizens, waste workers, businesses, and administrators to
enable transparent, efficient, and sustainable waste management across
urban local bodies (ULBs).

Swachh-Vikas streamlines civic participation, ensures accountability,
and transforms waste-to-wealth through digital tools, **CleanCoin**
incentives, and **CSR/EPR** integrations.

## 🚀 Table of Contents

-   [Overview](#overview)
-   [System Highlights](#system-highlights)
-   [Key Features](#key-features)
-   [Architecture](#architecture)
-   [Tech Stack](#tech-stack)
-   [Installation Guide](#installation-guide)
-   [Running the Project Locally](#running-the-project-locally)
-   [API Endpoints (High-Level)](#api-endpoints-overview)
-   [Contributing](#contributing)

------------------------------------------------------------------------

## 🌿 Overview

Swachh-Vikas is built to solve the critical gap in India's urban waste
lifecycle:

-   Lack of civic participation\
-   Missing transparency in waste collection\
-   Limited citizen incentives\
-   Undefined digital training for civic duties\
-   Inefficient complaint resolution\
-   Untracked CSR/EPR contributions

The platform uses gamification, digital training, real-time reporting,
workforce monitoring, and digital wallets to create a single unified
ecosystem.

## ✨ System Highlights

✔ **Mandatory Civic Training**\
✔ **CleanCoin Rewards**\
✔ **Transparent Waste Tracking**\
✔ **Worker Task Management**\
✔ **Business CSR/EPR Integration**\
✔ **Admin Command Center**

## 🧩 Key Features

### 🧍 Citizen Features

-   Civic training\
-   CleanCoin rewards\
-   Complaint filing & tracking\
-   Voucher redemption\
-   Leaderboards

### 🛠 Worker Features

-   Task management\
-   Progress updates\
-   Training & performance score

### 🏢 Business Features

-   CSR fund uploads\
-   Voucher creation\
-   Impact dashboard

### 🏛 Admin (ULB) Features

-   User management\
-   Training module management\
-   Voucher approvals\
-   Task assignment\
-   Analytics & dashboards

## 🏗 Architecture

Monorepo structure:

    swachh-vikas/
    ├── swachh-vikas-backend   (NestJS + Prisma)
    │   ├── Modules
    │   ├── Guards
    │   └── Controllers
    └── swachh-vikas-frontend  (Next.js + Tailwind)

Communication: REST API\
Auth: JWT\
Database: PostgreSQL\
ORM: Prisma

## 🔐 RBAC (Role-Based Access Control)

  Role       Access
  ---------- -----------------------------------------
  CITIZEN    Reports, training, CleanCoins, vouchers
  WORKER     Tasks, training, status updates
  BUSINESS   CSR funding, vouchers
  ADMIN      Full access

## 🗂 Backend Modules

-   Auth\
-   Users\
-   Training\
-   CleanCoin\
-   CSR/EPR\
-   Reports\
-   Workers

## 🗄 Database Models (High-Level)

User, TrainingCourse, CleanCoinWallet, Voucher, CsrFund, Report,
WorkerTask, etc.

## 🛠 Installation & Setup

### Prerequisites

Node.js 18+, PostgreSQL, npm/yarn

### Backend Setup

``` bash
cd swachh-vikas-backend
npm install
cp .env.example .env
npx prisma migrate dev --name init
npm run start:dev
```

### Frontend Setup

``` bash
cd swachh-vikas-frontend
npm install
cp .env.example .env.local
npm run dev
```

## 🌐 Running Locally

  Service         URL
  --------------- -----------------------
  Backend API     http://localhost:3000
  Frontend App    http://localhost:3001
  Prisma Studio   http://localhost:5555

## 🌍 API Endpoints (Overview)

-   `POST /auth/login`\
-   `POST /auth/register`\
-   `POST /reports`\
-   `GET /courses`\
-   `GET /cleancoin/balance`\
-   `POST /cleancoin/vouchers/:id/claim`\
-   `POST /csr/funds`

## 🤝 Contributing

1.  Fork → Create branch → Commit → PR\
2.  Follow ESLint rules\
3.  Use feature-based foldering\
4.  Write meaningful commits

## 🧾 Conclusion

Swachh-Vikas is a full digital ecosystem enabling transparent,
sustainable, and incentive-driven waste management for cities.
