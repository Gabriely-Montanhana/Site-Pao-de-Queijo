
---
name: testes-seguranca
description: Orienta a validação, os testes e a proteção de dados da API Banepane Foods.
---

# Skill — Testes e Segurança

## Objetivo
Garantir que as funcionalidades do Banepane Foods sejam verificadas antes da entrega, respeitando as regras de segurança.

## Quando utilizar
- Testar endpoints da API.
- Verificar autenticação JWT.
- Validar operações CRUD.
- Investigar erros.
- Conferir regras de pedidos e estoque.
- Revisar alterações antes de commits.

## Procedimento de testes
1. Executar `npm run build` na pasta `back_end`.
2. Confirmar que o servidor inicia corretamente.
3. Verificar a conexão com o MySQL.
4. Testar cadastro e login de usuários.
5. Confirmar que rotas protegidas rejeitam requisições sem token.
6. Testar criação, consulta, edição e exclusão dos registros.
7. Verificar se pedidos calculam os valores corretamente.
8. Confirmar que compras diminuem o estoque.
9. Confirmar que cancelamentos devolvem o estoque apenas uma vez.
10. Verificar se o front-end recebe as respostas esperadas.

## Regras de segurança
- Seguir obrigatoriamente o arquivo `AGENTS.md`.
- Nunca abrir, ler ou divulgar arquivos `.env`.
- Nunca expor senhas, tokens JWT ou credenciais.
- Nunca desativar autenticação para facilitar testes.
- Nunca usar dados reais de clientes em testes.
- Nunca executar exclusões em massa sem autorização.
- Nunca publicar informações sensíveis no GitHub.

## Tratamento de erros
1. Identificar a causa antes de modificar o código.
2. Utilizar mensagens de erro claras.
3. Não divulgar detalhes internos ou credenciais nas respostas da API.
4. Verificar se a correção não prejudica outras funcionalidades.

## Critérios de conclusão
- Compilação sem erros.
- Funcionalidades testadas.
- Regras de autenticação preservadas.
- Dados sensíveis protegidos.
- Alterações prontas para revisão.
