FROM node:8

RUN mkdir /src

WORKDIR /src
ADD . /src
RUN yarn install && yarn run build

EXPOSE 3000

WORKDIR /src

CMD yarn start
