#!/bin/bash
rsync -a --exclude 'node_modules' . root@charts.pymnts.com:/home/instant-charts/
