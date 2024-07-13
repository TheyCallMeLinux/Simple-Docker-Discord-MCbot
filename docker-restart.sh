#!/bin/bash
NAME=$1
CONTAINER_ID=$(docker ps -q --filter name=$NAME)

if [ -z "$CONTAINER_ID" ]; then
    echo "Container $NAME is not running."
    echo "Starting..."
    docker start $1
    sleep 1
    echo $(date) "docker contaciner status: Not running > Running"
    sleep 1
    echo $(date) "Allow some time for the server to restart fully"
    sleep 20
    echo $(date) "Just a few more seconds..."
    sleep 10
    echo $(date) "Server loading..."
    sleep 1
    echo $(date) "Server started!"
    sleep 1
    exit 1
fi
echo $(date) "Informing players through RCON in the game"
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 30 seconds!"
echo $(date) " rcon-cli : The server will be restarting in 30 seconds!"
sleep 10s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 20 seconds!"
echo $(date) " rcon-cli : The server will be restarting in 20 seconds!"
sleep 10s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 10 seconds!"
echo $(date) " rcon-cli : The server will be restarting in 10 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 9 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 8 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 7 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 6 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 5 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 4 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 3 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 2 seconds!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server will be restarting in 1 second!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli say "The server is restarting! Brace yourselves!"
echo $(date) " rcon-cli : The server is restarting! Brace yourselves!"
sleep 1s
docker exec $CONTAINER_ID rcon-cli stop; docker stop $CONTAINER_ID
echo $(date) "Executing : rcon-cli stop; docker stop"
sleep 1s
docker rm $CONTAINER_ID
sleep 1s
docker compose up -d
sleep 1s
echo $(date) "Server restarting, please be patient"
sleep 20s
echo $(date) "Nearly there"
sleep 15s
echo $(date) "Just a few more seconds..."
sleep 15s
echo $(date)" Restart completed!"
sleep 1s
