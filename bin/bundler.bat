@echo off
pushd "%~dp0"
cd ..\
node lib/Bundler/index.js %*
popd