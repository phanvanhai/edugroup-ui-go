#!/bin/bash
#
# Copyright (c) 2018
# Tencent
#
# SPDX-License-Identifier: Apache-2.0
#

DIR=$PWD
CMD=../cmd/edugroup-ui-server

# Kill all edugroup-ui-go* stuff
function cleanup {
	pkill edugroup-ui-server
}

cd $CMD
exec -a edugroup-ui-server ./edugroup-ui-server &
cd $DIR

trap cleanup EXIT

while : ; do sleep 1 ; done
