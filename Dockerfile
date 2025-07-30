# Sử dụng Node.js 18 Alpine image
FROM node:18-alpine

# Tạo thư mục làm việc
WORKDIR /app

# Copy package.json và yarn.lock
COPY package.json yarn.lock ./

# Cài đặt dependencies
RUN yarn install --frozen-lockfile --production=false

# Copy source code
COPY . .

# Tạo thư mục uploads nếu chưa có
RUN mkdir -p uploads

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start command
CMD ["yarn", "start"] 