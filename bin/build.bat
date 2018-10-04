@echo off
pushd "%~dp0"
cd ..\
node lib/Spriter/index.js %*
node lib/Bundler/index.js %*
popd