# Inventário técnico do TaskNote

Este levantamento registra o que foi usado e produzido no MVP para apoiar manutenção, auditoria e decisões futuras. A validação foi executada em 18/09/2026, no Windows, com Python 3.12.14.

## 1. Fonte e escopo

- Documento-base: `SDD_TaskNote_Gerenciador_de_Tarefas_e_Anotacoes.md`, versão 1.0.
- Entrega: aplicação full-stack com API REST e frontend React, expandindo o MVP do SDD.
- Fora desta entrega: colaboração, notificações, anexos, aplicação móvel, calendário externo e IA.
- Repositório-alvo: `DanielRobertoRibeiro/TaskNote`.

## 2. Dependências diretas

| Pacote | Faixa declarada | Versão validada | Finalidade |
| --- | --- | --- | --- |
| Python | `>=3.12` | `3.12.14` | Runtime |
| FastAPI | `>=0.115,<1.0` | `0.141.1` | Framework HTTP/OpenAPI |
| Uvicorn | `>=0.34,<1.0` | `0.53.0` | Servidor ASGI |
| SQLAlchemy | `>=2.0,<3.0` | `2.0.54` | ORM e consultas |
| Alembic | `>=1.15,<2.0` | `1.20.0` | Migrações |
| psycopg | `>=3.2,<4.0` | `3.3.5` | Driver PostgreSQL |
| pydantic-settings | `>=2.8,<3.0` | `2.15.0` | Configuração por ambiente |
| PyJWT | `>=2.10,<3.0` | `2.14.0` | Emissão e validação JWT |
| pwdlib | `>=0.2,<1.0` | `0.3.1` | API de hash de senha |
| argon2-cffi | extra de `pwdlib` | `25.1.0` | Implementação Argon2 |
| email-validator | `>=2.2,<3.0` | `2.3.0` | Validação de e-mail |

## 3. Dependências de desenvolvimento

| Pacote | Faixa declarada | Versão validada | Finalidade |
| --- | --- | --- | --- |
| pytest | `>=8.3,<10.0` | `9.1.1` | Execução dos testes |
| pytest-cov | `>=6.0,<8.0` | `7.1.0` | Integração de cobertura |
| HTTPX 2 | `>=2.0,<3.0` | `2.13.0` | Cliente usado pelo TestClient |
| Ruff | `>=0.11,<1.0` | `0.16.8` | Lint e formatação |
| coverage.py | transitiva | `7.16.1` | Medição de cobertura |

### Frontend

| Pacote | Versão validada | Finalidade |
| --- | --- | --- |
| Node.js | `24.19.0` | Runtime de build |
| pnpm | `11.19.0` | Instalação reprodutível |
| React | `19.3.0` | Camada de interface |
| React DOM | `19.3.0` | Renderização no navegador |
| Lucide React | `1.46.0` | Iconografia |
| TypeScript | `7.0.2` | Tipagem estática |
| Vite | `8.3.0` | Servidor de desenvolvimento e build |
| plugin React para Vite | `6.1.1` | Transformação React |
| Vitest | `5.0.1` | Testes unitários do frontend |

## 4. Infraestrutura e ferramentas

| Item | Escolha | Observação |
| --- | --- | --- |
| Banco de produção | PostgreSQL 17 Alpine | Imagem `postgres:17-alpine` |
| Banco de testes | SQLite em memória | Isolado, descartável e com chaves estrangeiras ativas |
| Containers | Dockerfiles + Compose | React/Nginx, API e banco com health checks |
| Migração na inicialização | Alembic | Executada pelo entrypoint |
| CI | GitHub Actions | Backend e frontend validados separadamente |
| CD | GitHub Pages Actions | Build Vite e publicação do artefato estático |
| Frontend estático | GitHub Pages | Demonstração pública sem backend obrigatório |
| Documentação interativa | Swagger UI e ReDoc | Geradas pelo OpenAPI |
| Exemplos manuais | Postman Collection v2.1 | Variáveis e scripts de captura de IDs |
| Controle de versão | Git | Branch principal `main` |
| Licença | MIT | Uso, estudo e evolução permitidos |

