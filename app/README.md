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

## Próximos commits sugeridos

```txt
chore: scaffold vite app
feat: add equipment dashboard flow
docs: add supabase security and lgpd notes
```
