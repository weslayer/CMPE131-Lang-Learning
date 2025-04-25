FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

# Install dependencies with better error handling and retry logic
RUN npm cache clean --force && \
    npm config set registry https://registry.npmjs.org/ && \
    npm config set fetch-retries 5 && \
    npm config set fetch-retry-mintimeout 20000 && \
    npm config set fetch-retry-maxtimeout 120000 && \
    npm config set network-timeout 300000 && \
    npm install --legacy-peer-deps || \
    (npm cache clean --force && npm install --legacy-peer-deps --no-package-lock)

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"] 