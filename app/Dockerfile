FROM node:16-alpine

WORKDIR /app

ENV PATH /app/node_modules/.bin:$PATH
ENV CHOKIDAR_USEPOLLING true

EXPOSE 3000

COPY package.json ./
COPY package-lock.json ./
RUN npm install --silent && \
    npm install react-scripts -g --silent

# add app
COPY . ./

CMD ["npm", "start"]