FROM node:latest as builder

COPY /front ./front
WORKDIR /front
RUN npm install
RUN npm run build

CMD ["npm","start"]