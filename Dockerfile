FROM node:8

RUN mkdir /src

WORKDIR /src
ADD . /src
RUN yarn install && cd ./frontend && yarn install --force && yarn build

EXPOSE 3000

WORKDIR /src

CMD yarn start
