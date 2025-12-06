# PRO CONCURSOS - Guia de Deploy Profissional

Parabéns! Seu projeto está pronto. Siga este guia para colocar o site no ar com seu domínio próprio.

## 1. Preparar o Código (GitHub)
1. Crie uma conta no [GitHub](https://github.com).
2. Crie um **Novo Repositório** (New Repository).
3. Suba todos os arquivos deste projeto para lá.
   - Se estiver usando terminal:
     ```bash
     git init
     git add .
     git commit -m "Versão final para deploy"
     git branch -M main
     git remote add origin SEU_LINK_DO_GITHUB
     git push -u origin main
     ```

## 2. Hospedagem (Netlify) - Recomendado
A Netlify é ideal para sites React + Vite.

1. Crie uma conta na [Netlify](https://www.netlify.com).
2. Clique em **"Add new site"** -> **"Import from Git"**.
3. Escolha **GitHub** e selecione o repositório que você criou.
4. **Build Settings** (Geralmente preenchido automático):
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
5. **Environment variables** (MUITO IMPORTANTE):
   Clique em "Add environment variables" e adicione as chaves que você tem:
   - `API_KEY`: (Sua chave do Google Gemini)
   - `VITE_SUPABASE_URL`: (Sua URL do Supabase)
   - `VITE_SUPABASE_ANON_KEY`: (Sua Anon Key do Supabase)
   - `VITE_MP_PUBLIC_KEY`: (Chave pública do Mercado Pago, se tiver)
6. Clique em **Deploy site**.

## 3. Configurar Domínio Próprio
1. No painel do seu site na Netlify, vá em **"Domain management"**.
2. Clique em **"Add a domain"**.
3. Digite seu domínio (ex: `www.meusite.com.br`).
4. A Netlify mostrará instruções de DNS.
   - Se comprou no **Registro.br**, **GoDaddy** ou **Hostgator**:
   - Copie o registro **CNAME** ou os servidores **DNS** (Nameservers) que a Netlify fornecer.
   - Vá no painel onde comprou o domínio e atualize a Zona de DNS.
   - *Nota: A propagação pode levar de 1 a 24 horas.*

## 4. Configuração Final do Supabase (Auth)
Para que o Login funcione no seu novo domínio:

1. Acesse seu painel [Supabase](https://supabase.com/dashboard).
2. Vá em **Authentication** -> **URL Configuration**.
3. **Site URL:** Altere de `http://localhost...` para `https://seu-dominio-final.com.br`.
4. **Redirect URLs:** Adicione `https://seu-dominio-final.com.br/**`.
5. Clique em **Save**.

## 5. Configuração Final do Mercado Pago (Opcional)
Se você configurou o webhook de pagamento:

1. Vá em **Edge Functions** no Supabase.
2. Certifique-se que a secret `MP_ACCESS_TOKEN` está configurada.
3. A URL de retorno já é automática, mas certifique-se no painel do Mercado Pago que sua aplicação está em modo "Produção".

---

### Solução de Problemas Comuns

- **Erro 404 ao recarregar a página:** O arquivo `netlify.toml` incluído neste projeto já corrige isso.
- **Login não funciona:** Verifique o passo 4 (URL Configuration do Supabase).
- **Tela Branca:** Verifique se as Variáveis de Ambiente (Passo 2) foram preenchidas corretamente na Netlify.
