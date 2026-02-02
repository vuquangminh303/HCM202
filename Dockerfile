# Build stage - match your local Node (22)
FROM node:22-alpine AS builder
WORKDIR /app

# Copy package manifest + lockfile (IMPORTANT)
COPY package.json package-lock.json ./

# Reproducible install
RUN npm ci --legacy-peer-deps

# Copy source
COPY . .

# Build (CRA outputs /build)
RUN npm run build


# Production stage
FROM nginx:alpine

# (optional) for healthcheck using wget
RUN apk add --no-cache wget

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Nginx config (React Router)
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]