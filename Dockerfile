FROM node:13-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
CMD [ "node", "./out/index.js" ]