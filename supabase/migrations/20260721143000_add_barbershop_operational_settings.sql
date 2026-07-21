alter table public.barbershops
  add column if not exists payment_methods jsonb not null default
    '[
      {"id":"pix","name":"PIX","slug":"PIX","active":true},
      {"id":"credito","name":"Cartão de Crédito","slug":"CARTAO_CREDITO","active":true},
      {"id":"debito","name":"Cartão de Débito","slug":"CARTAO_DEBITO","active":true},
      {"id":"dinheiro","name":"Dinheiro","slug":"DINHEIRO","active":true}
    ]'::jsonb,
  add column if not exists agenda_settings jsonb not null default
    '{
      "lowStockAlert":5,
      "planCommissionMode":"receita",
      "businessHours":{
        "domingo":{"closed":true,"start":"09:00","end":"19:30"},
        "segunda":{"closed":false,"start":"09:00","end":"19:30"},
        "terca":{"closed":false,"start":"09:00","end":"19:30"},
        "quarta":{"closed":false,"start":"09:00","end":"19:30"},
        "quinta":{"closed":false,"start":"09:00","end":"19:30"},
        "sexta":{"closed":false,"start":"09:00","end":"19:30"},
        "sabado":{"closed":false,"start":"09:00","end":"18:00"}
      }
    }'::jsonb;

grant update (payment_methods, agenda_settings)
on public.barbershops
to authenticated;
