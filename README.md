# 🎮 Project Nexus - Full Stack Real-Time Communication Platform

A feature-rich Discord-like communication platform built with modern web technologies, featuring real-time messaging, voice channels, server management, and a comprehensive admin panel.

![Project Nexus](https://img.shields.io/badge/Status-Production%20Ready-success)
![Next.js](https://img.shields.io/badge/Next.js-14-black)
![NestJS](https://img.shields.io/badge/NestJS-10-red)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (ADMIN, MODERATOR, GUEST)
- Protected routes and API endpoints
- Socket.IO authentication

### 🖥️ Server Management
- Create, edit, and delete servers
- Server settings and customization
- Invite system with unique codes
- Member management with roles

### 📺 Channel Management
- Multiple channel types (TEXT, AUDIO, VIDEO)
- Create, edit, and delete channels
- Channel permissions based on roles
- Channel navigation and organization

### 💬 Real-Time Messaging
- Real-time messaging with Socket.IO
- Message history with infinite scroll
- Cursor-based pagination
- File uploads (images, PDFs) via UploadThing
- Message editing and deletion
- Emoji picker integration
- Typing indicators
- Auto-scroll behavior

### 👥 Member Management
- View all server members
- Assign roles (ADMIN, MODERATOR, GUEST)
- Kick members
- Role-based permissions

### 🎨 User Experience
- Dark mode support
- Responsive design
- Modern UI with Shadcn components
- Loading states and error handling
- Confirmation dialogs
- User presence (online/offline)

### 🛡️ Admin Panel
- Statistics dashboard
- User management (ban/unban, make admin)
- Server management
- Activity monitoring
- Recent messages view

## 🛠️ Tech Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **State Management:** Zustand
- **Forms:** React Hook Form + Zod
- **Real-time:** Socket.IO Client
- **Data Fetching:** React Query (TanStack Query)
- **File Uploads:** UploadThing
- **Icons:** Lucide React
- **Date Formatting:** date-fns

### Backend
- **Framework:** NestJS
- **Language:** TypeScript
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** JWT (Passport)
- **Real-time:** Socket.IO
- **Validation:** class-validator, class-transformer

### DevOps
- **Monorepo:** Turborepo
- **Package Manager:** npm
- **Database Container:** Docker Compose

## 📁 Project Structure

```
project-nexus/
├── apps/
│   ├── api/              # NestJS Backend
│   │   ├── src/
│   │   │   ├── admin/    # Admin panel endpoints
│   │   │   ├── auth/     # Authentication
│   │   │   ├── channels/ # Channel management
│   │   │   ├── members/  # Member management
│   │   │   ├── messages/ # Message handling
│   │   │   ├── servers/  # Server management
│   │   │   ├── socket/   # Socket.IO gateway
│   │   │   └── prisma/   # Database service
│   │   └── prisma/
│   │       └── schema.prisma
│   │
│   └── web/              # Next.js Frontend
│       ├── app/          # App router pages
│       ├── components/   # React components
│       │   ├── chat/     # Chat components
│       │   ├── modals/   # Modal dialogs
│       │   ├── providers/# Context providers
│       │   ├── server/   # Server components
│       │   └── ui/       # Shadcn UI components
│       └── hooks/        # Custom React hooks
│
├── packages/             # Shared packages
├── docker-compose.yml    # PostgreSQL container
└── turbo.json           # Turborepo config
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Docker & Docker Compose
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wampexx-hub/project-nexus.git
   cd project-nexus
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```

4. **Setup Backend**
   ```bash
   cd apps/api
   
   # Create .env file
   echo "DATABASE_URL=postgresql://postgres:postgres@localhost:5432/discord_db" > .env
   echo "JWT_SECRET=your_super_secret_jwt_key_here" >> .env
   
   # Run migrations
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Setup Frontend**
   ```bash
   cd apps/web
   
   # Create .env.local file
   echo "NEXT_PUBLIC_SITE_URL=http://localhost:3000" > .env.local
   
   # Optional: Setup UploadThing for file uploads
   # See UPLOADTHING_SETUP.md for details
   ```

6. **Start Development Servers**
   ```bash
   # From root directory
   npm run dev
   ```

   - Frontend: http://localhost:3000
   - Backend: http://localhost:3001
   - Prisma Studio: `npx prisma studio` (in apps/api)

### Create First Admin User

After registering your first user, make them an admin:

```bash
cd apps/api
npx prisma studio
```

Or via SQL:
```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@example.com';
```

Then access admin panel at: http://localhost:3000/admin

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Servers
- `GET /api/servers` - Get user's servers
- `POST /api/servers` - Create server
- `PATCH /api/servers/:id` - Update server
- `DELETE /api/servers/:id` - Delete server
- `POST /api/servers/join/:inviteCode` - Join server via invite
- `PATCH /api/servers/:id/invite-code` - Regenerate invite code

### Channels
- `POST /api/channels` - Create channel
- `PATCH /api/channels/:id` - Update channel
- `DELETE /api/channels/:id` - Delete channel

### Messages
- `GET /api/messages` - Get messages (with pagination)
- `PATCH /api/messages/:id` - Edit message
- `DELETE /api/messages/:id` - Delete message

### Members
- `PATCH /api/servers/:serverId/members/:memberId` - Update member role
- `DELETE /api/servers/:serverId/members/:memberId` - Kick member

### Admin (Requires Admin Role)
- `GET /api/admin/statistics` - Get platform statistics
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users/:id/ban` - Ban user
- `POST /api/admin/users/:id/unban` - Unban user
- `POST /api/admin/users/:id/make-admin` - Make user admin
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/servers` - Get all servers
- `DELETE /api/admin/servers/:id` - Delete server

## 🔌 Socket.IO Events

### Client → Server
- `join-channel` - Join a channel room
- `send-message` - Send a message
- `typing` - Emit typing indicator
- `join-server` - Join server for presence

### Server → Client
- `new-message` - Receive new message
- `typing:{channelId}` - Receive typing indicator
- `presence:{serverId}` - Receive online users list

## 🎨 UI Components

Built with Shadcn UI:
- Button, Input, Dialog, Dropdown Menu
- Form, Select, Scroll Area
- Card, Table, Popover
- And more...

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/discord_db
JWT_SECRET=your_super_secret_jwt_key_here
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
UPLOADTHING_SECRET=your_uploadthing_secret
UPLOADTHING_APP_ID=your_uploadthing_app_id
```

## 🧪 Testing

```bash
# Run tests
npm run test

# Run tests in watch mode
npm run test:watch
```

## 📦 Build for Production

```bash
# Build all apps
npm run build

# Start production server
npm run start
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/)
- [NestJS](https://nestjs.com/)
- [Prisma](https://www.prisma.io/)
- [Shadcn UI](https://ui.shadcn.com/)
- [Socket.IO](https://socket.io/)
- [UploadThing](https://uploadthing.com/)

## 📞 Support

For support, email support@example.com or join our Discord server.

## 🗺️ Roadmap

- [x] Basic authentication
- [x] Server management
- [x] Channel management
- [x] Real-time messaging
- [x] File uploads
- [x] Message editing/deletion
- [x] Member management
- [x] Emoji picker
- [x] Typing indicators
- [x] User presence
- [x] Admin panel
- [ ] Voice & Video (WebRTC)
- [ ] Direct messages
- [ ] Message reactions
- [ ] Search functionality
- [ ] Notifications
- [ ] Mobile app (React Native)

---

Made with ❤️ by [wampexx-hub](https://github.com/wampexx-hub)
