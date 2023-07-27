FROM --platform=linux/amd64 node:18-alpine

COPY . /root

WORKDIR /root

RUN npm install

EXPOSE 3000

CMD [ "npm", "start" ]
