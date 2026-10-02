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

## Seed
`cd /app/backend && python seed.py` — 7 serviços (Manicure tradicional R$35/40min, Esmaltação R$25/30, Manicure + esmaltação R$50/60, Esmaltação em gel R$90/90, Pedicure tradicional R$40/45, Pedicure + esmaltação R$60/60, Spa dos pés R$80/60) e configurações padrão (Seg–Sáb 09:00–19:00, domingo fechado).
