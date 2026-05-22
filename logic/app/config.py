# 讀取.env，並進行DB的連線
from psycopg2 import pool
from dotenv import load_dotenv
import os

load_dotenv()

_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "5432")),
    database=os.getenv("DB_NAME", "myapp"),
    user=os.getenv("DB_USER", "admin"),
    password=os.getenv("DB_PASSWORD", "admin"),
)


def get_conn():
    return _pool.getconn()


def put_conn(conn):
    _pool.putconn(conn)
