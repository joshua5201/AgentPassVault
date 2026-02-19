#!/bin/bash
set -a
source .env
set +a
SPRING_PROFILES_ACTIVE=dev ./gradlew bootRun
