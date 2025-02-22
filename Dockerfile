FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --only=production
RUN npm run build

COPY . .

EXPOSE 3000

CMD ["node", "dist/index.js"]
