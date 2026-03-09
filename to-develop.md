# DNA CRM — To Develop

> Bugs conhecidos, melhorias planeadas e ideias de futuro.
> Atualizado: 2026-03-09

---

## 🔴 Bugs Conhecidos

### Concessão

| # | Descrição | Impacto | Esforço |
|---|---|---|---|
| B1 | **Relatório multi-dia** — só é possível exportar um dia de cada vez. Ver receita semanal/mensal requer exportar manualmente e juntar ficheiros. | Médio | Alto |
| B2 | **Sem sincronização em tempo real** — dois funcionários a usar o sistema simultaneamente não veem as alterações um do outro sem clicar "Atualizar". | Médio | Alto |

---

## 🟡 Melhorias & Funcionalidades Planeadas

### Alta prioridade

| # | Funcionalidade | Descrição | Esforço |
|---|---|---|---|
| M1 | **Relatório semanal/mensal de concessão** | Exportar Excel com resumo de ocupação e receita por dia, para um intervalo de datas (ex: semana, mês, temporada) | Médio |
| M2 | **Vista de ocupação futura** | Grelha horizontal spots × próximos 7/14 dias — ver de um relance quais spots estão reservados sem entrar dia a dia | Médio |
| M3 | **Bloqueio de concessão por datas** | Marcar dias como fechados (mau tempo, manutenção, off-season). Bloqueia entradas e aparece na grelha com cor própria | Médio |

### Média prioridade

| # | Funcionalidade | Descrição | Esforço |
|---|---|---|---|
| M4 | **Base de clientes recorrentes** | Detecção de clientes por telefone, histórico de visitas, notas por cliente. Actualmente nomes são texto livre sem ligação entre reservas | Alto |
| M5 | **Notificações WhatsApp/SMS** | Confirmação automática ao cliente quando a reserva é criada (via Twilio ou similar) | Médio |
| M6 | **Lista de espera** | Quando a concessão está completa, registar interesse do cliente para ser contactado se abre vaga | Baixo |
| M7 | **Widget de meteorologia** | Previsão do tempo directamente no Controlo Diário — essencial para gestão de praia | Baixo |

### Baixa prioridade / futuro

| # | Funcionalidade | Descrição | Esforço |
|---|---|---|---|
| M8 | **Portal de reservas para clientes** | Link público onde o cliente escolhe spot, datas, paga (Stripe). O preçário já existe em 7 línguas | Muito alto |
| M9 | **Exportação PDF do controlo diário** | Relatório diário imprimível via `jspdf` (biblioteca já instalada) | Baixo |
| M10 | **Pagamento parcial** | Actualmente só "pago / não pago". Suporte a depósito + saldo em falta | Médio |
| M11 | **Audit log** | Registar quem criou/editou cada entrada (`createdBy`, `updatedBy`) para rastreabilidade | Médio |
| M12 | **Reservas recorrentes** | Mesmo cliente, mesmo spot, todos os anos / todas as semanas | Alto |
| M13 | **Ligação atividades ↔ concessão** | Cliente de kayak e cliente de chapéu são registos independentes. Unificar perfil de cliente | Muito alto |

---

## 📱 Responsividade

O CRM **não é responsivo**. Três problemas estruturais:

1. **`.cd-page { margin-left: 240px }` hardcoded** — em ecrãs < ~900px a sidebar sobrepõe o conteúdo
2. **Grelha de spots** — 16 colunas (Trópico) são ilegíveis em tablet; em telemóvel é inutilizável
3. **Painéis drawer** com `width: 380px` fixo ocupam ecrã inteiro em mobile sem adaptação

**Mínimo para tablet (iPad na praia):**
- Sidebar que colapsa em hamburger abaixo de 900px
- Grelha de spots com scroll horizontal em vez de miniaturizar
- Drawer a 100% de largura em mobile

---

## 🎨 Optimizações Visuais

| # | Optimização | Descrição |
|---|---|---|
| V1 | **Loading skeletons** | Substituir spinner por esqueleto de layout enquanto carrega (grelha de spots, tabela de reservas) |
| V2 | **Toast notifications** | Substituir `confirm()` do browser por toasts não-bloqueantes para acções (criar, libertar, carry-over) |
| V3 | **Densidade configurável** | Tabela de reservas compacta / normal — útil quando há muitas reservas |
| V4 | **Cores por concessão** | Trópico em laranja/âmbar, Subnauta em azul/teal para distinguir visualmente ao alternar |
| V5 | **Impressão optimizada** | CSS `@media print` para o relatório diário — imprimir directamente do browser |

---

## ✅ Já Implementado (referência)

| Data | Feature |
|---|---|
| Mar 2026 | Módulo concessão completo (Controlo Diário, Reservas, Preçário, Calculadora) |
| Mar 2026 | Exportação Excel estilizada com exceljs (cores por período, secções no resumo) |
| Mar 2026 | Carry-over de tarde (transferência entre spots/dias) |
| Mar 2026 | Reservas multi-spot (+ Adicionar Chapéu) com pré-validação de disponibilidade |
| Mar 2026 | Edição de reservas com actualização de datas e entradas diárias |
| Mar 2026 | Detecção de conflitos com sugestão de alternativas |
| Mar 2026 | Nota do dia persistida em localStorage por concessão+data |
| Mar 2026 | Timezone Europe/Lisbon em todos os componentes |
