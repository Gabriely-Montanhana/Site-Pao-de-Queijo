
---
name: backend-api
description: Orienta o desenvolvimento e a manutenção da API do Banepane Foods com Express e TypeScript.
---

# Skill — Desenvolvimento da API

## Objetivo
Auxiliar na criação, manutenção e revisão das rotas do back-end do Banepane Foods.

## Quando utilizar
- Criar ou modificar endpoints.
- Implementar operações CRUD.
- Validar requisições.
- Implementar autenticação e autorização.
- Corrigir erros da API.

## Instruções
1. Utilizar Node.js, Express e TypeScript.
2. Respeitar a estrutura existente em `back_end/src`.
3. Validar os dados antes de executar operações.
4. Utilizar os modelos Sequelize existentes.
5. Proteger rotas privadas com autenticação JWT.
6. Verificar permissões administrativas quando necessário.
7. Retornar códigos HTTP adequados.
8. Evitar duplicação de código.
9. Não modificar regras de negócio sem verificar os impactos.

## Segurança
- Seguir obrigatoriamente o arquivo `AGENTS.md`.
- Nunca acessar ou divulgar arquivos `.env`.
- Nunca registrar senhas, tokens ou credenciais em logs.
- Nunca remover autenticação ou validações para facilitar testes.

## Verificação
Após alterações no back-end, executar:

`cd back_end`

`npm run build`

Confirmar que a compilação termina sem erros.
