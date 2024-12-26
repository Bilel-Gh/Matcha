# ✨ Matcha - A Modern Dating Web Application

![Matcha Banner](path_to_your_banner_image)

## Overview

Matcha is a sophisticated dating web application that connects people based on their interests, location, and preferences. Using advanced matching algorithms and real-time features, it provides a seamless and engaging experience for users looking for meaningful connections.

## ✨ Key Features

- **Smart Matching Algorithm**: Connects users based on common interests, location, and compatibility scores
- **Real-time Chat**: Instant messaging with connected users
- **Geolocation Services**: Location-based matching and user discovery
- **Advanced Search & Filters**: Find matches based on specific criteria
- **Real-time Notifications**: Stay updated with likes, visits, and messages
- **Interactive Profiles**: Rich user profiles with multiple photos and detailed information

## 🛠 Tech Stack

### Backend
- Node.js with Express
- TypeScript for type safety
- PostgreSQL for reliable data storage
- Socket.IO for real-time features

### Frontend
- React with TypeScript
- Redux for state management
- Tailwind CSS for modern styling
- Socket.IO client for real-time updates

### Testing
- Jest for unit and integration testing
- Playwright for end-to-end testing
- React Testing Library for component testing

## 📋 Prerequisites

- Node.js (v18 or later)
- PostgreSQL (v14 or later)
- npm or yarn

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/matcha.git
   cd matcha
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd backend
   npm install

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Backend configuration
   cp .env.example .env
   # Edit .env with your credentials
   ```

4. **Database Setup**
   ```bash
   # Run database migrations
   cd backend
   npm run migrate
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend server
   cd frontend
   npm run dev
   ```

## 🧪 Testing

This project implements comprehensive testing at multiple levels:

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run E2E tests
npm run test:e2e
```

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication
- XSS protection
- CSRF protection
- Input sanitization
- Rate limiting
- Secure file upload handling

---
Made with ❤️ by Bilel Ghandri (bghandri)