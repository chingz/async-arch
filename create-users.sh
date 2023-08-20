curl --location 'http://localhost:8010/users' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "username=admin" \
    --data-urlencode "password=admin" \
    --data-urlencode "email=admin@UberPopug.com" \
    --data-urlencode "role=admin"

curl --location 'http://localhost:8010/users' \
    --header 'Content-Type: application/x-www-form-urlencoded' \
    --data-urlencode "username=manager" \
    --data-urlencode "password=manager" \
    --data-urlencode "email=manager@UberPopug.com" \
    --data-urlencode "role=manager"

usernames=(
    "user_1"
    "user_2"
    "user_3"
    "user_4"
    "user_5"
)

for username in "${usernames[@]}"; do
    curl --location 'http://localhost:8010/users' \
        --header 'Content-Type: application/x-www-form-urlencoded' \
        --data-urlencode "username=$username" \
        --data-urlencode "password=$username" \
        --data-urlencode "email=$username@UberPopug.com" \
        --data-urlencode "role=popug"
done