Docker não estava instalado na máquina de validação. Por isso, o Compose e o Dockerfile foram revisados estaticamente, enquanto a lógica foi executada pela suíte em SQLite e a migração foi validada em modo SQL offline para o dialeto PostgreSQL.

## 5. Padrões e decisões

- Arquitetura em camadas: rotas → serviços → repositórios → banco.
- Injeção de dependência para sessão, configurações e usuário atual.
- Modelos SQLAlchemy 2 com mapeamento tipado.
- Schemas Pydantic distintos para criação, edição e resposta.
- UUID para todas as entidades públicas.
- UTC para conclusão e timestamps; prazo exige timezone.
- Enumerações persistidas com valores do domínio em português.
- Relações muitos-para-muitos para tags.
- Nome normalizado NFKC + `casefold` para unicidade de tag.
- `ON DELETE SET NULL` entre tarefas e anotações.
- `ON DELETE CASCADE` para dados do usuário e tabelas associativas.
- Paginação por `offset/limit`, adequada ao volume esperado do MVP.
- Busca com `ILIKE`; busca textual nativa do PostgreSQL fica como evolução.
- React organizado em componentes, views, utilitários e adaptadores de dados.
- Um único contrato `TaskNoteService` atende à API real e ao modo demonstração.
- O modo demonstração usa `localStorage`, IDs UUID e dados relativos à data atual.
- O build do Pages usa base `/TaskNote/`; o build Nginx usa base `/`.
- Layout responsivo com navegação lateral no desktop e inferior em telas menores.

## 6. Controles de segurança

- Hash Argon2 recomendado pela biblioteca `pwdlib`.
- JWT HS256 com `sub`, `iat`, `exp` e tipo do token.
- Chave e credenciais exclusivamente via configuração externa.
- Bloqueio do segredo padrão em ambientes não locais.
- HTTP Bearer com `401` e `WWW-Authenticate` adequados.
- Toda consulta de recurso inclui o proprietário autenticado.
- Retorno `404` para evitar enumeração de IDs de terceiros.
- Tags e tarefas de terceiros não podem ser vinculadas.
- Entradas têm tipos, tamanhos e formatos validados.
- SQL parametrizado pelo ORM.
- Erros internos não devolvem stack trace nem detalhes do banco.
- Detalhes de validação omitem o valor recebido, evitando refletir senhas.
- Logs registram IDs de requisição, não corpos, senhas ou tokens.
- Container executa com usuário sem privilégios.
- O frontend não contém segredos; `VITE_API_URL` é configuração pública de build.
- O modo API valida erros do backend e não renderiza HTML recebido.
- Formulários usam limites equivalentes aos contratos da API.

Controles recomendados antes de internet pública: TLS no proxy, rate limiting, política de rotação, refresh/revogação de tokens, monitoramento, backups testados, secret manager, SAST e atualização automatizada de dependências.

## 7. Banco e índices

Tabelas: `users`, `tasks`, `notes`, `tags`, `task_tags` e `note_tags`.

Restrições principais:

- e-mail único globalmente;
- tag única por `(user_id, normalized_name)`;
- chaves compostas nas tabelas associativas;
- vínculo opcional de `notes.task_id`;
- exclusões em cascata apenas onde o registro dependente não deve sobreviver.

Índices principais:

- proprietário de tarefas, notas e tags;
- status, prioridade e prazo de tarefas;
- índice composto `(user_id, status, due_at)`;
- vínculo de nota por tarefa;
- índice de unicidade fornecido pelas constraints de e-mail e tag.

## 8. Superfície HTTP

- 2 endpoints de autenticação.
- 6 endpoints de tarefas.
- 5 endpoints de anotações.
- 3 endpoints de tags.
- 1 endpoint de saúde.
- 1 rota raiz informativa fora do schema.

Total documentado no OpenAPI: 17 operações de domínio/saúde.

## 9. Arquivos produzidos

