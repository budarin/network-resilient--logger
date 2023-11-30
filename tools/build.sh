#!/bin/sh

set -e

export "NODE_ENV"="production";

rm -rf dist;
tsc;
