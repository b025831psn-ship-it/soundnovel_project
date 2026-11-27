#!/bin/bash
# print function at addr until first jr $ra (+1) with max lines
a=$1; m=${2:-120}
n=$(grep -n "^ $a:" eboot.asm | cut -d: -f1)
sed -n "$n,$((n+m))p" eboot.asm | awk '{print} /jr\t\$ra/{c=1;next} c==1{exit}' | cut -c2-70 | sed 's/:      \t/ /'
