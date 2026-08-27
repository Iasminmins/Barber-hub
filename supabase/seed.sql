do $$
declare
  shop_id uuid;
  barber_ana uuid;
  barber_carlos uuid;
  barber_juliana uuid;
  service_corte uuid;
  service_barba uuid;
  service_combo uuid;
  product_cera uuid;
  product_pomada uuid;
  product_shampoo uuid;
  client_joao uuid;
  client_maria uuid;
  client_pedro uuid;
  order_id uuid;
  next_number integer;
begin
  select id into shop_id from public.barbershops order by created_at desc limit 1;
  if shop_id is null then raise exception 'Crie uma conta no /cadastro antes de executar o seed local.'; end if;

  delete from public.orders where barbershop_id = shop_id and client_name like 'Demo - %';
  delete from public.appointments where barbershop_id = shop_id and client_name like 'Demo - %';
  delete from public.subscriptions where barbershop_id = shop_id and client_name like 'Demo - %';
  delete from public.financial_entries where barbershop_id = shop_id and description like 'Demo - %';
  delete from public.commissions where barbershop_id = shop_id and employee_name like 'Demo - %';
  delete from public.clients where barbershop_id = shop_id and name like 'Demo - %';
  delete from public.employees where barbershop_id = shop_id and name like 'Demo - %';
  delete from public.catalog_items where barbershop_id = shop_id and name like 'Demo - %';

  insert into public.employees (barbershop_id, name, role, phone, email, active, service_commission, product_commission, subscription_commission, avatar_color)
  values
    (shop_id, 'Demo - Ana Martins', 'barber', '24999990001', 'ana.demo@barberhub.local', true, 45, 10, 5, '#1E3A32'),
    (shop_id, 'Demo - Carlos Lima', 'barber', '24999990002', 'carlos.demo@barberhub.local', true, 40, 12, 5, '#0F766E'),
    (shop_id, 'Demo - Juliana Alves', 'barber', '24999990003', 'juliana.demo@barberhub.local', true, 42, 10, 6, '#B45309');
  select id into barber_ana from public.employees where barbershop_id = shop_id and name = 'Demo - Ana Martins';
  select id into barber_carlos from public.employees where barbershop_id = shop_id and name = 'Demo - Carlos Lima';
  select id into barber_juliana from public.employees where barbershop_id = shop_id and name = 'Demo - Juliana Alves';

  insert into public.catalog_items (barbershop_id, type, name, category, price, cost, duration_min, stock, min_stock, commission, active)
  values (shop_id, 'servico', 'Demo - Corte clássico', 'Cortes', 45, 5, 40, null, null, 10, true) returning id into service_corte;
  insert into public.catalog_items (barbershop_id, type, name, category, price, cost, duration_min, stock, min_stock, commission, active)
  values (shop_id, 'servico', 'Demo - Barba completa', 'Barba', 35, 4, 30, null, null, 10, true) returning id into service_barba;
  insert into public.catalog_items (barbershop_id, type, name, category, price, cost, duration_min, stock, min_stock, commission, active)
  values (shop_id, 'servico', 'Demo - Corte + barba', 'Combos', 70, 8, 70, null, null, 12, true) returning id into service_combo;
  insert into public.catalog_items (barbershop_id, type, name, category, price, cost, stock, min_stock, commission, active)
  values (shop_id, 'produto', 'Demo - Cera modeladora', 'Finalizadores', 35, 16, 18, 5, 10, true) returning id into product_cera;
  insert into public.catalog_items (barbershop_id, type, name, category, price, cost, stock, min_stock, commission, active)
  values (shop_id, 'produto', 'Demo - Pomada matte', 'Finalizadores', 49.90, 22, 12, 4, 10, true) returning id into product_pomada;
  insert into public.catalog_items (barbershop_id, type, name, category, price, cost, stock, min_stock, commission, active)
  values (shop_id, 'produto', 'Demo - Shampoo premium', 'Cuidados', 39.90, 18, 9, 3, 8, true) returning id into product_shampoo;

  update public.barbershops
  set public_booking_settings = jsonb_build_object(
    'productIds', jsonb_build_array(product_cera, product_pomada, product_shampoo),
    'showProducts', true,
    'showCashback', true,
    'cashback', jsonb_build_object('enabled', true, 'percentage', 5, 'minimumPurchase', 0)
  )
  where id = shop_id;

  insert into public.clients (barbershop_id, name, phone, email, birth_date, notes, tags, total_spent, visits, last_visit, favorite_service, preferred_barber)
  values
    (shop_id, 'Demo - João Silva', '24988880001', 'joao.demo@barberhub.local', '1992-04-15', 'Cliente recorrente de demonstração.', '{recorrente,vip}', 315, 7, current_date - 12, 'Corte clássico', 'Demo - Ana Martins') returning id into client_joao;
  insert into public.clients (barbershop_id, name, phone, email, birth_date, notes, tags, total_spent, visits, last_visit, favorite_service, preferred_barber)
  values (shop_id, 'Demo - Maria Souza', '24988880002', 'maria.demo@barberhub.local', '1988-09-22', 'Prefere horários no fim da tarde.', '{recorrente}', 210, 5, current_date - 28, 'Corte + barba', 'Demo - Carlos Lima') returning id into client_maria;
  insert into public.clients (barbershop_id, name, phone, email, birth_date, notes, tags, total_spent, visits, last_visit, favorite_service, preferred_barber)
  values (shop_id, 'Demo - Pedro Costa', '24988880003', 'pedro.demo@barberhub.local', '1998-01-09', 'Primeiro atendimento de demonstração.', '{aniversariante}', 70, 1, current_date - 3, 'Barba completa', 'Demo - Juliana Alves') returning id into client_pedro;

  insert into public.appointments (barbershop_id, client_id, employee_id, service_id, client_name, employee_name, service_name, date, start, duration_min, status, price, notes, selected_products, referral_name, referral_phone)
  values (shop_id, client_joao, barber_ana, service_corte, 'Demo - João Silva', 'Demo - Ana Martins', 'Demo - Corte clássico', current_date + 1, '10:00', 40, 'confirmado', 45, 'Cliente pediu acabamento natural.', jsonb_build_array(jsonb_build_object('id', product_cera, 'name', 'Demo - Cera modeladora', 'quantity', 1, 'unitPrice', 35), jsonb_build_object('id', product_pomada, 'name', 'Demo - Pomada matte', 'quantity', 1, 'unitPrice', 49.90), jsonb_build_object('id', product_shampoo, 'name', 'Demo - Shampoo premium', 'quantity', 1, 'unitPrice', 39.90)), 'Demo - Lucas Ferreira', '24988881111');
  insert into public.appointments (barbershop_id, client_id, employee_id, service_id, client_name, employee_name, service_name, date, start, duration_min, status, price, notes)
  values (shop_id, client_maria, barber_carlos, service_combo, 'Demo - Maria Souza', 'Demo - Carlos Lima', 'Demo - Corte + barba', current_date + 2, '15:30', 70, 'agendado', 70, 'Demonstração de agendamento futuro.');
  insert into public.appointments (barbershop_id, client_id, employee_id, service_id, client_name, employee_name, service_name, date, start, duration_min, status, price, notes)
  values (shop_id, client_pedro, barber_juliana, service_barba, 'Demo - Pedro Costa', 'Demo - Juliana Alves', 'Demo - Barba completa', current_date - 3, '09:30', 30, 'concluido', 35, 'Atendimento concluído.');

  select coalesce(max(number), 0) + 1 into next_number from public.orders where barbershop_id = shop_id;
  insert into public.orders (barbershop_id, number, client_id, client_name, employee_id, employee_name, discount, surcharge, status, method, total, cashback_earned)
  values (shop_id, next_number, client_joao, 'Demo - João Silva', barber_ana, 'Demo - Ana Martins', 0, 0, 'paga', 'pix', 80, 1.75)
  returning id into order_id;
  insert into public.order_items (order_id, barbershop_id, ref_id, type, name, quantity, unit_price)
  values (order_id, shop_id, service_corte, 'servico', 'Demo - Corte clássico', 1, 45), (order_id, shop_id, product_cera, 'produto', 'Demo - Cera modeladora', 1, 35);

  insert into public.financial_entries (barbershop_id, order_id, type, category, description, amount, method, date)
  values (shop_id, order_id, 'entrada', 'Comandas', 'Demo - Comanda paga #1', 80, 'pix', current_date - 1);
  insert into public.financial_entries (barbershop_id, type, category, description, amount, method, date)
  values (shop_id, 'entrada', 'Serviços', 'Demo - Receita de serviços', 105, 'pix', current_date - 3), (shop_id, 'saida', 'Operacional', 'Demo - Compra de materiais', 120, 'debito', current_date - 7);
  insert into public.commissions (barbershop_id, employee_id, employee_name, origin, reference, base, rate, amount, status, date)
  values (shop_id, barber_ana, 'Demo - Ana Martins', 'servico', 'Demo - Corte clássico', 45, 45, 20.25, 'pendente', current_date - 1), (shop_id, barber_ana, 'Demo - Ana Martins', 'produto', 'Demo - Cera modeladora', 35, 10, 3.50, 'paga', current_date - 1);

  insert into public.plans (barbershop_id, name, price, type, credits, description, active, rules)
  values (shop_id, 'Demo - Plano mensal', 149.90, 'mensal', 4, 'Quatro serviços por mês com benefícios exclusivos.', true, jsonb_build_object('cycle', 'mensal', 'cycleDays', 30, 'includedServices', jsonb_build_array(jsonb_build_object('serviceId', service_corte, 'limit', 4))));
  insert into public.plans (barbershop_id, name, price, type, credits, description, active, rules)
  values (shop_id, 'Demo - Pacote barba', 120, 'pacote', 4, 'Pacote de quatro sessões de barba.', true, jsonb_build_object('cycle', 'mensal', 'cycleDays', 30, 'includedServices', jsonb_build_array(jsonb_build_object('serviceId', service_barba, 'limit', 4))));
  insert into public.subscriptions (barbershop_id, plan_id, client_id, plan_name, client_name, price, start_date, due_date, status, credits_used, credits_total)
  select shop_id, p.id, client_maria, p.name, 'Demo - Maria Souza', p.price, current_date - 10, current_date + 20, 'ativo', 1, p.credits
  from public.plans p where p.barbershop_id = shop_id and p.name = 'Demo - Plano mensal';
end $$;
