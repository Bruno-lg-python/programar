# Bella Nails Studio — Agendamento online (SPEC)

## O que é
Landing page + agendamento online para Nail Designer (manicure/pedicure) + painel admin. Idioma pt-BR, fuso America/Sao_Paulo (APP_TZ).

## Fluxo da cliente
`/` landing → `/agendar` (wizard: serviço → data (calendário, dias fechados desabilitados) → horário disponível → nome/WhatsApp/e-mail opcional → resumo com sinal 40%) → POST /api/bookings (status `aguardando_pagamento`, segura o horário por 30 min) → POST /api/bookings/{id}/checkout:
- Se `MP_ACCESS_TOKEN` vazio → modo DEMO (MOCK): `/pagamento/{id}` com Pix simulado e botão "Simular pagamento aprovado" → POST /api/bookings/{id}/demo-pay → confirma.
- Se token configurado → preferência Mercado Pago Checkout Pro; back_url `/pagamento/resultado` → GET /api/payments/return verifica em /v1/payments/{id}; webhook POST /api/payments/webhook.
Confirmação → `/agendamento/{id}` e mensagem WhatsApp "confirmacao" na fila.

## WhatsApp (MOCK)
Coleção `messages` (kind: confirmacao | lembrete_dia | lembrete_15min, status pendente|enviada). Loop de 60s no backend gera lembrete do dia (a partir das 08:00 ou <2h antes) e 15 min antes. Admin vê fila e clica "Enviar" (abre wa.me com texto e marca enviada).

## Admin
`/admin/login` senha única (ADMIN_PASSWORD, padrão `admin123`) → cookie httpOnly `admin_session` (JWT). `/admin` abas: Agenda (próximos/por dia/histórico, concluir/cancelar), Serviços (CRUD + ativo/inativo), WhatsApp (fila), Configurações (perfil, contatos, horários por dia, intervalo, % sinal).

## Dados
- services: id, name, description, price, duration(min), photo_url, category(manicure|pedicure|outros), active
- bookings: id, code(BN-XXXXXX), service_*, date YYYY-MM-DD, time/end_time HH:MM, client_*, deposit_amount, remaining_amount, status, payment_id, payment_method, hold_expires_at
- settings: _id "main" (business_name, professional_name, tagline, bio, whatsapp, instagram, address, city, photo_url, service_info, slot_interval, deposit_percent, hours[7] day 0=segunda)

## Bloqueios de agenda
- Coleção `blocks` (id, date, all_day, start, end, reason). Dia inteiro → data fechada (GET /api/blocked-days desabilita no calendário); faixa → horários sobrepostos somem.
- Almoço fixo diário: settings.lunch_enabled/lunch_start/lunch_end (aba Bloqueios). Admin: GET/POST/DELETE /api/admin/blocks.

## Galeria
- Coleção `gallery` (id, image_url, caption, created_at). GET /api/gallery (seção "Trabalhos" na home), admin POST/PUT/DELETE /api/admin/gallery. Seed: 6 fotos.

## Remarcar / cancelar pela cliente
- Página /agendamento/{id}: GET /bookings/{id}/policy → can_change se confirmado e faltam ≥ settings.reschedule_hours (padrão 24h).
- POST /bookings/{id}/reschedule {date,time} (availability usa ?exclude=id); gera mensagem "remarcacao".
- POST /bookings/{id}/cancel → status cancelado, cancelled_by "cliente", cria `credits` {phone, amount=deposit pago}; mensagem "cancelamento".
- Crédito: GET /api/credits?whatsapp= → balance (créditos − credit_applied de reservas ativas). Nova reserva com mesmo WhatsApp desconta automaticamente (booking.credit_applied; deposit_amount = valor a pagar). Se cobrir tudo → confirmada direto (payment_method "credito").
- Cancelamento pelo admin não gera crédito.

## Mercado Pago
ATIVO: MP_ACCESS_TOKEN (conta vendedora de TESTE, site MLB) configurado em backend/.env → /today retorna payment_mode "mercadopago"; /bookings/{id}/demo-pay retorna 403. Checkout Pro redireciona para mercadopago.com.br; retorno em /pagamento/resultado. Cartão teste aprovado: 5031 4332 1540 6351, CVV 123, 11/30, titular APRO, CPF 12345678909.

## Seed
`cd /app/backend && python seed.py` — 7 serviços (Manicure tradicional R$35/40min, Esmaltação R$25/30, Manicure + esmaltação R$50/60, Esmaltação em gel R$90/90, Pedicure tradicional R$40/45, Pedicure + esmaltação R$60/60, Spa dos pés R$80/60) e configurações padrão (Seg–Sáb 09:00–19:00, domingo fechado).
