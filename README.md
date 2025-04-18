# WhatsApp Web Mesaj İzleme ve İletme Sistemi (NestJS)

Bu proje, WhatsApp Web üzerinden gelen mesajları Puppeteer kullanarak otomatik olarak izler, PostgreSQL veritabanına kaydeder ve Telegram'a iletir.

## 🚀 Özellikler

### WhatsApp Web Entegrasyonu

- Puppeteer ile otomatik tarayıcı kontrolü
- WhatsApp Web üzerinden mesajların gerçek zamanlı takibi
- QR kod tarama sonrası otomatik mesaj izleme

### Veritabanı İşlemleri

- PostgreSQL veritabanı entegrasyonu
- TypeORM ile ORM desteği
- Mesaj içeriği, gönderen ve zaman bilgilerinin saklanması

### Telegram Entegrasyonu

- Telegram Bot API kullanarak mesaj iletimi
- Dinamik bot token ve chat ID yapılandırması
- Çoklu kanal/grup desteği

### Web Arayüzü

- Next.js tabanlı modern kullanıcı arayüzü
- Gerçek zamanlı mesaj listesi
- Gelişmiş arama özellikleri
- Sistem ayarları yönetim paneli

## 🛠️ Teknolojiler

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

## ⚙️ Kurulum

### Gereksinimler

- Node.js 18 veya üzeri
- PostgreSQL 14 veya üzeri
- Redis 6 veya üzeri
- Docker (opsiyonel)

### Backend Kurulumu

1. Projeyi klonlayın:

   ```bash
   git clone https://github.com/kullaniciadi/proje-adi.git
   cd proje-adi
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. PostgreSQL veritabanını oluşturun:

   ```bash
   createdb whatsapp_messages
   ```

4. `.env` dosyasını oluşturun:

   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost:5432/whatsapp_messages

   # Redis
   REDIS_URL=redis://localhost:6379

   # Telegram
   TELEGRAM_BOT_TOKEN=your_bot_token
   TELEGRAM_CHAT_ID=your_chat_id

   # JWT
   JWT_SECRET=your_jwt_secret

   # Server
   PORT=3000
   NODE_ENV=development
   ```

5. Veritabanı migration'larını çalıştırın:

   ```bash
   npm run migration:run
   ```

6. Uygulamayı başlatın:

   ```bash
   # Development
   npm run start:dev

   # Production
   npm run build
   npm run start:prod
   ```

### Frontend Kurulumu

1. Frontend klasörüne gidin:

   ```bash
   cd frontend
   ```

2. Bağımlılıkları yükleyin:

   ```bash
   npm install
   ```

3. `.env.local` dosyasını oluşturun:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000
   NEXT_PUBLIC_WS_URL=ws://localhost:3000
   ```

4. Geliştirme sunucusunu başlatın:
   ```bash
   npm run dev
   ```

## 📝 Kullanım

1. `http://localhost:3000` adresinden web arayüzüne erişin
2. WhatsApp Web QR kodunu telefonunuzdan tarayın
3. Sistem otomatik olarak mesajları izlemeye başlayacak
4. Ayarlar sayfasından Telegram bot token ve chat ID'leri yapılandırın

## 🔍 API Endpoints

### Mesaj İşlemleri

- `GET /api/messages`: Tüm mesajları listeler
- `GET /api/messages/:id`: ID'ye göre mesaj detayı
- `GET /api/messages/search`: Mesaj içeriğinde arama yapar

### Ayar İşlemleri

- `GET /api/settings`: Tüm ayarları listeler
- `GET /api/settings/:key`: Belirli bir ayarı getirir
- `POST /api/settings/:key`: Ayar değerini günceller

## 📦 Proje Yapısı

```
src/
├── main/
│   ├── config/           # Yapılandırma dosyaları
│   ├── controllers/      # API endpoint'leri
│   ├── services/         # İş mantığı
│   ├── entities/         # Veritabanı modelleri
│   ├── migrations/       # Veritabanı migration'ları
│   ├── dto/             # Data Transfer Objects
│   ├── interfaces/      # TypeScript interfaces
│   └── utils/           # Yardımcı fonksiyonlar
├── test/                # Test dosyaları
└── main.ts             # Ana uygulama dosyası
```

## ⚠️ Önemli Notlar

- WhatsApp Web'in açık kalması gerekir
- Telegram ayarlarının doğru yapılandırılması önemlidir
- Sistem 10 saniyede bir yeni mesajları kontrol eder
- Link dönüştürme özelliği için referans parametresi ayarlanmalıdır

## 🤝 Katkıda Bulunma

1. Bu depoyu fork edin
2. Yeni bir branch oluşturun (`git checkout -b feature/yeniOzellik`)
3. Değişikliklerinizi commit edin (`git commit -am 'Yeni özellik eklendi'`)
4. Branch'inizi push edin (`git push origin feature/yeniOzellik`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakınız.
