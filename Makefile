#
# Copyright (c) 2018 Tencent
#
# SPDX-License-Identifier: Apache-2.0
#

.PHONY: build clean test run docker docker-push

GO=CGO_ENABLED=0 GO111MODULE=on go
GOCGO=CGO_ENABLED=1 GO111MODULE=on go

MICROSERVICES=cmd/edugroup-ui-server/edugroup-ui-server
.PHONY: $(MICROSERVICES)

DOCKERS=docker_edugroup_ui_go
.PHONY: $(DOCKERS)

VERSION=$(shell cat ./VERSION 2>/dev/null || echo 0.0.0)

GOFLAGS=-ldflags "-X github.com/phanvanhai/edugroup-ui-go.Version=$(VERSION)"

GIT_SHA=$(shell git rev-parse HEAD)

build: $(MICROSERVICES)
	$(GO) build ./...

cmd/edugroup-ui-server/edugroup-ui-server:
	$(GO) build $(GOFLAGS) -o $@ ./cmd/edugroup-ui-server

clean:
	rm -f $(MICROSERVICES)

test:
	GO111MODULE=on go test -coverprofile=coverage.out ./...
	GO111MODULE=on go vet ./...

prepare:

update:
	$(GO) mod download

run:
	cd bin && ./edugroup-ui-go-launch.sh

docker: $(DOCKERS)

docker_edugroup_ui_go:
	docker build --label "git_sha=$(GIT_SHA)" -t phanvanhai/edugroup-ui-go:$(VERSION) .

docker-push:
	docker push \
	phanvanhai/edugroup-ui-go:$(VERSION)