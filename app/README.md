# StageOps App

Aplicativo React + Vite + TypeScript do StageOps. A landing page da raiz (`index.html`) continua independente para GitHub Pages.

## Rodar localmente

```bash
cd app
npm install
cp .env.example .env
npm run dev
```

Abra `http://localhost:5173`.

## Variáveis de ambiente

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Use apenas a chave pública `anon` no frontend. Chaves de serviço ou segredos não devem entrar no Vite, no Git ou no navegador.

## Arquitetura

```txt
src/
  components/
    layout/
    ui/
  pages/
  services/
  types/
  utils/
  App.tsx
  main.tsx
  index.css
```

## Segurança e LGPD

- Supabase Auth será usado para autenticação, sem armazenamento manual de senhas.
- O app coleta apenas dados necessários para a finalidade operacional.
- O módulo de Clientes usa campos mínimos: nome, tipo, telefone, e-mail opcional e observações operacionais.
- Não coletar CPF, RG, data de nascimento, endereço residencial, dados bancários, cartão ou dados sensíveis.
- Não usar `console.log` com dados pessoais, tokens, cookies ou chaves.
- Erros exibidos ao usuário devem ser genéricos.
- A futura tabela `security_audit_logs` deve ter retenção limitada e acesso apenas por administradores da organização.
- A estrutura SQL inicial para RLS está em `supabase/schema.sql`.

## Clientes

O módulo de Clientes está em `src/pages/ClientsPage.tsx` e usa
`src/services/clientService.ts` para persistência temporária em `localStorage`.

Funcionalidades atuais:

- cadastro de cliente pessoa física ou empresa;
- edição de dados mínimos;
- busca por nome, telefone ou e-mail;
- filtro por tipo e status;
- inativação e reativação;
- exclusão local com confirmação;
- cards de total, ativos, empresas, pessoas físicas e inativos.

Preparação LGPD:

- clientes possuem `organizationId` para isolamento futuro por empresa;
- o status `inactive` prepara fluxos futuros de retenção, anonimização e exclusão;
- observações devem conter apenas informações operacionais necessárias;
- erros não exibem detalhes técnicos nem dados pessoais desnecessários.

## Eventos

O módulo de Eventos está em `src/pages/EventsPage.tsx` e usa
`src/services/eventService.ts` para persistência temporária em `localStorage`.

Funcionalidades atuais:

- cadastro e edição de eventos operacionais;
- vínculo obrigatório com cliente;
- período do evento com data inicial e final;
- categoria e subcategoria do evento;
- múltiplos eventos podem ocorrer no mesmo dia;
- dia da semana calculado automaticamente em pt-BR a partir da data inicial;
- agenda diária com horários individuais por dia;
- hora extra prevista por dia, com motivo e custo estimado opcional;
- datas opcionais de montagem e desmontagem;
- status: rascunho, confirmado, em preparação, em andamento, concluído e cancelado;
- dados operacionais de local, cidade/UF e acesso;
- campos separados para observações do local, carga/descarga e segurança/EPI;
- estimativa simples de combustível por distância, consumo e preço por litro;
- custos estimados por etapa: montagem, evento diário e desmontagem;
- custo total do período do evento multiplicando o custo diário pela duração;
- visitas técnicas com responsável, data, local, custos e reserva de manutenção/desgaste do veículo;
- equipamentos vinculados ao evento;
- alerta visual quando equipamentos selecionados conflitam com outro evento no período;
- alocação de funcionários CLT e freelancers;
- alocação operacional por etapa, período completo, horário específico ou sobreaviso;
- alerta visual de conflito de equipe apenas quando há sobreposição real de data/horário;
- empresas parceiras com responsabilidades, itens fornecidos, permissões e custo estimado;
- controle inicial de visibilidade para funcionários, freelancers e empresas parceiras;
- veículos utilizados no evento, com finalidade, motorista, distância e custos;
- reserva de manutenção/desgaste do veículo nos custos de visita técnica e veículos;
- identificação local de equipamentos por texto, sem API externa e sem adicionar automaticamente;
- busca por nome do evento, cliente ou cidade;
- filtro por status e categoria;
- filtros por período: próximos, em andamento, passados, este mês, próximo mês e mês específico;
- filtro por mês e ano com suporte a eventos que atravessam mais de um mês;
- visualização em cards de evento com resumo operacional compacto;
- validação que impede eventos ativos, rascunhos, negociações ou confirmados com data final já passada;
- exclusão local com confirmação.

