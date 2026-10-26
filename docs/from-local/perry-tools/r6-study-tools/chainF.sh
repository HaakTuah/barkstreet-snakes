#!/bin/bash
S=$(cd "$(dirname "$0")" && pwd)
$S/ahead.sh flex Pfull Pfull2 PfullL Ws > $S/runs/ahead-checks-final.txt 2>&1
$S/run.sh 600 3 base Pfull Pfull2 PfullL Ws > $S/runs/confirm-s3.log 2>&1
$S/run.sh 600 11 base Pfull Pfull2 PfullL Ws > $S/runs/confirm-s11.log 2>&1
$S/run.sh 300 3 LdigPace > $S/runs/extra.log 2>&1
