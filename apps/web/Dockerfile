FROM node:20 AS builder
WORKDIR /app
COPY . .
RUN npm install --unsafe-perm --ignore-scripts
RUN npx turbo run build --filter=web

FROM node:20-slim
WORKDIR /app
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "run", "start", "--workspace=apps/web"]