| Grupo | Conteúdo |
| --- | --- |
| Configuração | `.env.example`, `pyproject.toml`, requirements, package/lockfile e ignores |
| Backend | módulos de API, core, banco, repositórios, schemas e serviços |
| Frontend | React, TypeScript, CSS responsivo, adaptadores API/demo e testes |
| Banco | `alembic.ini`, ambiente Alembic e migração inicial |
| Containers | Dockerfiles, Nginx, entrypoint e `docker-compose.yml` |
| Qualidade | testes, cobertura/Ruff, TypeScript/Vite e workflow de CI |
| Publicação | workflow dedicado do GitHub Pages |
| Consumo | coleção Postman |
| Documentação | README, inventário técnico e licença |

## 10. Evidências de validação

| Verificação | Resultado |
| --- | --- |
| `pytest --cov=app --cov-report=term-missing` | 17 aprovados; 93,70% |
| `ruff check .` | aprovado |
| `ruff format --check .` | aprovado |
| `alembic upgrade head --sql` | SQL PostgreSQL gerado sem erro |
| `git diff --check` | sem whitespace inválido |
| OpenAPI | título, rotas e schema exercitados por teste |
| `pnpm test` | 2 testes unitários aprovados |
| `pnpm build` | TypeScript e bundle Vite aprovados |
| build com `VITE_BASE_PATH=/TaskNote/` | assets gerados com caminho correto |
| inspeção visual no navegador | acesso, dashboard, modal, tarefas, notas e tags aprovados |
| GitHub Actions — CI | backend e frontend aprovados no commit `e69c2aa` |
| GitHub Actions — Pages | build e deploy aprovados na tentativa 2 |
| URL pública | HTTP 200 e modo demonstração exercitado no GitHub Pages |

Coberturas funcionais exercitadas: cadastro, login, hash, erro uniforme, token ausente/inválido, isolamento entre usuários, CRUD de tarefa, status, reabertura, filtros combinados, busca, paginação, prazo com timezone, tag estrangeira, vínculo/desvínculo de nota, preservação após exclusão da tarefa, unicidade de tag, exclusão de associação, tarefa estrangeira e health check.

## 11. Limitações conhecidas e escolhas conscientes

- Tokens de acesso não têm refresh ou lista de revogação no MVP.
- Não há rate limiter embutido; normalmente pertence ao gateway/proxy.
- Paginação por offset pode migrar para cursor em volumes muito altos.
- A busca usa correspondência parcial, sem ranking linguístico.
- O health check não mede serviços externos além do banco.
- PostgreSQL em container não foi iniciado no host de validação por ausência local do Docker.
- O GitHub Pages hospeda somente o frontend; a API e o PostgreSQL ainda precisam de um provedor próprio para operação real pública.
- Sem `VITE_API_URL`, a publicação pública funciona em modo demonstração com dados locais.
- No modo API, o JWT é mantido no armazenamento do navegador; uma implantação de maior risco deve avaliar cookies `HttpOnly`, CSP e mitigação reforçada de XSS.
- A inspeção visual foi feita nos breakpoints disponíveis do navegador automatizado; o CSS contempla desktop, tablet e celular.

## 12. Rastreabilidade com o SDD

Todos os requisitos funcionais RF-01 a RF-12 e os não funcionais RNF-01 a RNF-07 foram contemplados. O frontend, previsto como evolução futura no SDD, também foi implementado. Colaboração, notificações, anexos, mobile, calendário e IA permanecem fora do MVP. A coleção Postman, a CI e o deploy no GitHub Pages completam a etapa de portfólio.

## 13. Estado consolidado em 18/09/2026

| Dimensão | Estado |
| --- | --- |
| Backend FastAPI | concluído e coberto por testes |
| Banco e migrações | concluídos; PostgreSQL definido para produção |
| Autenticação e autorização | concluídas |
| Frontend React | concluído e integrado |
| Modo demonstração | concluído e persistente no navegador |
| Responsividade | validada e ajustada após inspeção visual |
| Docker Compose | configurado para web, API e banco; não executado neste host |
| CI | backend e frontend aprovados no GitHub Actions |
| GitHub Pages | publicado e validado em `https://danielrobertoribeiro.github.io/TaskNote/` |
| Backend público | não contratado/não implantado; fora do GitHub Pages |
