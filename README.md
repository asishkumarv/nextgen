# NextGen Power Care

A full-stack electricity service management platform with a mobile client app, web admin panel, and REST API backend.

## 📁 Project Structure

```
Nextgen app/
├── nextgen/        # React Native / Expo mobile client app
├── admin/          # React (Vite) web admin dashboard
└── backend/        # Node.js / Express REST API + PostgreSQL
```

## 🚀 Getting Started

### Backend
```bash
cd backend
npm install
npm run dev
```

### Admin Panel
```bash
cd admin
npm install
npm run dev
```

### Mobile App (Expo)
```bash
cd nextgen
npm install
npx expo start
```

## ⚙️ Environment Variables

Copy `.env.example` to `.env` in the `backend/` folder and fill in your credentials:
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — Secret key for JWT tokens
- `PORT` — Server port (default: 5000)
