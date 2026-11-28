#!/bin/sh
# The disc's STR movies as video files for the browser (src/movie.js): <NAME>.mp4 next to the PACs.
#   tools/convert-str.sh "/path/to/Kamaitachi (Japan).bin" out-dir
# Each STR file is cut from the BIN as raw 2352-byte sectors (LBA and size from the disc's root
# directory) and converted by ffmpeg (psxstr: MDEC picture, XA sound) to H.264 + AAC, 320x240 at 15 fps.
set -e
BIN=$1; OUT=$2; mkdir -p "$OUT"
for spec in SN2_OP:38360:12840 SN1_PRO:51200:19520 SN2_PRO:90416:7152 SN3_PRO:70720:19696; do
  name=${spec%%:*}; rest=${spec#*:}; lba=${rest%%:*}; n=${rest#*:}
  dd if="$BIN" of="$OUT/$name.str" bs=2352 skip="$lba" count="$n" status=none
  ffmpeg -y -hide_banner -loglevel error -i "$OUT/$name.str" -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p \
    -c:a aac -b:a 160k -ar 44100 -movflags +faststart "$OUT/$name.mp4"
  rm "$OUT/$name.str"
done
