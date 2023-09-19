# Stage 1: Build the Angular app
FROM node:14 AS build

# WORKDIR /app

# COPY package.json package-lock.json ./
# RUN npm ci

# COPY . .
# RUN npm run build --prod

# # Stage 2: Setup NGINX server and HTTP Basic Auth
FROM nginx:stable-alpine

# Setup HTTP Basic Auth
ARG USERNAME
ARG PASSWORD

RUN apk add --no-cache apache2-utils
RUN  htpasswd -bc /etc/nginx/.htpasswd $USERNAME $PASSWORD

# Copy built Angular app from build stage
# COPY --from=build /app/dist/ethos-fe /usr/share/nginx/html
COPY ./dist/ethos-fe /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]