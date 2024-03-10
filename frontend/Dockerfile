FROM node:latest as builder

COPY /front ./front
WORKDIR /front
RUN npm install

CMD ["npm","start"]