# Corrigir definitivamente a leitura áudio

## Objetivo
Fazer **Ouvir Folheto** e **Ouvir Resumo** iniciarem som de forma fiável após o toque do utilizador, continuarem até ao fim e apresentarem sempre feedback claro.

## Alterações
- Substituir o fluxo atual por um controlador único de reprodução, sem temporizadores que pausam e retomam a voz durante a leitura.
- Carregar e aguardar as vozes do dispositivo; priorizar `pt-PT`, depois outras vozes portuguesas e, por fim, uma voz disponível com aviso visível.
- Preparar o texto primeiro e exigir um segundo toque em **Reproduzir** quando a preparação demorada tiver quebrado a autorização de áudio do toque inicial, especialmente no iPhone.
- Dividir o texto limpo em blocos móveis seguros e reproduzi-los sequencialmente, mantendo uma única fila controlada pela aplicação.
- Detetar `start`, `end` e erros reais de cada bloco; tentar novamente com outra voz quando a fala não chegar a iniciar.
- Tornar pausa, continuação, parar, recuar, avançar e repetir independentes e previsíveis em Android e iPhone.
- Mostrar voz escolhida, estado, percentagem, página, texto atual, avisos, erro explicado e botão **Tentar novamente**.
- Manter **Ouvir Resumo** independente do folheto completo, mostrando também o resumo gerado.

## Validação
- Confirmar compilação sem erros.
- Testar preparação, início, pausa, continuação, mudança de bloco, conclusão e repetição no navegador.
- Verificar a apresentação em ecrã móvel; o som final deverá ainda ser confirmado num telemóvel real com voz instalada.

## Nota técnica
A Web Speech API depende das vozes instaladas e das regras do navegador. A correção evita iniciar áudio depois de operações assíncronas no mesmo toque: após a preparação, o utilizador inicia a voz através de um botão explícito, preservando a autorização exigida pelos navegadores móveis.
