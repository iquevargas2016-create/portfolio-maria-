# Portfólio Maria Miranda

Site estático em português, inglês e espanhol, com painel editorial e funções Node na Vercel. O conteúdo existente continua em `content.json`.

## Desenvolvimento

```sh
npm ci
npm run check
```

`npm run build` gera `public/`. A Vercel usa `vercel.json` para publicar esse diretório e as funções em `api/`. O build interrompe a publicação se o conteúdo for inválido. Nenhum segredo é copiado para `public/`.

Rotas: `/pt/`, `/en/`, `/es/`; currículo em `/{idioma}/cv/`; cartão em `/{idioma}/card/`; pesquisas em `/pt/pesquisa/{slug}/`, `/en/research/{slug}/`, `/es/investigacion/{slug}/`. Não altere um slug publicado sem criar um redirecionamento para preservar links.

## Painel e publicação

Entre em `/admin/` usando a senha já configurada. `/admin/?demo=1` permite experimentar com o conteúdo público, sem autenticação, sem publicar e sem chamadas de IA.

- Campos existentes, coleções, idiomas e seções extras são editáveis.
- O rascunho e a foto ficam no armazenamento deste navegador. Não são privados em um computador compartilhado; sair encerra a sessão, mas preserva o rascunho. Exportar salva uma cópia local. Não existe sincronização de rascunhos entre dispositivos.
- Prévia usa o mesmo renderizador do site e mostra idiomas, páginas e largura móvel. “Antes” compara o conteúdo publicado usando o novo layout.
- Publicar exige revisão da prévia e confirmação. A função aceita publicação **somente em `VERCEL_ENV=production`**. Não use a configuração de ambiente de produção em previews.
- A publicação cria um commit atômico de conteúdo e foto. Confere a revisão carregada e usa atualização de branch sem `force`, evitando sobrescrever alterações concorrentes.
- Histórico lista as últimas 20 alterações em `content.json`. Restaurar carrega somente os textos como rascunho; fotos e código não são revertidos.
- As traduções existentes são preservadas. Marcar revisado vale para o conjunto de textos atual; qualquer edição exige nova revisão.

Variáveis existentes necessárias: `ADMIN_PASSWORD`, `SESSION_SECRET`, `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`; `GITHUB_BRANCH` é opcional e usa `main`. O token GitHub precisa de acesso de leitura e escrita ao conteúdo do repositório.

## Assistente e custos

1. **Ajuda no site:** busca determinística no conteúdo público, sem modelo generativo, sem API de IA e sem servidor adicional. Fica desligada por padrão. A prévia oferece “Ativar para testar”; habilitar definitivamente é uma opção do rascunho, aplicada apenas ao publicar. Não é uma ferramenta de aconselhamento médico.
2. **ChatGPT manual:** qualquer campo pode gerar instruções para copiar no ChatGPT. O usuário cola a sugestão de volta, compara e aceita. Nenhuma chamada de API ou transmissão automática é realizada.
3. **IA automática opcional:** desligada por padrão, inclusive se já existir uma chave. Requer `AI_ENABLED=true` e `AI_GATEWAY_API_KEY` (ou OIDC da Vercel) ou `OPENAI_API_KEY`. Só usuários autenticados podem solicitar uma sugestão e precisam ligar o controle de teste no editor. Nunca exponha chaves no HTML, no repositório ou em variáveis públicas.

Modelos padrão: `openai/gpt-5-mini` via Gateway e `gpt-5-mini` via OpenAI. Configure `AI_MODEL` ou `OPENAI_MODEL` para alterar. Catálogo Gateway consultado em 03/10/2026. A integração automática consome créditos separados do ChatGPT; não é ativada pelo build. O editor reutiliza sugestões idênticas durante a sessão. O servidor limita entrada e saída e aplica limite de chamadas por instância; esse limite **não é um teto global de gastos**. Configure limites de gasto no provedor antes de ativar uso contínuo. `store:false` é enviado ao provedor, mas não substitui as políticas de retenção dele.

## Métricas

Vercel Web Analytics existente é mantido. Eventos: abrir pesquisa/CV, imprimir CV, email, telefone, compor email, salvar contato, compartilhar e copiar email. As mensagens do formulário não são enviadas para análise; ele abre apenas o aplicativo de email do visitante.

O painel oferece um link para as métricas da Vercel. Contadores internos de 30 dias são opcionais e só funcionam se um Redis REST já estiver configurado: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`, ou `KV_REST_API_URL` + `KV_REST_API_TOKEN`. Não se cria nem contrata armazenamento automaticamente. São contagens de ações, não pessoas únicas. Preview/demonstração não registra ações. O build precisa dessas variáveis para habilitar o envio no site.

## Offline

O service worker guarda apenas páginas públicas e arquivos expressamente permitidos. `/admin/`, `/api/`, mensagens, rascunhos e URLs com parâmetros não entram no cache. A instalação inicial exige conexão; depois as páginas pré-carregadas funcionam offline. A fonte usa o fallback do sistema quando indisponível. Atualizações de service worker são aplicadas ao reabrir as páginas, preservando uma sessão em andamento.

## Verificação

Testes Node + JSDOM cobrem renderização, rotas, escape de HTML, rascunhos, comparação, assistente, autenticação, conflitos de publicação e limites de integração. Não substituem uma inspeção visual em navegador real. IA e publicação são testadas com respostas simuladas; precisam de validação ao vivo com as credenciais do ambiente antes de serem consideradas operacionais.
