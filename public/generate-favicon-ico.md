# Como gerar favicon.ico

Para gerar o arquivo `favicon.ico` necessário para compatibilidade com navegadores antigos, você tem algumas opções:

## Opção 1: Usar ferramenta online (Recomendado)

1. Acesse https://favicon.io/favicon-converter/
2. Faça upload do arquivo `public/favicon.png` ou `public/icons/icon-32x32.png`
3. Baixe o arquivo `favicon.ico` gerado
4. Coloque o arquivo em `public/favicon.ico`

## Opção 2: Usar imagem online

1. Acesse https://realfavicongenerator.net/
2. Faça upload do arquivo `public/icons/icon-512x512.png`
3. Configure as opções desejadas
4. Baixe e extraia os arquivos gerados
5. Coloque `favicon.ico` em `public/`

## Opção 3: Usar imagem diretamente (temporário)

Até gerar o `.ico`, você pode usar o `favicon.png` que já está disponível. O navegador vai usar automaticamente o `favicon.svg` em navegadores modernos e o `.png` como fallback.

**Nota:** Navegadores modernos já suportam `favicon.svg`, então o `.ico` é principalmente para compatibilidade com navegadores antigos (IE, navegadores muito antigos do Chrome/Firefox).





