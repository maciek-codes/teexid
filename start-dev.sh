#!/bin/bash

# Start the frontend vite in watch mode


# Start the backend server in watch mode
DIR=$(pwd)

echo "Starting the backend server in watch mode"
cd $DIR/server
pnpm run start &

echo "Starting the frontend vite in watch mode"
cd $DIR/app 
pnpm run dev &

cd $DIR

wait $(jobs -p)


