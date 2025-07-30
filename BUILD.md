# Build Instructions

## 🚀 Development

### Cài đặt dependencies

```bash
yarn install
```

### Chạy development server

```bash
yarn dev
```

### Chạy production server

```bash
yarn start
```

## 📦 Build Production

### Build dự án

```bash
yarn build
```

### Chạy production build

```bash
yarn prod
```

### Build và chạy production

```bash
yarn build:prod
```

## 🐳 Docker

### Build Docker image

```bash
yarn docker:build
```

### Chạy Docker container

```bash
yarn docker:run
```

### Chạy với Docker Compose

```bash
docker-compose up -d
```

## 🧪 Testing

### Chạy tests

```bash
yarn test
```

### Chạy tests với coverage

```bash
yarn test:coverage
```

### Chạy tests watch mode

```bash
yarn test:watch
```

## 🔍 Linting

### Kiểm tra code style

```bash
yarn lint
```

### Tự động fix code style

```bash
yarn lint:fix
```

## 🛠 Setup

### Setup database và admin

```bash
yarn setup
```

### Tạo admin account

```bash
yarn create-admin
```

### Kiểm tra database tables

```bash
yarn check-tables
```

## 📁 Build Output

Sau khi build, thư mục `dist/` sẽ chứa:

- `src/` - Source code đã build
- `package.json` - Package configuration
- `yarn.lock` - Lock file

## 🌍 Environment Variables

Tạo file `.env` với các biến môi trường:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vilaw_db
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d

# Twilio Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Server Configuration
PORT=4000
NODE_ENV=development
```

## 📊 Available Scripts

| Script              | Description                         |
| ------------------- | ----------------------------------- |
| `yarn start`        | Chạy production server              |
| `yarn dev`          | Chạy development server với nodemon |
| `yarn build`        | Build dự án cho production          |
| `yarn prod`         | Chạy production build               |
| `yarn test`         | Chạy tests                          |
| `yarn lint`         | Kiểm tra code style                 |
| `yarn setup`        | Setup database và admin             |
| `yarn docker:build` | Build Docker image                  |
| `yarn docker:run`   | Chạy Docker container               |
