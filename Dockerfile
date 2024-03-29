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
COPY --from=0 /prebuild-app/tail-ui ./tail-ui

ENV NODE_ENV='production'
ENV BIND_ADDRESS='::'
ENV BIND_PORT='8080'
ENV SHOW_CURL='1'
ENV HEALTH_ENDPOINT='/health'
ENV ENABLE_CORS='0'
ENV LOG_RETENTION_SIZE='0'
ENV ENABLE_TAIL_UI='0'
ENV TAIL_UI_ENDPOINT='/~/tail'
ENV TAIL_UI_USER=''
ENV TAIL_UI_PASSWORD=''
ENV ENABLE_WSAPI='0'
ENV WSAPI_USER=''
ENV WSAPI_PASSWORD=''
ENV WEBSOCKET_API_ENDPOINT='/~/ws'

EXPOSE 8080
CMD node index.js
