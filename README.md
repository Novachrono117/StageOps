# StageOps

Micro SaaS operacional para empresas de eventos, som, iluminação, LED, palco, estrutura e locação técnica.

## Stack

- Frontend: Next.js, TypeScript, Tailwind CSS e componentes no padrão shadcn/ui
- Backend: FastAPI, Python, SQLAlchemy, Alembic e JWT Auth
- Banco: PostgreSQL
- Infra local: Docker Compose

## Estrutura

```text
backend/
  app/
    api/
    core/
    db/
    models/
    schemas/
    services/
  alembic/
frontend/
  src/app/
  src/components/
  src/lib/
docker/
docker-compose.yml
```

## Módulos iniciais

- Empresas
- Usuários e funcionários
- Galpões e localizações internas
- Categorias, modelos e unidades físicas de equipamentos
- Eventos
- Checklist de saída e retorno
- Manutenção
- Locais de eventos
- Observações operacionais dos locais
- Requisitos de EPI dos locais
- Praticáveis, palcos e escadas compatíveis

## Como rodar com Docker

```bash
docker compose up --build
```

Serviços:

- Frontend: http://localhost:3000
- Backend: http://localhost:8000
- Swagger: http://localhost:8000/docs
- PostgreSQL: localhost:5432

O container do backend executa `alembic upgrade head` e um seed idempotente antes de iniciar a API.

Usuário demo:

- Email: `admin@stageops.local`
- Senha: `stageops123`

## Rodar localmente sem Docker

Backend:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Autenticação

A API já expõe:

- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`

Os endpoints CRUD exigem token Bearer. O seed cria a empresa demo, um usuário administrador e os três tamanhos iniciais de placas de praticável.

## Praticáveis e palcos

O domínio inicial contempla:

- placas de tamanhos variados, como 2m x 1m, 1m x 1m e 2m x 0.5m
- quantidade disponível
- pés por placa, com default 4
- pés por altura
- escadas compatíveis
- cálculo de área por placa
- cálculo de área total disponível
- cálculo de pés necessários

Também há o endpoint `POST /api/v1/stage-calculations` para cálculo rápido.

## Próximos passos naturais

- seed inicial com empresa e usuário administrador
- telas CRUD reais por módulo
- permissões por perfil
- vínculos detalhados entre eventos, equipamentos e checklist
- testes automatizados de API
- multiempresa com escopo obrigatório por `company_id`
