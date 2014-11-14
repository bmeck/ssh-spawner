#!/usr/bin/env sh

vagrant up

export HOST="$(vagrant ssh-config | grep HostName | awk '{printf $2}')"
export HOST_USER="$(vagrant ssh-config | grep \ User\ | awk '{printf $2}')"
export IDENTITY="$(vagrant ssh-config | grep IdentityFile | awk '{printf $2}')"
export PORT="$(vagrant ssh-config | grep Port | awk '{printf $2}')"
export EXPECTED="$(vagrant ssh -- id)"
tape tests/**
