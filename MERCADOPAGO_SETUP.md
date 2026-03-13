# Configuração do Mercado Pago - Trenvus

Guia completo para configurar o Mercado Pago no servidor de produção.

## 1. Criar Conta no Mercado Pago

1. Acesse: https://www.mercadopago.com.br/
2. Clique em "Criar conta" (use uma conta de empresa, não pessoal)
3. Complete o cadastro com dados reais da empresa
4. Verifique seu email

## 2. Acessar as Credenciais

### Ambiente de Teste (Sandbox)

1. Faça login em: https://www.mercadopago.com.br/developers
2. Clique em "Suas integrações" no menu superior
3. Clique em "Criar aplicação"
4. Dê um nome: "Trenvus Exchange"
5. Escolha "Pagamentos online"
6. Clique em "Criar"

### Obter as Credenciais

Dentro da sua aplicação:

1. **Public Key**:
   - Menu lateral → "Credenciais de produção" ou "Credenciais de teste"
   - Copie a "Public Key"

2. **Access Token**:
   - Na mesma página, clique em "Access Token"
   - Clique em "Copiar"
   - **ATENÇÃO**: Nunca compartilhe este token publicamente!

## 3. Configurar no Servidor

### Opção 1: Configurar Manualmente

Edite o arquivo `.env.backend` no servidor:

```bash
cd /root/rennan/Trenvus
nano .env.backend
```

Altere estas linhas:

```bash
# Mercado Pago (credenciais de TESTE)
MERCADOPAGO_ACCESS_TOKEN=TEST-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
MERCADOPAGO_PUBLIC_KEY=TEST-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_RETURN_URL=http://195.200.7.31:3000/mercadopago/return

# Para PRODUÇÃO (após testes):
# MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
# MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

### Opção 2: Usar o Script de Configuração

Execute o script interativo:

```bash
cd /root/rennan/Trenvus
./setup-mercadopago.sh
```

## 4. Aplicar as Mudanças

Após configurar as credenciais:

```bash
cd /root/rennan/Trenvus

# Restart dos containers
docker compose down
docker compose up -d --build

# Verificar se iniciou corretamente
docker logs exchange-backend --tail 30 | grep -i "mercado\|pago"
```

Você deve ver:
```
Configuring Mercado Pago with access token (length: XX)
Mercado Pago configured successfully
```

## 5. Testar a Integração

### No Frontend

1. Acesse: http://195.200.7.31:3000
2. Faça login com uma conta de teste
3. Vá para "Depositar"
4. Escolha "Mercado Pago"
5. Tente criar um pagamento de teste

### Testar via API (curl)

```bash
# Obter public key
curl http://195.200.7.31:8080/mercadopago/public-key

# Criar preferência de pagamento (precisa de token JWT válido)
curl -X POST http://195.200.7.31:8080/mercadopago/create-preference \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_JWT" \
  -d '{"amount": 100.00}'
```

## 6. Configurar Conta de Teste (Comprador)

Para testar pagamentos, você precisa de uma conta de teste:

1. No painel do Mercado Pago Developers
2. Vá em "Contas de teste"
3. Clique em "Criar conta de teste"
4. Escolha "Comprador"
5. Anote o email e senha gerados

### Cartões de Teste

Use estes cartões para testar (nunca são cobrados):

| Tipo | Número | CVV | Data |
|------|--------|-----|------|
| Visa | 5031 4332 1540 6351 | 123 | 11/30 |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/30 |

## 7. Migrar para Produção

### Pré-requisitos

- [ ] Conta Mercado Pago verificada (KYC completo)
- [ ] Dados bancários cadastrados
- [ ] Contrato de serviço aceito
- [ ] Aplicação aprovada

### Passos

1. No painel do Mercado Pago, vá para "Credenciais de produção"
2. Copie as credenciais de PRODUÇÃO (começam com `APP_USR-`)
3. Atualize o `.env.backend`:

```bash
MERCADOPAGO_ACCESS_TOKEN=APP_USR-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxx
MERCADOPAGO_PUBLIC_KEY=APP_USR-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
MERCADOPAGO_RETURN_URL=https://seudominio.com/mercadopago/return
```

4. Atualize as URLs:
```bash
APP_BASE_URL=https://seudominio.com
API_BASE_URL=https://seudominio.com/api
```

5. Restart:
```bash
docker compose down
docker compose up -d --build
```

## Solução de Problemas

### Erro "Mercado Pago access token is not configured"

Verifique se o arquivo `.env.backend` existe e tem o token:
```bash
grep MERCADOPAGO_ACCESS_TOKEN .env.backend
```

### Erro "invalid access token"

- Verifique se o token está completo (não foi cortado)
- Certifique-se de usar o token correto (TEST ou APP_USR)
- Tokens de teste expiram após alguns meses

### Erro "Cannot resolve hostname backend"

Verifique se o container do backend está rodando:
```bash
docker ps | grep backend
```

### Erro 503 ao tentar pagar

O Mercado Pago não está configurado. Verifique os logs:
```bash
docker logs exchange-backend --tail 50
```

## Suporte

- Documentação Mercado Pago: https://www.mercadopago.com.br/developers
- Suporte técnico: suporte@mercadopago.com
