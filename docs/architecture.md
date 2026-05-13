# Arquitetura

O backend segue uma divisão limpa e modular:

- `api`: rotas HTTP, autenticação e dependências FastAPI
- `models`: entidades SQLAlchemy e enums de domínio
- `schemas`: contratos Pydantic de entrada e saída
- `services`: operações de aplicação, como CRUD e autenticação de usuários
- `db`: sessão, base declarativa e metadados
- `core`: configuração e segurança

O frontend já nasce como app operacional:

- `app`: rotas do Next.js App Router
- `components/ui`: componentes base no padrão shadcn/ui
- `components/layout`: shell, navegação lateral e estrutura responsiva
- `lib`: cliente de API, lista de módulos e utilitários

Separações futuras recomendadas:

- adicionar casos de uso específicos em `backend/app/services`
- criar repositórios dedicados quando as consultas saírem do CRUD simples
- especializar páginas frontend por módulo conforme cada fluxo ganhar regras próprias
