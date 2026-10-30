#!/bin/bash
# usage: build_audio.sh <stems_dir> <out_dir>  → mix.wav (voce+muzică+efecte) și voce.wav (doar voce procesată)
set -e
ST=$1; OUT=$2; mkdir -p $OUT
ffmpeg -v error -y -i $ST/voice.wav -i $ST/music.wav -i $ST/sfx.wav -filter_complex "
[0:a]highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=4,asplit=2[v][vsc];
[1:a]volume=-9dB[m0];
[m0][vsc]sidechaincompress=threshold=0.02:ratio=7:attack=15:release=300[m];
[2:a]volume=-8dB[x];
[v][m][x]amix=inputs=3:normalize=0,alimiter=limit=0.95[mix];
[mix]loudnorm=I=-14:TP=-1.5:LRA=9[out]" -map "[out]" -ar 44100 -ac 2 $OUT/mix.wav
ffmpeg -v error -y -i $ST/voice.wav -af "highpass=f=80,acompressor=threshold=-22dB:ratio=3:attack=5:release=90:makeup=4,loudnorm=I=-14:TP=-1.5:LRA=9" -ar 44100 -ac 2 $OUT/voce.wav
