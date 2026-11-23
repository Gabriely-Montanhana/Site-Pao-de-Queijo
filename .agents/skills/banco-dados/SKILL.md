
---
name: banco-dados
description: Orienta a modelagem, manutenção e segurança do banco MySQL do Banepane Foods.
---

# Skill — Banco de Dados

## Objetivo
Orientar agentes na manutenção do banco de dados MySQL utilizado pelo Banepane Foods.

## Quando utilizar
- Criar ou modificar tabelas.
- Trabalhar com modelos Sequelize.
- Criar relacionamentos entre entidades.
- Investigar problemas de conexão.
- Consultar produtos, categorias, usuários e pedidos.

## Tecnologias
- MySQL 8
- Docker
- Sequelize
- TypeScript

## Instruções
1. Verificar os modelos existentes em `back_end/src/models`.
2. Respeitar as chaves primárias e estrangeiras.
3. Manter a integridade dos relacionamentos.
4. Utilizar transações em operações que alteram pedidos e estoque.
5. Validar os dados antes de persistir alterações.
6. Evitar consultas SQL inseguras.
7. Não excluir tabelas ou registros sem autorização.
8. Não modificar o esquema do banco sem avaliar os impactos.
9. Documentar alterações estruturais para que possam ser reproduzidas em outros ambientes.

## Segurança obrigatória
- Seguir as instruções do arquivo `AGENTS.md`.
- Nunca abrir, ler ou divulgar arquivos `.env`.
- Nunca expor usuários, senhas ou credenciais do MySQL.
- Nunca registrar informações sensíveis em logs.
- Não executar operações destrutivas sem autorização explícita.

## Verificação
Antes de concluir alterações:
1. Confirmar que os relacionamentos continuam válidos.
2. Verificar se os modelos Sequelize correspondem às tabelas.
3. Testar as operações sem comprometer dados existentes.
4. Confirmar que o back-end continua compilando.
