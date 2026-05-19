//啟動
docker compose up -d

//進去下sql
docker exec -it my-postgres psql -U admin -d myapp
