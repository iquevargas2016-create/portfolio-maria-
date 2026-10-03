# Ativar o envio de mensagens pelo site

O formulário já foi preparado. A mensagem chega a **miranda.maria.md@gmail.com**, endereço atual do portfólio. O visitante informa seu próprio email; ao clicar em Responder no Gmail, a resposta vai para ele.

A configuração abaixo habilita o envio na prévia. O site público permanece na versão anterior até aprovarmos a atualização. Não envie as chaves pelo chat e não coloque chaves no GitHub.

## 1. Criar o remetente no Resend

1. Acesse https://resend.com e crie sua conta. Escolha o plano Free, se disponível para sua conta; não é necessário ativar IA, marketing, addons ou cobrança por excedente para esta integração.
2. Abra **Domains → Add domain**.
3. Informe **contato.mariamirandamd.com**. Esse subdomínio será usado apenas para o remetente do formulário.
4. O Resend mostrará os registros DNS necessários para envio. Deixe essa página aberta.
5. Abra a Vercel, selecione a equipe **electro-md**, vá a **Domains** e abra **mariamirandamd.com**. Procure **DNS Records**. Os servidores DNS consultados em 03/10/2026 são os da Vercel.
6. Adicione os registros exigidos pelo Resend: copie **Type**, **Name/Host**, **Value** e **Priority**, quando houver. Os valores são exclusivos da sua conta; use exatamente os exibidos. Se a Vercel acrescentar `.mariamirandamd.com` automaticamente ao nome, não repita esse sufixo. Confira o nome completo resultante.
7. Preserve os registros existentes do site e do email. Adicione apenas os registros de envio desse subdomínio; não ative recebimento no Resend.
8. Volte ao Resend, solicite a verificação e aguarde o status **Verified**. A propagação DNS pode levar algum tempo.
9. Em **API Keys → Create API Key**, use o nome **Site Maria Miranda**, permissão **Sending access** e restrinja ao domínio verificado, se essa opção aparecer. Guarde a chave para colocá-la diretamente na Vercel.

O remetente usado pelo código será **site@contato.mariamirandamd.com**. Não precisa contratar uma caixa postal para ele; respostas usam o email do visitante.

## 2. Ativar a proteção contra spam

1. Acesse https://dash.cloudflare.com e crie ou entre em sua conta.
2. Abra **Turnstile → Add widget**. Não é necessário transferir o DNS do domínio para a Cloudflare.
3. Nome: **Contato Maria Miranda**. Modo: **Managed**.
4. Adicione estes hostnames, sem `https://` e sem caminhos:
   - `mariamirandamd.com`
   - `www.mariamirandamd.com`
   - `portfolio-template-1-git-codex-portfolio-tool-d5d03b-electro-md.vercel.app`
5. Salve e guarde **Site key** e **Secret key**. Use as chaves reais deste widget, não chaves de demonstração.

## 3. Colocar cinco variáveis na Vercel

Abra https://vercel.com/electro-md/portfolio-template-1 e siga **Settings → Environment Variables**.

Adicione cada linha abaixo. Selecione **Preview** e **Production**; em Preview, aplique à branch desta prévia ou a todas as branches, conforme o seletor disponível.

| Nome da variável | Valor |
| --- | --- |
| `RESEND_API_KEY` | Chave criada no Resend |
| `CONTACT_FROM_EMAIL` | `site@contato.mariamirandamd.com` |
| `TURNSTILE_SITE_KEY` | Site key do Turnstile |
| `TURNSTILE_SECRET_KEY` | Secret key do Turnstile |
| `CONTACT_EMAIL_ENABLED` | `true` |

Não use o prefixo `NEXT_PUBLIC_`. Apenas a Site key, que é pública, será apresentada ao navegador. O código mantém as duas chaves secretas no servidor.

## 4. Atualizar a prévia

1. Na Vercel, abra **Deployments**.
2. Localize a publicação mais recente da branch **codex/portfolio-tools-2026-10-03**.
3. Abra o menu de opções e escolha **Redeploy**. Mantenha o ambiente **Preview**.
4. Aguarde o status **Ready**. Alterar variáveis não atualiza publicações antigas automaticamente.
5. Abra https://portfolio-template-1-git-codex-portfolio-tool-d5d03b-electro-md.vercel.app/pt/ e recarregue.

## 5. Fazer o teste real

1. Na página do site, vá a **Contato → Vamos conversar sobre uma oportunidade?**. Não use a prévia dentro do editor: ali o envio está bloqueado intencionalmente.
2. Preencha seu nome, seu email e uma mensagem como **Teste do formulário — pode desconsiderar**.
3. Aguarde ou conclua a verificação contra spam e clique em **Enviar mensagem**.
4. Confira a confirmação na página e a chegada em **miranda.maria.md@gmail.com**, incluindo Spam. No Resend, **Emails** mostra o estado de entrega.
5. Ao abrir o email recebido, confira se **Responder** aponta para o email que você preencheu.

A confirmação do site significa que o provedor aceitou o envio; a entrega final é confirmada no Resend e na caixa de entrada. Eu validei o código com respostas simuladas, sem enviar mensagens reais.

## Se algo não funcionar

- **Envio ainda não disponível:** confira as cinco variáveis, os ambientes selecionados e faça Redeploy da branch correta.
- **Verificação não aparece:** confirme o hostname da prévia no Turnstile; tente desativar bloqueadores apenas para testar essa página.
- **Não foi possível confirmar o envio:** confira o domínio Verified, a chave com permissão de envio, o remetente e os limites no Resend. O texto digitado permanece no formulário para nova tentativa.
- **Mensagem aceita mas não recebida:** confira Spam e o estado de entrega no Resend. Não significa necessariamente que o email já chegou.
- **Desligar o envio:** defina `CONTACT_EMAIL_ENABLED=false` e faça Redeploy.

Não contratei serviços pagos nem modifiquei seu DNS. Resend e Turnstile oferecem opções gratuitas, sujeitas aos limites atuais. O limitador local de tentativas complementa o CAPTCHA, mas não é uma cota global de gastos. Evite habilitar excedentes pagos se quiser manter um teto de custo.

Referências oficiais: [Domínios Resend](https://resend.com/docs/dashboard/domains/introduction), [Chaves Resend](https://resend.com/docs/dashboard/api-keys/introduction), [Preços Resend](https://resend.com/pricing), [Configurar Turnstile](https://developers.cloudflare.com/turnstile/get-started/widget-management/dashboard/), [Planos Turnstile](https://developers.cloudflare.com/turnstile/plans/), [Variáveis Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).
