#!/bin/bash

# Wait for the service to be up and running
echo "Waiting 10 seconds until mongo container is up and running.."
sleep 10
cd backend/data-populator/ && node populate_database.js
cd ../ && node server.js
