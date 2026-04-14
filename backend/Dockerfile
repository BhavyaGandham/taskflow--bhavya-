FROM node:18-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .

FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache bash
COPY --from=build /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
CMD ["sh", "-c", "npm run migrate && npm run seed && npm start"]
