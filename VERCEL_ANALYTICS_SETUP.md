# Estatísticas da Vercel no painel

Integração somente de leitura usando a API oficial: https://vercel.com/docs/analytics/web-analytics-api

Ative Web Analytics no projeto. Crie um access token na Vercel com acesso ao escopo electro-md, usando o menor acesso disponível e expiração adequada. Não envie o token por chat. Adicione VERCEL_ANALYTICS_TOKEN como Secret apenas em Production. O projeto usa VERCEL_PROJECT_ID fornecido pela Vercel; há fallback para este projeto. VERCEL_ANALYTICS_TEAM_ID é opcional, com fallback para a equipe atual.

Redeploy após salvar. Painel → Interesse no perfil mostra evolução diária, páginas, países e dispositivos dos últimos sete dias UTC, conforme a janela do plano. Respostas são guardadas em memória por cinco minutos; não há chamadas externas ao abrir a demonstração ou previews. Endpoint exige sessão administrativa, limita consultas e nunca devolve token ou resposta bruta do provedor. Ausência de dados, integração não configurada e falha de acesso são estados distintos. Visitantes de dias/grupos diferentes não devem ser somados como pessoas únicas.

Contadores internos de ações usam Redis e continuam separados dos dados da Vercel. Testes usam respostas simuladas; números reais dependem do token e devem ser conferidos com a mesma janela/filtro no dashboard da Vercel.
