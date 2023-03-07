#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
echo "switch directory"
cd "$DIR"
pm2 start --restart-delay 10000 npm -- start