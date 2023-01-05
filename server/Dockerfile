FROM node:16-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=base /app/dist ./dist
COPY migrations ./migrations
ENV NODE_ENV=production
CMD [ "npm", "start" ]
