@echo off
start cmd /K | echo "adb kill-server && adb devices"
