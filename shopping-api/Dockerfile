FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Install only production dependencies.
RUN npm install --only=production

COPY src ./src

EXPOSE 5000

CMD ["npm", "start"]