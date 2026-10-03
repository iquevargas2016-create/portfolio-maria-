# Novas ferramentas

O currículo permite escolher um foco, reorganizar as seções e marcar experiências para impressão. Não gera novas credenciais. Pesquisas podem ser buscadas por texto e tema; experiências têm links diretos. A página /pt/congress/ (também en/es) apresenta o perfil, pesquisa, currículo e QR code SVG gerado no build, sem enviar dados a serviços de QR.

O contato acrescenta tema/programa e prazo opcionais, incluídos no email. O telefone não aparece nas páginas ou vCards nem no JSON público.

## Oportunidades

No painel autenticado, Oportunidades funciona como organizador local: cadastro manual, situação, filtros, exportação e importação JSON. Os registros locais são deste navegador, não uma caixa sincronizada; mantenha backups em local privado.

A captura automática está implementada, mas desligada por padrão. Para ativar, configure UPSTASH_REDIS_REST_URL e UPSTASH_REDIS_REST_TOKEN (ou KV_REST_API_URL/KV_REST_API_TOKEN) como segredos e CONTACT_INBOX_ENABLED=true apenas em Production. Redeploy necessário. Nenhum armazenamento foi provisionado automaticamente.

Ao ativar, nome, email, organização e mensagem dos novos contatos aceitos pelo Resend serão armazenados por até 90 dias. O painel lista até 200 contatos recentes; mensagens anteriores à ativação não são importadas. Somente sessões autenticadas acessam os dados. Previews nunca capturam nem exibem a caixa de produção. Ajuste o aviso de privacidade antes de ativar para informar esse uso e o armazenamento. Falhas do armazenamento não transformam um email aceito em falha nem induzem reenvio; o email continua sendo a fonte principal. Não há sincronização com Gmail nem confirmação automática de leitura.
