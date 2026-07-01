FROM node:20-alpine

WORKDIR /app

# 安装编译依赖（better-sqlite3 需要）
RUN apk add --no-cache python3 make g++

# 复制依赖文件
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目代码
COPY . .

# 构建前端 + 后端
RUN npm run build

# 创建数据目录和上传目录
RUN mkdir -p /app/data /app/public/uploads

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/boot.js"]
