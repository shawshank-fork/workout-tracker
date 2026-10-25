FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .

RUN npx prisma generate --schema=./prisma/schema.prisma

EXPOSE 5000

CMD ["node", "server.js"] 
