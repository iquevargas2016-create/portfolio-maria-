# Tradução automática e edição simples

A edição mostra apenas o idioma escolhido. Alterações em texto são traduzidas para os outros dois após uma pausa de 1,2 segundo. Email e localização são sincronizados sem tradução. Resultados ficam no rascunho; prévia e publicação continuam sob controle da editora. Falhas preservam a origem e as versões anteriores; traduções pendentes bloqueiam a publicação. Revisar fatos e termos acadêmicos na prévia continua importante.

Configuração: DeepL API Free, DEEPL_API_KEY como Secret em Production. O código aceita apenas chave Free com sufixo :fx e usa api-free.deepl.com; não ativa API paga ou o assistente de IA. Novos textos editados são enviados ao DeepL para tradução, incluindo datas e instituições presentes nesses textos. Nenhuma mensagem da caixa de oportunidades é enviada ao tradutor. Observe a cota do plano no provedor. Após salvar a variável, redeploy necessário.

A demonstração não consulta tradutor. Testes usam respostas simuladas; tradução real depende da chave. Sem chave, a edição é salva como rascunho pendente e não pode ser publicada enquanto os textos não forem sincronizados.

Documentação: https://developers.deepl.com/api-reference/translate/request-translation
