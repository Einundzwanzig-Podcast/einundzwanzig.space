#!/bin/bash

dir=$(dirname "$0")
log="$dir/check-feed.log"
file="$dir/.check-feed"
prev=$(cat $file)
feed=$(curl -s https://anchor.fm/s/d8d3c38/podcast/rss)
date=$(echo "$feed" | awk 'BEGIN { FS="<|>"; RS="\n" }; { if ($0 ~ /lastBuildDate/) print $3}')

if [[ ! -z "$date" ]]; then
  echo "Latest build: $prev"
  echo "Last updated: $date"

  if [[ "$date" != "$prev" ]]; then
    if [[ ! -z "$GH_PAT" ]]; then
      echo "-> Triggering new build"
      curl -X POST https://api.github.com/repos/Einundzwanzig-Podcast/einundzwanzig.space/dispatches \
        -H "Authorization: token $GH_PAT" \
        -H "Accept: application/vnd.github.everest-preview+json" \
        -H "Content-Type: application/json" \
        --data '{"event_type": "anchor_update"}'

      echo $date >> $log
    else
      echo "Missing GH_PAT environment variable!"
    fi
  fi

  echo $date > $file
fi
