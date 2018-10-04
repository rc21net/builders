@echo off
pushd "%~dp0"
cd ..\
node lib/Spriter/index.js %*
popd
