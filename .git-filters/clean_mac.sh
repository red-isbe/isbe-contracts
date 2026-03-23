#!/bin/bash
while IFS= read -r f; do
    [ -d "$f" ] && echo "$f" && continue
    [[ "$f" != ._* ]] && echo "$f" && continue
    rm -f "$f" 2>/dev/null
    git rm --cached -q "$f" 2>/dev/null
done
