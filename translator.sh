#!/bin/bash

# get current uncommitted changes
changes=$(git status --porcelain)

# filter out untracked files in /_post/ and end with .md
changes=$(echo "$changes" | awk '/_posts\/zh\-tw/ {print $2}')

echo $changes