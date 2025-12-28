# TrainPulse PWA - Guia de Implementação

## O que foi implementado

O TrainPulse agora é um Progressive Web App (PWA) completo que permite:

1. **Instalação como App Nativo**: Usuários podem instalar o app em seus dispositivos móveis e desktop
2. **Funcionalidade Offline**: Visualização de dados mesmo sem conexão à internet
3. **Cache Inteligente**: Assets e dados são cacheados automaticamente
4. **Indicadores Visuais**: Status de conexão mostrado ao usuário

## Arquivos Criados

### Core PWA
- `public/manifest.json` - Manifesto do PWA com configurações
- `public/sw.js` - Service Worker para cache e offline
- `src/lib/pwa/registerSW.ts` - Utilitário para registrar service worker
- `src/components/pwa/PWAProvider.tsx` - Provider com status offline

### Ícones
- `public/icons/generate-icons.html` - Gerador de ícones no navegador
- `public/icons/create-icons.js` - Script Node.js para gerar ícones
- `public/icons/icon.svg` - Ícone SVG base
- `public/icons/README.md` - Instruções para gerar ícones

### Configuração
- `next.config.js` - Atualizado com headers para PWA
- `src/app/layout.tsx` - Atualizado com meta tags PWA
- `src/components/layout/ConditionalLayout.tsx` - Integrado com PWAProvider

## Próximos Passos

### 1. Gerar Ícones PNG (OBRIGATÓRIO)

Você precisa gerar os ícones PNG antes de fazer deploy:

**Opção A - Usando o gerador HTML (Mais fácil):**
1. Abra `public/icons/generate-icons.html` no navegador
2. Clique em "Download All Icons"
3. Todos os ícones serão baixados automaticamente
4. Copie os arquivos PNG para `public/icons/`

**Opção B - Usando script Node.js:**
```bash
npm install canvas
node public/icons/create-icons.js
```

**Opção C - Manualmente:**
Crie PNGs nos tamanhos: 72, 96, 128, 144, 152, 192, 384, 512 pixels
Use o `icon.svg` como referência visual

### 2. Testar Localmente

1. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

2. Abra o Chrome DevTools (F12)
3. Vá para a aba "Application" > "Service Workers"
4. Verifique se o service worker está registrado
5. Vá para "Application" > "Manifest" para verificar o manifest

### 3. Testar Instalação

**Chrome/Edge Desktop:**
- Procure pelo ícone de instalação na barra de endereços
- Ou vá em Menu > "Instalar TrainPulse..."

**Chrome Android:**
- Menu > "Adicionar à tela inicial"
- Ou prompt automático pode aparecer

**Safari iOS:**
- Compartilhar > "Adicionar à Tela de Início"

### 4. Testar Modo Offline

1. Abra o DevTools (F12)
2. Vá para "Network" tab
3. Marque "Offline"
4. Navegue pelo app - você deve ver dados cacheados
5. Um banner laranja aparecerá indicando que está offline

### 5. Deploy

O PWA funcionará automaticamente em produção se:
- ✅ O site estiver em HTTPS (obrigatório para service workers)
- ✅ Os ícones PNG estiverem em `public/icons/`
- ✅ O manifest.json estiver acessível

## Funcionalidades

### Cache Estratégico

**Cache First** (Assets estáticos):
- CSS, JS, imagens, fontes
- Cache permanente até nova versão

**Network First** (Dados do Supabase):
- Requests de API
- Usa cache quando offline
- Atualiza em background quando online

**Stale While Revalidate** (Páginas):
- Páginas HTML
- Mostra cache imediatamente
- Atualiza em background

### Dados Offline

Os seguintes dados ficam disponíveis offline após primeira visita:
- Lista de clientes
- Lista de appointments (últimos 30 dias)
- Lista de workouts
- Detalhes individuais (client, appointment, workout)

**Nota**: Criação/edição de dados requer conexão à internet.

## Troubleshooting

### Service Worker não registra
- Verifique se está em HTTPS ou localhost
- Abra DevTools > Application > Service Workers para ver erros
- Verifique o console do navegador

### Ícones não aparecem
- Certifique-se que os arquivos PNG estão em `public/icons/`
- Verifique o console para erros 404
- Os tamanhos mínimos necessários são 192x192 e 512x512

### Manifest inválido
- Valide em: https://manifest-validator.appspot.com/
- Verifique sintaxe JSON no `manifest.json`

### Cache não funciona
- Limpe o cache do navegador
- Force refresh (Ctrl+Shift+R)
- Verifique se o service worker está ativo

## Customização

### Alterar Cores do Tema
Edite `public/manifest.json`:
- `theme_color`: Cor da barra de status
- `background_color`: Cor de fundo durante carregamento

### Alterar Estratégias de Cache
Edite `public/sw.js`:
- Ajuste `CACHE_VERSION` para forçar atualização
- Modifique funções de cache conforme necessário

### Personalizar Banner Offline
Edite `src/components/pwa/PWAProvider.tsx`:
- Ajuste mensagens e estilos
- Modifique tempo de exibição

## Referências

- [MDN - Progressive Web Apps](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [Web.dev - PWA](https://web.dev/progressive-web-apps/)
- [Next.js - PWA](https://nextjs.org/docs/app/building-your-application/configuring/progressive-web-apps)



