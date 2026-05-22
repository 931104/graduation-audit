//啟動
docker compose up -d

//進去下sql
docker exec -it my-postgres psql -U admin -d myapp

// 若有修改schema
停止並刪除舊容器和 volume（清空資料）
sudo docker compose -f /home/ckt1022/graduation-audit/database/docker-compose.yml down -v

重新啟動（會用新 schema 初始化）
sudo docker compose -f /home/ckt1022/graduation-audit/database/docker-compose.yml up -d
