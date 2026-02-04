FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install --unsafe-perm --ignore-scripts
RUN cd apps/api && npx prisma generate
RUN npx turbo run build --filter=api

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3001
CMD cd apps/api && npx prisma migrate deploy && npm run start:prod
