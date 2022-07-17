FROM node:16

WORKDIR /smtp-server

COPY smtp-server/package.* /smtp-server/

RUN npm install
RUN npm install --location=global Haraka

COPY smtp-server /smtp-server/

VOLUME /smtp-server/config
EXPOSE 25

ENTRYPOINT ["haraka", "-c", "/smtp-server"]
