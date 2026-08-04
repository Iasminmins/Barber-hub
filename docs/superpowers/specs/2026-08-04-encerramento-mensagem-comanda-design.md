# Encerramento da mensagem de comanda no WhatsApp

## Objetivo

Acrescentar um pedido de avaliação, um convite à indicação e um agradecimento ao final de todas as mensagens de comanda enviadas pelo WhatsApp.

## Escopo

A alteração será feita no gerador central `orderMessage`, preservando integralmente os dados dinâmicos já existentes: primeiro nome do cliente, número da comanda, nome da barbearia, itens, ajustes, total, forma de pagamento e status.

Depois de `Obrigado pela preferência!`, a mensagem terá uma linha em branco entre cada um destes blocos:

1. `De 0 a 10, qual nota você daria para o nosso atendimento?`
2. `Se gostou da experiência, sua indicação para amigos e familiares será muito bem-vinda. Ela nos ajuda a crescer e atender cada vez melhor.`
3. `Muito obrigado pela confiança! 🙏`

## Implementação

O texto será acrescentado ao array que compõe a mensagem em `lib/whatsapp.ts`. Não serão criadas configurações, novos componentes ou alterações no fluxo de envio.

## Testes

Um teste unitário do `orderMessage` fixará o novo encerramento e confirmará que ele aparece depois do resumo atual. O teste será executado antes da implementação para demonstrar a falha esperada e novamente depois da alteração para confirmar o comportamento.

## Critérios de aceite

- Toda mensagem de comanda contém os três novos blocos no final.
- Os blocos são separados por linhas em branco.
- O emoji `🙏` é preservado.
- O conteúdo existente da comanda continua inalterado.
