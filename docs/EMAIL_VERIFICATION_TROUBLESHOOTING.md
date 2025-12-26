# Email Verification Troubleshooting Guide

## Problema: Emails de Verificação Não Estão Chegando

Se você não está recebendo emails de verificação após criar uma conta, siga este guia de troubleshooting.

## Verificação Rápida no Supabase Dashboard

### 1. Verificar se Email Confirmations Está Habilitado

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/pwjenlkyvckavtponsfs)
2. Navegue para **Authentication** → **Providers** → **Email**
3. Verifique se **"Enable email confirmations"** está **HABILITADO** (ON)
4. Se não estiver, habilite e salve as alterações

**Importante:** Se esta opção estiver desabilitada, o Supabase não enviará emails de verificação automaticamente.

### 2. Verificar Configuração de SMTP (Opcional)

Se você quiser usar SMTP customizado:

1. Vá para **Settings** → **Auth** → **SMTP Settings**
2. Configure seu provedor SMTP (Gmail, SendGrid, Mailgun, etc.)
3. Ou use o SMTP padrão do Supabase (já configurado)

**Nota:** O Supabase Cloud já vem com SMTP configurado por padrão. Você só precisa configurar SMTP customizado se quiser usar seu próprio provedor.

## Troubleshooting Passo a Passo

### Passo 1: Verificar Spam/Junk Folder

- Emails do Supabase às vezes vão para spam
- Procure por emails de "noreply@supabase.co" ou remetente similar
- Adicione o remetente à sua lista de contatos para evitar spam futuro

### Passo 2: Verificar Console do Navegador

1. Abra o Developer Console do navegador (F12)
2. Vá para a aba "Console"
3. Procure por logs que começam com:
   - `🔍 SignUp Response:` - Mostra se o usuário foi criado
   - `📧 Email Verification Status:` - Mostra o status do email
   - `📧 Resend response:` - Mostra se o reenvio funcionou

**Exemplo de log esperado:**
```
🔍 SignUp Response: {
  hasUser: true,
  hasSession: false,
  userEmail: "seu@email.com",
  userConfirmed: "No",
  ...
}
📧 Email Verification Status: {
  email: "seu@email.com",
  emailConfirmed: false,
  emailSent: true,
  ...
}
```

### Passo 3: Tentar Reenviar Email

Na tela de verificação de email:
1. Clique no botão "Resend verification email"
2. Verifique o console para ver se houve erro
3. Aguarde 1-5 minutos e verifique novamente

### Passo 4: Verificar Rate Limiting

O Supabase pode ter rate limiting para envio de emails:
- Aguarde alguns minutos entre tentativas
- Não tente reenviar múltiplas vezes rapidamente

## Verificações Adicionais

### Verificar se o Usuário Foi Criado

1. No Supabase Dashboard, vá para **Authentication** → **Users**
2. Procure pelo email que você usou para signup
3. Se o usuário existe mas não tem `email_confirmed_at`, o email precisa ser verificado

### Verificar Logs do Supabase

1. No Dashboard, vá para **Logs** → **Auth Logs**
2. Procure por eventos de "signup" e "email_sent"
3. Isso mostra se o Supabase tentou enviar o email

## Soluções Comuns

### Solução 1: Habilitar Email Confirmations

Se `enable_confirmations` estiver desabilitado:
1. Habilite no Dashboard (veja Passo 1 acima)
2. Tente criar uma nova conta
3. O email deve ser enviado automaticamente

### Solução 2: Verificar Configuração de URL

1. Vá para **Authentication** → **URL Configuration**
2. Verifique se "Site URL" está configurado corretamente
3. Adicione URLs de redirect se necessário:
   - `http://localhost:3000/auth/callback` (desenvolvimento)
   - `https://seudominio.com/auth/callback` (produção)

### Solução 3: Limpar Cache e Tentar Novamente

1. Limpe o cache do navegador
2. Tente criar uma nova conta com um email diferente
3. Verifique se o problema persiste

## Debugging no Código

O código agora inclui logging detalhado. Quando você faz signup, verifique o console para:

```javascript
// Logs esperados:
🔍 SignUp Response: { ... }
📧 Email Verification Status: { ... }
```

Se você vir `emailSent: false` ou `emailConfirmed: true` quando não deveria, isso indica um problema de configuração.

## Contato e Suporte

Se nenhuma das soluções acima funcionar:

1. Verifique os [Logs do Supabase](https://supabase.com/dashboard/project/pwjenlkyvckavtponsfs/logs)
2. Consulte a [Documentação do Supabase sobre Email](https://supabase.com/docs/guides/auth/auth-email)
3. Entre em contato com o suporte do Supabase se necessário

## Notas Importantes

- **Desenvolvimento Local:** Se estiver usando Supabase local (`supabase start`), os emails vão para o Inbucket em `http://localhost:54324`
- **Produção:** Emails são enviados via SMTP do Supabase Cloud
- **Rate Limiting:** O Supabase pode limitar quantos emails são enviados por hora
- **Tempo de Entrega:** Emails podem levar 1-5 minutos para chegar

