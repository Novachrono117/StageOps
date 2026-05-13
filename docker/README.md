# Docker

O arquivo principal fica na raiz como `docker-compose.yml`.

Comandos uteis:

```bash
docker compose up --build
docker compose exec backend alembic upgrade head
docker compose exec backend alembic revision --autogenerate -m "descricao"
```
