FROM node:20-slim

WORKDIR /app

# 安装编译工具（better-sqlite3 需要）
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# 复制依赖文件并安装（删除旧 lock 文件确保安装最新版本）
COPY package.json package-lock.json* ./
RUN rm -f package-lock.json && npm install

# 复制项目代码并构建
COPY . .
RUN npm run build

# 创建所需目录
RUN mkdir -p /app/data /app/public/uploads

# 设置生产环境
ENV NODE_ENV=production

EXPOSE 3000
CMD ["node", "dist/boot.js"]