Privacidade no módulo de Eventos:

- não coletar CPF, RG, documentos pessoais, dados bancários ou dados sensíveis;
- observações de local devem ser estritamente operacionais;
- eventos possuem `organizationId` para isolamento futuro por empresa com Supabase e RLS;
- erros exibidos ao usuário não devem incluir stack trace nem dados pessoais desnecessários.

As informações de local ficam vinculadas ao evento no MVP. Futuramente, poderão
evoluir para um cadastro reutilizável de locais.

Eventos na mesma data não são bloqueados. Conflitos devem ser tratados por
recurso específico. Equipamentos e equipe geram alerta visual, mas o alerta não
impede salvar, porque a decisão operacional ainda pode depender de sublocação,
troca de item, ajuste de escala ou validação manual.

Custos de freelancers, custos de empresas parceiras, custos diários, combustível,
alimentação, mão de obra, margem, lucro e demais informações financeiras internas
devem ser visíveis apenas para administradores. Funcionários, freelancers e
empresas parceiras não devem visualizar custos internos por padrão.

A categoria do evento prepara checklist, precificação, relatórios e análise
operacional futura. A subcategoria é livre no MVP para não travar o cadastro.

O leitor "Identificar equipamentos pelo texto" usa apenas comparação local com
equipamentos cadastrados, normalizando acentos, caixa e pontuação. O usuário deve
confirmar as sugestões antes de adicioná-las ao evento.

A listagem de eventos usa cards agrupados por mês, evitando tabelas largas. Cada
card mostra apenas resumo: cliente, local, período, agenda, operação, equipe,
parceiros, visitas, veículos, equipamentos, custo operacional, visibilidade e
alertas.

Veículos possuem tipo de combustível: diesel, gasolina, etanol, flex, elétrico
ou outro. Para diesel, gasolina, etanol e flex, o custo é recalculado
automaticamente no formulário quando distância, consumo médio ou preço do
combustível mudam:

```txt
fuelCost = estimatedDistanceKm / averageConsumption * fuelPricePerUnit
```

Para veículos elétricos ou tipo "outro", o custo de combustível pode ser
informado manualmente enquanto uma regra de kWh ou outro critério não existir.
O custo total do veículo considera combustível, reserva de manutenção/desgaste,
pedágio e outros custos.

Eventos com data final anterior ao dia atual só devem ser registrados como
histórico, usando status concluído (`completed`) ou cancelado (`canceled`).
Status como rascunho, em negociação, confirmado, em preparação ou em andamento
não aceitam evento já encerrado. Um evento em andamento precisa estar dentro do
período atual do evento.

## Controle de estoque próprio

O módulo de Equipamentos representa o estoque próprio permanente da empresa.
Cada cadastro guarda:

- quantidade total própria;
- quantidade reservada/locada;
- quantidade em manutenção;
- quantidade indisponível;
- quantidade disponível calculada automaticamente.

A disponibilidade segue a regra:

```txt
availableQuantity = totalQuantity - reservedQuantity - maintenanceQuantity - unavailableQuantity
```

As regras de integridade ficam centralizadas em `src/services/equipmentService.ts`
e `src/utils/equipmentInventory.ts`, evitando duplicação nos componentes. Nenhuma
quantidade pode ficar negativa, e a soma de reservado, manutenção e indisponível
não pode superar a quantidade total própria.

Equipamentos podem ser cadastrados com quantidade total `0`, permitindo mapear
itens planejados para aquisição futura.

## Sublocação futura

A sublocação não aumenta artificialmente a quantidade total própria. Equipamentos
sublocados são recursos externos temporários e devem ser vinculados futuramente a
Eventos/Reservas.

Uma reserva futura poderá ser composta por:

- quantidade própria reservada;
- quantidade sublocada;
- fornecedor externo;
- período de uso associado ao evento.

Tipos planejados para essa evolução estão em `src/types/subrental.ts`:

- `Supplier`;
- `SubrentedEquipment`;
- `EventEquipmentRequirement`.

A futura Rede de Parceiros/Sublocação deve ser opt-in. Cada empresa precisa
aderir voluntariamente e controlar explicitamente quais informações poderá
compartilhar com fornecedores ou parceiros. Não há compartilhamento entre
empresas neste MVP.

## Próximos commits sugeridos

```txt
chore: scaffold vite app
feat: add equipment dashboard flow
docs: add supabase security and lgpd notes
```
