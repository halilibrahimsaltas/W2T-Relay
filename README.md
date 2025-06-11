# WhatsApp Web Message Monitoring and Forwarding System (NestJS)

This project automatically monitors messages from WhatsApp Web using Puppeteer, saves them to a PostgreSQL database, and forwards them to Telegram.

## 🚀 Features

### WhatsApp Web Integration

- Automated browser control with Puppeteer
- Real-time message tracking via WhatsApp Web
- Automatic message monitoring after QR code scan
- Automatic link conversion and tracking system
- Multi-store support (Trendyol, Hepsiburada, Amazon, N11, etc.)

### Database Operations

- PostgreSQL database integration
- TypeORM ORM support
- Storage of message content, sender, and timestamp
- Automatic product information retrieval and storage

### Telegram Integration

- Message forwarding using Telegram Bot API
- Dynamic bot token and chat ID configuration
- Multi-channel/group support
- Customizable message templates

### Web Interface

- Modern user interface based on Next.js
- Real-time message list
- Advanced search features
- System settings management panel
- Responsive design

## 🛠️ Technologies

### Backend

- Node.js 18+
- NestJS
- TypeScript
- Puppeteer
- PostgreSQL
- TypeORM
- Telegram Bot API
- Redis
- Bull Queue
- Docker
- AWS
- Jest

### Frontend

- Next.js 14
- TypeScript
- Tailwind CSS
- React Query
- Zustand
- Socket.io Client
- Jest & React Testing Library

## ⚙️ Installation

### Requirements

- Node.js 18 or higher
- PostgreSQL 14 or higher
- Redis 6 or higher
- Docker (optional)
- Chrome/Chromium (for Puppeteer)

### Backend Installation

1. Clone the project:

   ```bash
   git clone https://github.com/username/project-name.git
   cd project-name
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create PostgreSQL database:

   ```bash
   createdb whatsapp_messages
   ```

4. Create `.env` file:

   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/whatsapp_messages
   POSTGRES_HOST=localhost
   POSTGRES_PORT=5432
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=w2t_relay
   POSTGRES_SYNCHRONIZE=true

   # Redis
   REDIS_URL=redis://localhost:6379

   # Telegram Bot
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id

   # Security
   JWT_SECRET=your_jwt_secret

   # Server
   PORT=3000
   NODE_ENV=development


   ```

5. Run database migrations:

   ```bash
   npm run migration:run
   ```

6. Start the application:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

### Frontend Installation

1. Navigate to frontend directory:

   ```bash
   cd frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=ws://localhost:3000
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

## 📝 Usage

1. Access web interface at `http://localhost:3000`
2. Scan WhatsApp Web QR code with your phone
3. System will automatically start monitoring messages
4. Configure Telegram bot token and chat IDs from settings page
5. Configure link conversion settings

## 🔍 API Endpoints

### Message Operations

- `GET /api/messages`: List all messages
- `GET /api/messages/:id`: Get message details by ID
- `GET /api/messages/search`: Search in message content
- `POST /api/messages/convert-link`: Convert link

### Settings Operations

- `GET /api/settings`: List all settings
- `GET /api/settings/:key`: Get specific setting
- `POST /api/settings/:key`: Update setting value

## 📦 Project Structure

```
src/
├── main/
│   ├── config/           # Configuration files
│   ├── controllers/      # API endpoints
│   ├── services/         # Business logic
│   ├── entities/         # Database models
│   ├── migrations/       # Database migrations
│   ├── dto/             # Data Transfer Objects
│   ├── interfaces/      # TypeScript interfaces
│   └── utils/           # Helper functions
├── test/                # Test files
└── main.ts             # Main application file
```

## ⚠️ Important Notes

- WhatsApp Web must remain open
- Telegram settings must be configured correctly
- System checks for new messages every 10 seconds
- Link conversion feature requires reference parameter setup
- Supported stores:
  - Amazon
  - Trendyol
  - Hepsiburada
  - N11
  - MediaMarkt
  - Boyner
  - Karaca
  - Gratis

## 🤝 Contributing

1. Fork this repository
2. Create your feature branch (`git checkout -b feature/newFeature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/newFeature`)
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
