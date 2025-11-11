FROM node:18-slim

WORKDIR /app

# Install OpenSSL (required by Prisma)
RUN apt-get update -y && apt-get install -y openssl

COPY server/package*.json ./

RUN npm install

COPY server/ ./

RUN npm run prisma:generate

RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]