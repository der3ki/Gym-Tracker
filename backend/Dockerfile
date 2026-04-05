FROM node:20-slim AS build
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
# Use PostgreSQL schema for production
RUN cp prisma/schema.postgresql.prisma prisma/schema.prisma
RUN npx prisma generate && npx tsc

FROM node:20-slim
RUN apt-get update -y && apt-get install -y openssl
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/prisma ./prisma
EXPOSE 3001
CMD ["npm", "start"]
