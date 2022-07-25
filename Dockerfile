FROM node:lts-alpine
LABEL builder=true
WORKDIR /prebuild-app

COPY . .

VOLUME /root/.npm

RUN npm run bootstrap-docker

FROM node:lts-alpine
WORKDIR /app

COPY --from=0 /prebuild-app/dist .
COPY --from=0 /prebuild-app/node_modules ./node_modules

ENV NODE_ENV='production'
ENV BIND_ADDRESS='::'
ENV BIND_PORT='8080'

EXPOSE 8080
CMD node index.js
