#!/bin/bash
NAME=$1
CONTAINER_ID=$(docker ps -q --filter name=$NAME)

if [ -z "$CONTAINER_ID" ]; then
    echo "Container $NAME is not running."
    echo "Starting..."
    docker start $1
    exit 1
fi

sleep 1s;
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 30 seconds!"
sleep 10s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 20 seconds!"
sleep 10s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 10 seconds!"
sleep 10s
docker exec $CONTAINER_ID rcon-cli say "The server is restarting! Brace yourselves!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli stop; docker stop $CONTAINER_ID
sleep 1s
docker rm $CONTAINER_ID
sleep 1s
docker compose up -d
sleep 15s
echo $(date) "server restarting, please be patient"
sleep 15s
echo $(date) "Nearly there"
sleep 10s
echo $(date) "I swear Im almost there..."
sleep 5s
echo $(date)" Restart completed!"
sleep 1s
