from psycopg2 import pool
from dotenv import load_dotenv
import os

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(_ROOT, ".env"))

_pool = pool.SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=os.getenv("DB_HOST", "localhost"),
    port=int(os.getenv("DB_PORT", "5433")),
    database=os.getenv("DB_NAME", "myapp"),
    user=os.getenv("DB_USER", "admin"),
    password=os.getenv("DB_PASSWORD", "123456"),
)


def get_conn():
    return _pool.getconn()


def put_conn(conn):
    _pool.putconn(conn)
