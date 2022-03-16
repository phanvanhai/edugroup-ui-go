ARG BASE=golang:1.15-alpine
FROM ${BASE} AS builder

ARG MAKE="make cmd/edugroup-ui-server/edugroup-ui-server"
ARG ALPINE_PKG_BASE="make git"
ARG ALPINE_PKG_EXTRA=""

LABEL Name=edugroup-ui-go

LABEL license='SPDX-License-Identifier: Apache-2.0' \
  copyright='Copyright (c) 2018-2020: Intel'


RUN sed -e 's/dl-cdn[.]alpinelinux.org/nl.alpinelinux.org/g' -i~ /etc/apk/repositories

RUN apk update && apk add --no-cache ${ALPINE_PKG_BASE} ${ALPINE_PKG_EXTRA}

ENV GO111MODULE=on
WORKDIR /go/src/github.com/phanvanhai/edugroup-ui-go


COPY go.mod .
COPY Makefile .

RUN make update

COPY . .
RUN ${MAKE}

FROM alpine

EXPOSE 4000

COPY --from=builder /go/src/github.com/phanvanhai/edugroup-ui-go/cmd/edugroup-ui-server /go/src/github.com/phanvanhai/edugroup-ui-go/cmd/edugroup-ui-server

WORKDIR /go/src/github.com/phanvanhai/edugroup-ui-go/cmd/edugroup-ui-server

ENTRYPOINT ["./edugroup-ui-server","-conf=res/docker/configuration.toml"]
