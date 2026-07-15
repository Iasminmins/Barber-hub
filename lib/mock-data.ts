/**
 * ============================================================================
 *  FIXTURES TEMPORÁRIAS - NÃO SÃO A SOLUÇÃO FINAL
 * ============================================================================
 *  Todos os dados abaixo são apenas para desenvolvimento/demonstração da UI.
 *  A camada de acesso a dados (lib/data.ts) importa exclusivamente daqui, de
 *  modo que a substituição por Supabase se resume a reescrever lib/data.ts
 *  usando as mesmas assinaturas de função. Nenhuma tela lê estas fixtures
 *  diretamente.
 * ============================================================================
 */

import type {
  Appointment,
  Barbershop,
  CatalogItem,
  Client,
  Commission,
  Employee,
  FinancialEntry,
  ImportRecord,
  Order,
  Plan,
  Subscription,
} from './types'

const BSP = 'bsp_1'

function todayISO(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10)
}

export const barbershops: Barbershop[] = [
  { id: 'bsp_1', name: 'Barbearia Navalha de Ouro', slug: 'navalha-de-ouro', color: '#1E3A32', city: 'São Paulo, SP', plan: 'pro' },
  { id: 'bsp_2', name: 'BarberHub Vila Madalena', slug: 'vila-madalena', color: '#1E3A32', city: 'São Paulo, SP', plan: 'premium' },
  { id: 'bsp_3', name: 'Corte & Barba Centro', slug: 'corte-barba-centro', color: '#1E3A32', city: 'Campinas, SP', plan: 'starter' },
]

export const employees: Employee[] = [
  { id: 'emp_1', barbershopId: BSP, name: 'Rafael Moura', role: 'Barbeiro Sênior', phone: '(11) 98888-1010', email: 'rafael@navalhadeouro.com', active: true, serviceCommission: 45, productCommission: 10, subscriptionCommission: 15, avatarColor: '#1E3A32' },
  { id: 'emp_2', barbershopId: BSP, name: 'Diego Santos', role: 'Barbeiro', phone: '(11) 98888-2020', email: 'diego@navalhadeouro.com', active: true, serviceCommission: 40, productCommission: 8, subscriptionCommission: 12, avatarColor: '#C9A227' },
  { id: 'emp_3', barbershopId: BSP, name: 'Bruno Lima', role: 'Barbeiro', phone: '(11) 98888-3030', email: 'bruno@navalhadeouro.com', active: true, serviceCommission: 42, productCommission: 8, subscriptionCommission: 12 },
  { id: 'emp_4', barbershopId: BSP, name: 'Carla Nunes', role: 'Recepção', phone: '(11) 98888-4040', email: 'carla@navalhadeouro.com', active: true, serviceCommission: 0, productCommission: 5, subscriptionCommission: 0 },
  { id: 'emp_5', barbershopId: BSP, name: 'Thiago Alves', role: 'Barbeiro', phone: '(11) 98888-5050', email: 'thiago@navalhadeouro.com', active: false, serviceCommission: 40, productCommission: 8, subscriptionCommission: 10 },
  { id: 'emp_6', barbershopId: BSP, name: 'Matheus Pires', role: 'Barbeiro Especialista', phone: '(11) 97777-6060', email: 'matheus@navalhadeouro.com', active: true, serviceCommission: 47, productCommission: 10, subscriptionCommission: 15, avatarColor: '#355E55' },
  { id: 'emp_7', barbershopId: BSP, name: 'João Victor', role: 'Barbeiro Júnior', phone: '(11) 97777-7070', email: 'joao@navalhadeouro.com', active: true, serviceCommission: 35, productCommission: 6, subscriptionCommission: 8, avatarColor: '#6B5E2E' },
  { id: 'emp_8', barbershopId: BSP, name: 'Renata Costa', role: 'Gerente', phone: '(11) 97777-8080', email: 'renata@navalhadeouro.com', active: true, serviceCommission: 0, productCommission: 4, subscriptionCommission: 4 },
]

export const clients: Client[] = [
  { id: 'cli_1', barbershopId: BSP, name: 'André Carvalho', phone: '(11) 99123-4567', email: 'andre@email.com', birthDate: '1990-07-15', address: 'Rua das Flores, 120', notes: 'Prefere tesoura, não gosta de máquina no topo.', tags: ['vip', 'recorrente', 'aniversariante'], totalSpent: 2840, visits: 32, lastVisit: todayISO(-4), favoriteService: 'Corte + Barba', preferredBarber: 'Rafael Moura', createdAt: '2023-02-10' },
  { id: 'cli_2', barbershopId: BSP, name: 'Marcelo Dias', phone: '(11) 99223-1122', email: 'marcelo@email.com', birthDate: '1985-03-22', address: 'Av. Paulista, 900', notes: '', tags: ['recorrente'], totalSpent: 1560, visits: 21, lastVisit: todayISO(-9), favoriteService: 'Corte Masculino', preferredBarber: 'Diego Santos', createdAt: '2023-05-02' },
  { id: 'cli_3', barbershopId: BSP, name: 'Felipe Rocha', phone: '(11) 99333-4455', email: 'felipe@email.com', birthDate: '1998-07-16', address: 'Rua Augusta, 45', notes: 'Cliente de assinatura mensal.', tags: ['vip', 'aniversariante'], totalSpent: 3210, visits: 40, lastVisit: todayISO(-1), favoriteService: 'Barba Premium', preferredBarber: 'Rafael Moura', createdAt: '2022-11-20' },
  { id: 'cli_4', barbershopId: BSP, name: 'Gustavo Prado', phone: '(11) 99444-7788', email: 'gustavo@email.com', birthDate: '1993-12-01', address: 'Rua Oscar Freire, 300', notes: 'Pagamento pendente da última comanda.', tags: ['inadimplente'], totalSpent: 640, visits: 8, lastVisit: todayISO(-15), favoriteService: 'Corte Masculino', preferredBarber: 'Bruno Lima', createdAt: '2024-01-14' },
  { id: 'cli_5', barbershopId: BSP, name: 'Rodrigo Teixeira', phone: '(11) 99555-9900', email: 'rodrigo@email.com', birthDate: '1988-09-09', address: 'Rua Haddock Lobo, 88', notes: '', tags: ['inativo'], totalSpent: 420, visits: 5, lastVisit: todayISO(-72), favoriteService: 'Corte + Barba', preferredBarber: 'Diego Santos', createdAt: '2023-08-30' },
  { id: 'cli_6', barbershopId: BSP, name: 'Lucas Fernandes', phone: '(11) 99666-2233', email: 'lucas@email.com', birthDate: '1995-07-14', address: 'Rua Pamplona, 700', notes: 'Alérgico a alguns produtos com álcool.', tags: ['recorrente', 'aniversariante'], totalSpent: 1980, visits: 26, lastVisit: todayISO(-2), favoriteService: 'Corte Degradê', preferredBarber: 'Bruno Lima', createdAt: '2023-03-19' },
  { id: 'cli_7', barbershopId: BSP, name: 'Paulo Henrique', phone: '(11) 99777-3344', email: 'paulo@email.com', birthDate: '1979-06-25', address: 'Av. Rebouças, 1500', notes: '', tags: ['vip', 'recorrente'], totalSpent: 4120, visits: 51, lastVisit: todayISO(-3), favoriteService: 'Corte + Barba', preferredBarber: 'Rafael Moura', createdAt: '2022-06-01' },
  { id: 'cli_8', barbershopId: BSP, name: 'Vinícius Barros', phone: '(11) 99888-5566', email: 'vinicius@email.com', birthDate: '2000-02-28', address: 'Rua Teodoro Sampaio, 220', notes: '', tags: ['inativo'], totalSpent: 260, visits: 3, lastVisit: todayISO(-95), favoriteService: 'Corte Masculino', preferredBarber: 'Thiago Alves', createdAt: '2024-02-11' },
  { id: 'cli_9', barbershopId: BSP, name: 'Eduardo Ramos', phone: '(11) 99999-6677', email: 'eduardo@email.com', birthDate: '1991-11-05', address: 'Rua Cardeal Arcoverde, 400', notes: '', tags: ['recorrente'], totalSpent: 1340, visits: 18, lastVisit: todayISO(-6), favoriteService: 'Barba', preferredBarber: 'Diego Santos', createdAt: '2023-07-07' },
  { id: 'cli_10', barbershopId: BSP, name: 'Sérgio Moreira', phone: '(11) 99000-7788', email: 'sergio@email.com', birthDate: '1983-04-18', address: 'Rua Fradique Coutinho, 55', notes: 'Cliente novo, primeira visita recente.', tags: [], totalSpent: 90, visits: 1, lastVisit: todayISO(-1), favoriteService: 'Corte Masculino', preferredBarber: 'Bruno Lima', createdAt: todayISO(-1) },
]

clients.push(
  { id: 'cli_11', barbershopId: BSP, name: 'Henrique Azevedo', phone: '(11) 98111-1111', email: 'henrique@email.com', birthDate: '1987-07-20', address: 'Rua Harmonia, 210', notes: 'Gosta de degradê baixo e barba desenhada.', tags: ['vip', 'recorrente', 'aniversariante'], totalSpent: 5120, visits: 63, lastVisit: todayISO(0), favoriteService: 'Corte Degradê', preferredBarber: 'Matheus Pires', createdAt: '2021-09-12' },
  { id: 'cli_12', barbershopId: BSP, name: 'Caio Martins', phone: '(11) 98111-1212', email: 'caio@email.com', birthDate: '1996-05-04', address: 'Rua Mourato Coelho, 678', notes: 'Sempre compra finalizador.', tags: ['recorrente'], totalSpent: 2145, visits: 28, lastVisit: todayISO(-5), favoriteService: 'Corte Masculino', preferredBarber: 'Diego Santos', createdAt: '2022-04-18' },
  { id: 'cli_13', barbershopId: BSP, name: 'Otávio Rezende', phone: '(11) 98111-1313', email: 'otavio@email.com', birthDate: '1975-08-30', address: 'Av. Angélica, 1440', notes: 'Atendimento rápido no horário de almoço.', tags: ['vip'], totalSpent: 3820, visits: 44, lastVisit: todayISO(-8), favoriteService: 'Barba Premium', preferredBarber: 'Rafael Moura', createdAt: '2020-12-03' },
  { id: 'cli_14', barbershopId: BSP, name: 'Murilo Farias', phone: '(11) 98111-1414', email: 'murilo@email.com', birthDate: '1999-10-11', address: 'Rua Aspicuelta, 98', notes: 'Primeira visita veio por indicação.', tags: [], totalSpent: 150, visits: 2, lastVisit: todayISO(-3), favoriteService: 'Corte + Barba', preferredBarber: 'João Victor', createdAt: todayISO(-3) },
  { id: 'cli_15', barbershopId: BSP, name: 'Leonardo Bueno', phone: '(11) 98111-1515', email: 'leonardo@email.com', birthDate: '1992-07-22', address: 'Rua Bela Cintra, 901', notes: 'Assinatura vencida, cobrar com delicadeza.', tags: ['inadimplente', 'aniversariante'], totalSpent: 1240, visits: 17, lastVisit: todayISO(-21), favoriteService: 'Corte Masculino', preferredBarber: 'Bruno Lima', createdAt: '2023-01-22' },
  { id: 'cli_16', barbershopId: BSP, name: 'Ramon Tavares', phone: '(11) 98111-1616', email: 'ramon@email.com', birthDate: '1989-02-09', address: 'Rua Estados Unidos, 330', notes: '', tags: ['recorrente'], totalSpent: 2880, visits: 36, lastVisit: todayISO(-7), favoriteService: 'Corte + Barba', preferredBarber: 'Matheus Pires', createdAt: '2021-05-30' },
  { id: 'cli_17', barbershopId: BSP, name: 'Danilo Correia', phone: '(11) 98111-1717', email: 'danilo@email.com', birthDate: '1982-12-18', address: 'Av. Sumaré, 124', notes: 'Cliente inativo há meses, reativação com cupom.', tags: ['inativo'], totalSpent: 780, visits: 9, lastVisit: todayISO(-128), favoriteService: 'Barba', preferredBarber: 'Diego Santos', createdAt: '2022-08-14' },
  { id: 'cli_18', barbershopId: BSP, name: 'Alex Nogueira', phone: '(11) 98111-1818', email: 'alex@email.com', birthDate: '1994-04-02', address: 'Rua Capote Valente, 455', notes: 'Prefere atendimento no fim do dia.', tags: ['recorrente'], totalSpent: 1660, visits: 22, lastVisit: todayISO(-4), favoriteService: 'Corte Degradê', preferredBarber: 'João Victor', createdAt: '2023-11-07' },
  { id: 'cli_19', barbershopId: BSP, name: 'Vitor Almeida', phone: '(11) 98111-1919', email: 'vitor@email.com', birthDate: '2001-07-18', address: 'Rua Wisard, 82', notes: 'Cliente novo, potencial assinatura.', tags: ['aniversariante'], totalSpent: 70, visits: 1, lastVisit: todayISO(0), favoriteService: 'Corte Degradê', preferredBarber: 'João Victor', createdAt: todayISO(0) },
  { id: 'cli_20', barbershopId: BSP, name: 'Samuel Lopes', phone: '(11) 98111-2020', email: 'samuel@email.com', birthDate: '1984-01-27', address: 'Rua Girassol, 511', notes: '', tags: ['vip', 'recorrente'], totalSpent: 4365, visits: 55, lastVisit: todayISO(-2), favoriteService: 'Barba Premium', preferredBarber: 'Rafael Moura', createdAt: '2020-03-09' },
  { id: 'cli_21', barbershopId: BSP, name: 'Igor Batista', phone: '(11) 98111-2121', email: 'igor@email.com', birthDate: '1997-09-14', address: 'Rua Heitor Penteado, 870', notes: 'Sem preferência de barbeiro.', tags: [], totalSpent: 520, visits: 7, lastVisit: todayISO(-13), favoriteService: 'Pezinho', preferredBarber: 'Diego Santos', createdAt: '2024-06-10' },
  { id: 'cli_22', barbershopId: BSP, name: 'Jhonathan Michaeli', phone: '(11) 98111-2222', email: 'jhonathan@email.com', birthDate: '1990-11-09', address: 'Rua Cardoso de Almeida, 410', notes: 'Renovar plano esta semana.', tags: ['recorrente'], totalSpent: 1988, visits: 24, lastVisit: todayISO(-6), favoriteService: 'Corte + Barba', preferredBarber: 'Matheus Pires', createdAt: '2022-10-10' },
  { id: 'cli_23', barbershopId: BSP, name: 'Leandro Serqueira', phone: '(11) 98111-2323', email: 'leandro@email.com', birthDate: '1986-03-01', address: 'Rua Turiassu, 211', notes: 'Plano vence em breve.', tags: ['recorrente'], totalSpent: 2450, visits: 30, lastVisit: todayISO(-1), favoriteService: 'Corte + Barba', preferredBarber: 'Rafael Moura', createdAt: '2021-12-01' },
  { id: 'cli_24', barbershopId: BSP, name: 'Victor Hugo Carvalho', phone: '(11) 98111-2424', email: 'victorhugo@email.com', birthDate: '1993-06-06', address: 'Rua Cayowaá, 39', notes: 'Gosta de acabamento navalhado.', tags: ['vip'], totalSpent: 3105, visits: 38, lastVisit: todayISO(-10), favoriteService: 'Corte Degradê', preferredBarber: 'Bruno Lima', createdAt: '2022-02-17' },
)

export const catalog: CatalogItem[] = [
  // Serviços
  { id: 'svc_1', barbershopId: BSP, type: 'servico', name: 'Corte Masculino', category: 'Cabelo', price: 60, cost: 8, durationMin: 40, commission: 45, active: true },
  { id: 'svc_2', barbershopId: BSP, type: 'servico', name: 'Corte Degradê', category: 'Cabelo', price: 70, cost: 8, durationMin: 45, commission: 45, active: true },
  { id: 'svc_3', barbershopId: BSP, type: 'servico', name: 'Barba', category: 'Barba', price: 45, cost: 6, durationMin: 30, commission: 45, active: true },
  { id: 'svc_4', barbershopId: BSP, type: 'servico', name: 'Barba Premium', category: 'Barba', price: 65, cost: 10, durationMin: 40, commission: 50, active: true },
  { id: 'svc_5', barbershopId: BSP, type: 'servico', name: 'Corte + Barba', category: 'Combo', price: 100, cost: 14, durationMin: 70, commission: 48, active: true },
  { id: 'svc_6', barbershopId: BSP, type: 'servico', name: 'Sobrancelha', category: 'Estética', price: 25, cost: 3, durationMin: 15, commission: 40, active: true },
  { id: 'svc_7', barbershopId: BSP, type: 'servico', name: 'Pezinho', category: 'Cabelo', price: 20, cost: 2, durationMin: 15, commission: 40, active: false },
  // Produtos
  { id: 'prd_1', barbershopId: BSP, type: 'produto', name: 'Pomada Modeladora Matte', category: 'Finalização', price: 45, cost: 22, stock: 24, minStock: 10, commission: 10, active: true },
  { id: 'prd_2', barbershopId: BSP, type: 'produto', name: 'Óleo para Barba 30ml', category: 'Barba', price: 55, cost: 26, stock: 6, minStock: 8, commission: 10, active: true },
  { id: 'prd_3', barbershopId: BSP, type: 'produto', name: 'Shampoo Anticaspa 250ml', category: 'Cabelo', price: 38, cost: 18, stock: 18, minStock: 6, commission: 8, active: true },
  { id: 'prd_4', barbershopId: BSP, type: 'produto', name: 'Cera Fixação Forte', category: 'Finalização', price: 42, cost: 20, stock: 3, minStock: 8, commission: 10, active: true },
  { id: 'prd_5', barbershopId: BSP, type: 'produto', name: 'Balm Pós-Barba', category: 'Barba', price: 48, cost: 23, stock: 14, minStock: 6, commission: 10, active: true },
  { id: 'prd_6', barbershopId: BSP, type: 'produto', name: 'Kit Barba Completo', category: 'Kits', price: 120, cost: 62, stock: 2, minStock: 5, commission: 12, active: true },
]

catalog.push(
  { id: 'svc_8', barbershopId: BSP, type: 'servico', name: 'Pigmentação de Barba', category: 'Barba', price: 80, cost: 18, durationMin: 50, commission: 45, active: true },
  { id: 'svc_9', barbershopId: BSP, type: 'servico', name: 'Relaxamento Capilar', category: 'Cabelo', price: 95, cost: 32, durationMin: 60, commission: 40, active: true },
  { id: 'svc_10', barbershopId: BSP, type: 'servico', name: 'Luzes Masculinas', category: 'Química', price: 180, cost: 70, durationMin: 120, commission: 35, active: true },
  { id: 'svc_11', barbershopId: BSP, type: 'servico', name: 'Tratamento Capilar', category: 'Cabelo', price: 75, cost: 24, durationMin: 45, commission: 40, active: true },
  { id: 'prd_7', barbershopId: BSP, type: 'produto', name: 'Minoxidil Barba 60ml', category: 'Tratamento', price: 89, cost: 45, stock: 9, minStock: 8, commission: 10, active: true },
  { id: 'prd_8', barbershopId: BSP, type: 'produto', name: 'Pente Madeira Antiestático', category: 'Acessórios', price: 28, cost: 9, stock: 31, minStock: 12, commission: 8, active: true },
  { id: 'prd_9', barbershopId: BSP, type: 'produto', name: 'Shampoo Antiqueda 300ml', category: 'Tratamento', price: 64, cost: 31, stock: 4, minStock: 10, commission: 10, active: true },
  { id: 'prd_10', barbershopId: BSP, type: 'produto', name: 'Condicionador Hidratante', category: 'Cabelo', price: 46, cost: 21, stock: 17, minStock: 7, commission: 8, active: true },
  { id: 'prd_11', barbershopId: BSP, type: 'produto', name: 'Gel Fixação Forte', category: 'Finalização', price: 34, cost: 14, stock: 5, minStock: 9, commission: 9, active: true },
  { id: 'prd_12', barbershopId: BSP, type: 'produto', name: 'Toalha Premium BarberHub', category: 'Acessórios', price: 39, cost: 18, stock: 0, minStock: 6, commission: 5, active: false },
)

const times = ['08:30', '09:15', '10:00', '10:45', '11:30', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']
const apptStatuses: Appointment['status'][] = ['concluido', 'concluido', 'chegou', 'confirmado', 'agendado', 'agendado', 'agendado', 'confirmado', 'agendado', 'cancelado', 'faltou']

export const appointments: Appointment[] = times.map((start, i) => {
  const client = clients[i % clients.length]
  const emp = employees[i % 3]
  const svc = catalog.filter((c) => c.type === 'servico')[i % 6]
  return {
    id: `apt_${i + 1}`,
    barbershopId: BSP,
    clientId: client.id,
    clientName: client.name,
    employeeId: emp.id,
    employeeName: emp.name,
    serviceId: svc.id,
    serviceName: svc.name,
    date: todayISO(0),
    start,
    durationMin: svc.durationMin ?? 40,
    status: apptStatuses[i],
    price: svc.price,
  }
})

// Alguns agendamentos nos próximos dias
appointments.push(
  { id: 'apt_20', barbershopId: BSP, clientId: 'cli_3', clientName: 'Felipe Rocha', employeeId: 'emp_1', employeeName: 'Rafael Moura', serviceId: 'svc_5', serviceName: 'Corte + Barba', date: todayISO(1), start: '09:00', durationMin: 70, status: 'confirmado', price: 100 },
  { id: 'apt_21', barbershopId: BSP, clientId: 'cli_7', clientName: 'Paulo Henrique', employeeId: 'emp_2', employeeName: 'Diego Santos', serviceId: 'svc_1', serviceName: 'Corte Masculino', date: todayISO(1), start: '10:30', durationMin: 40, status: 'agendado', price: 60 },
  { id: 'apt_22', barbershopId: BSP, clientId: 'cli_6', clientName: 'Lucas Fernandes', employeeId: 'emp_3', employeeName: 'Bruno Lima', serviceId: 'svc_2', serviceName: 'Corte Degradê', date: todayISO(2), start: '14:00', durationMin: 45, status: 'agendado', price: 70 },
)

const extraAppointmentPlan: Array<{ day: number; start: string; clientId: string; employeeId: string; serviceId: string; status: Appointment['status'] }> = [
  { day: -6, start: '09:00', clientId: 'cli_11', employeeId: 'emp_6', serviceId: 'svc_2', status: 'concluido' },
  { day: -6, start: '10:00', clientId: 'cli_12', employeeId: 'emp_2', serviceId: 'svc_1', status: 'concluido' },
  { day: -5, start: '11:00', clientId: 'cli_13', employeeId: 'emp_1', serviceId: 'svc_4', status: 'concluido' },
  { day: -5, start: '14:30', clientId: 'cli_14', employeeId: 'emp_7', serviceId: 'svc_5', status: 'cancelado' },
  { day: -4, start: '15:00', clientId: 'cli_16', employeeId: 'emp_6', serviceId: 'svc_8', status: 'concluido' },
  { day: -4, start: '17:00', clientId: 'cli_18', employeeId: 'emp_7', serviceId: 'svc_2', status: 'faltou' },
  { day: -3, start: '09:30', clientId: 'cli_20', employeeId: 'emp_1', serviceId: 'svc_4', status: 'concluido' },
  { day: -3, start: '13:30', clientId: 'cli_21', employeeId: 'emp_2', serviceId: 'svc_7', status: 'concluido' },
  { day: -2, start: '08:30', clientId: 'cli_22', employeeId: 'emp_6', serviceId: 'svc_5', status: 'concluido' },
  { day: -2, start: '16:30', clientId: 'cli_23', employeeId: 'emp_1', serviceId: 'svc_9', status: 'concluido' },
  { day: -1, start: '09:00', clientId: 'cli_24', employeeId: 'emp_3', serviceId: 'svc_2', status: 'concluido' },
  { day: -1, start: '18:30', clientId: 'cli_15', employeeId: 'emp_3', serviceId: 'svc_1', status: 'cancelado' },
  { day: 0, start: '12:15', clientId: 'cli_11', employeeId: 'emp_6', serviceId: 'svc_10', status: 'confirmado' },
  { day: 0, start: '18:45', clientId: 'cli_19', employeeId: 'emp_7', serviceId: 'svc_2', status: 'agendado' },
  { day: 1, start: '13:00', clientId: 'cli_12', employeeId: 'emp_2', serviceId: 'svc_3', status: 'confirmado' },
  { day: 1, start: '16:00', clientId: 'cli_20', employeeId: 'emp_1', serviceId: 'svc_8', status: 'agendado' },
  { day: 2, start: '09:30', clientId: 'cli_22', employeeId: 'emp_6', serviceId: 'svc_5', status: 'confirmado' },
  { day: 3, start: '10:00', clientId: 'cli_23', employeeId: 'emp_1', serviceId: 'svc_4', status: 'agendado' },
  { day: 4, start: '14:30', clientId: 'cli_13', employeeId: 'emp_1', serviceId: 'svc_11', status: 'agendado' },
  { day: 7, start: '15:00', clientId: 'cli_18', employeeId: 'emp_7', serviceId: 'svc_2', status: 'agendado' },
]

appointments.push(
  ...extraAppointmentPlan.map((item, index) => {
    const client = clients.find((c) => c.id === item.clientId)!
    const employee = employees.find((e) => e.id === item.employeeId)!
    const service = catalog.find((c) => c.id === item.serviceId)!
    return {
      id: `apt_extra_${index + 1}`,
      barbershopId: BSP,
      clientId: client.id,
      clientName: client.name,
      employeeId: employee.id,
      employeeName: employee.name,
      serviceId: service.id,
      serviceName: service.name,
      date: todayISO(item.day),
      start: item.start,
      durationMin: service.durationMin ?? 40,
      status: item.status,
      price: service.price,
    }
  }),
)

export const orders: Order[] = [
  { id: 'ord_1', barbershopId: BSP, number: 1042, clientId: 'cli_1', clientName: 'André Carvalho', employeeId: 'emp_1', employeeName: 'Rafael Moura', items: [{ id: 'oi_1', refId: 'svc_5', type: 'servico', name: 'Corte + Barba', quantity: 1, unitPrice: 100 }, { id: 'oi_2', refId: 'prd_1', type: 'produto', name: 'Pomada Modeladora Matte', quantity: 1, unitPrice: 45 }], discount: 10, surcharge: 0, status: 'paga', method: 'pix', total: 135, createdAt: todayISO(0) },
  { id: 'ord_2', barbershopId: BSP, number: 1043, clientId: 'cli_6', clientName: 'Lucas Fernandes', employeeId: 'emp_3', employeeName: 'Bruno Lima', items: [{ id: 'oi_3', refId: 'svc_2', type: 'servico', name: 'Corte Degradê', quantity: 1, unitPrice: 70 }], discount: 0, surcharge: 0, status: 'paga', method: 'credito', total: 70, createdAt: todayISO(0) },
  { id: 'ord_3', barbershopId: BSP, number: 1044, clientId: undefined, clientName: 'Cliente avulso', employeeId: 'emp_2', employeeName: 'Diego Santos', items: [{ id: 'oi_4', refId: 'svc_1', type: 'servico', name: 'Corte Masculino', quantity: 1, unitPrice: 60 }], discount: 0, surcharge: 0, status: 'aberta', total: 60, createdAt: todayISO(0) },
  { id: 'ord_4', barbershopId: BSP, number: 1045, clientId: 'cli_4', clientName: 'Gustavo Prado', employeeId: 'emp_3', employeeName: 'Bruno Lima', items: [{ id: 'oi_5', refId: 'svc_5', type: 'servico', name: 'Corte + Barba', quantity: 1, unitPrice: 100 }], discount: 0, surcharge: 0, status: 'pendente', total: 100, createdAt: todayISO(0) },
  { id: 'ord_5', barbershopId: BSP, number: 1046, clientId: 'cli_7', clientName: 'Paulo Henrique', employeeId: 'emp_1', employeeName: 'Rafael Moura', items: [{ id: 'oi_6', refId: 'svc_4', type: 'servico', name: 'Barba Premium', quantity: 1, unitPrice: 65 }, { id: 'oi_7', refId: 'prd_5', type: 'produto', name: 'Balm Pós-Barba', quantity: 1, unitPrice: 48 }], discount: 0, surcharge: 0, status: 'paga', method: 'debito', total: 113, createdAt: todayISO(0) },
  { id: 'ord_6', barbershopId: BSP, number: 1041, clientId: 'cli_9', clientName: 'Eduardo Ramos', employeeId: 'emp_2', employeeName: 'Diego Santos', items: [{ id: 'oi_8', refId: 'svc_3', type: 'servico', name: 'Barba', quantity: 1, unitPrice: 45 }], discount: 0, surcharge: 0, status: 'cancelada', total: 45, createdAt: todayISO(-1) },
]

orders.push(
  { id: 'ord_7', barbershopId: BSP, number: 1047, clientId: 'cli_11', clientName: 'Henrique Azevedo', employeeId: 'emp_6', employeeName: 'Matheus Pires', items: [{ id: 'oi_9', refId: 'svc_10', type: 'servico', name: 'Luzes Masculinas', quantity: 1, unitPrice: 180 }, { id: 'oi_10', refId: 'prd_7', type: 'produto', name: 'Minoxidil Barba 60ml', quantity: 1, unitPrice: 89 }], discount: 20, surcharge: 0, status: 'aberta', total: 249, createdAt: todayISO(0) },
  { id: 'ord_8', barbershopId: BSP, number: 1048, clientId: 'cli_19', clientName: 'Vitor Almeida', employeeId: 'emp_7', employeeName: 'João Victor', items: [{ id: 'oi_11', refId: 'svc_2', type: 'servico', name: 'Corte Degradê', quantity: 1, unitPrice: 70 }], discount: 0, surcharge: 0, status: 'paga', method: 'pix', total: 70, createdAt: todayISO(0) },
  { id: 'ord_9', barbershopId: BSP, number: 1049, clientId: 'cli_20', clientName: 'Samuel Lopes', employeeId: 'emp_1', employeeName: 'Rafael Moura', items: [{ id: 'oi_12', refId: 'svc_4', type: 'servico', name: 'Barba Premium', quantity: 1, unitPrice: 65 }, { id: 'oi_13', refId: 'prd_2', type: 'produto', name: 'Óleo para Barba 30ml', quantity: 1, unitPrice: 55 }], discount: 0, surcharge: 0, status: 'paga', method: 'credito', total: 120, createdAt: todayISO(0) },
  { id: 'ord_10', barbershopId: BSP, number: 1050, clientId: 'cli_15', clientName: 'Leonardo Bueno', employeeId: 'emp_3', employeeName: 'Bruno Lima', items: [{ id: 'oi_14', refId: 'svc_1', type: 'servico', name: 'Corte Masculino', quantity: 1, unitPrice: 60 }], discount: 0, surcharge: 0, status: 'pendente', total: 60, createdAt: todayISO(0) },
  { id: 'ord_11', barbershopId: BSP, number: 1038, clientId: 'cli_22', clientName: 'Jhonathan Michaeli', employeeId: 'emp_6', employeeName: 'Matheus Pires', items: [{ id: 'oi_15', refId: 'svc_5', type: 'servico', name: 'Corte + Barba', quantity: 1, unitPrice: 100 }, { id: 'oi_16', refId: 'prd_1', type: 'produto', name: 'Pomada Modeladora Matte', quantity: 1, unitPrice: 45 }], discount: 0, surcharge: 0, status: 'paga', method: 'debito', total: 145, createdAt: todayISO(-1) },
  { id: 'ord_12', barbershopId: BSP, number: 1037, clientId: 'cli_23', clientName: 'Leandro Serqueira', employeeId: 'emp_1', employeeName: 'Rafael Moura', items: [{ id: 'oi_17', refId: 'svc_9', type: 'servico', name: 'Relaxamento Capilar', quantity: 1, unitPrice: 95 }], discount: 0, surcharge: 0, status: 'paga', method: 'pix', total: 95, createdAt: todayISO(-2) },
  { id: 'ord_13', barbershopId: BSP, number: 1036, clientId: 'cli_16', clientName: 'Ramon Tavares', employeeId: 'emp_6', employeeName: 'Matheus Pires', items: [{ id: 'oi_18', refId: 'svc_8', type: 'servico', name: 'Pigmentação de Barba', quantity: 1, unitPrice: 80 }, { id: 'oi_19', refId: 'prd_8', type: 'produto', name: 'Pente Madeira Antiestático', quantity: 2, unitPrice: 28 }], discount: 6, surcharge: 0, status: 'paga', method: 'dinheiro', total: 130, createdAt: todayISO(-4) },
  { id: 'ord_14', barbershopId: BSP, number: 1035, clientId: 'cli_13', clientName: 'Otávio Rezende', employeeId: 'emp_1', employeeName: 'Rafael Moura', items: [{ id: 'oi_20', refId: 'svc_4', type: 'servico', name: 'Barba Premium', quantity: 1, unitPrice: 65 }, { id: 'oi_21', refId: 'prd_5', type: 'produto', name: 'Balm Pós-Barba', quantity: 1, unitPrice: 48 }], discount: 0, surcharge: 0, status: 'paga', method: 'credito', total: 113, createdAt: todayISO(-5) },
  { id: 'ord_15', barbershopId: BSP, number: 1034, clientId: 'cli_12', clientName: 'Caio Martins', employeeId: 'emp_2', employeeName: 'Diego Santos', items: [{ id: 'oi_22', refId: 'svc_1', type: 'servico', name: 'Corte Masculino', quantity: 1, unitPrice: 60 }, { id: 'oi_23', refId: 'prd_10', type: 'produto', name: 'Condicionador Hidratante', quantity: 1, unitPrice: 46 }], discount: 0, surcharge: 0, status: 'paga', method: 'pix', total: 106, createdAt: todayISO(-6) },
  { id: 'ord_16', barbershopId: BSP, number: 1033, clientId: 'cli_18', clientName: 'Alex Nogueira', employeeId: 'emp_7', employeeName: 'João Victor', items: [{ id: 'oi_24', refId: 'svc_2', type: 'servico', name: 'Corte Degradê', quantity: 1, unitPrice: 70 }], discount: 0, surcharge: 0, status: 'cancelada', total: 70, createdAt: todayISO(-4) },
)

export const plans: Plan[] = [
  { id: 'pln_1', barbershopId: BSP, name: 'Clube do Corte Mensal', price: 149, type: 'mensal', description: 'Cortes ilimitados + 10% em produtos.', active: true },
  { id: 'pln_2', barbershopId: BSP, name: 'Pacote 4 Cortes', price: 200, type: 'pacote', credits: 4, description: '4 cortes para usar em até 90 dias.', active: true },
  { id: 'pln_3', barbershopId: BSP, name: 'Premium Barba & Cabelo', price: 249, type: 'mensal', description: 'Corte + barba ilimitados + 1 produto/mês.', active: true },
  { id: 'pln_4', barbershopId: BSP, name: 'Créditos Avulsos', price: 300, type: 'creditos', credits: 6, description: '6 créditos de serviço para usar quando quiser.', active: false },
  { id: 'pln_5', barbershopId: BSP, name: 'Plano Pai & Filho', price: 319, type: 'mensal', description: 'Dois clientes vinculados com 4 cortes e 2 barbas no mês.', active: true },
  { id: 'pln_6', barbershopId: BSP, name: 'Pré-pago Executivo', price: 420, type: 'creditos', credits: 8, description: 'Créditos flexíveis para agenda executiva e atendimento prioritário.', active: true },
]

export const subscriptions: Subscription[] = [
  { id: 'sub_1', barbershopId: BSP, planId: 'pln_1', planName: 'Clube do Corte Mensal', clientId: 'cli_1', clientName: 'André Carvalho', price: 149, startDate: todayISO(-20), dueDate: todayISO(10), status: 'ativo' },
  { id: 'sub_2', barbershopId: BSP, planId: 'pln_3', planName: 'Premium Barba & Cabelo', clientId: 'cli_3', clientName: 'Felipe Rocha', price: 249, startDate: todayISO(-27), dueDate: todayISO(3), status: 'vencendo' },
  { id: 'sub_3', barbershopId: BSP, planId: 'pln_2', planName: 'Pacote 4 Cortes', clientId: 'cli_7', clientName: 'Paulo Henrique', price: 200, startDate: todayISO(-40), dueDate: todayISO(50), status: 'ativo', creditsUsed: 1, creditsTotal: 4 },
  { id: 'sub_4', barbershopId: BSP, planId: 'pln_1', planName: 'Clube do Corte Mensal', clientId: 'cli_6', clientName: 'Lucas Fernandes', price: 149, startDate: todayISO(-35), dueDate: todayISO(-5), status: 'vencido' },
  { id: 'sub_5', barbershopId: BSP, planId: 'pln_3', planName: 'Premium Barba & Cabelo', clientId: 'cli_9', clientName: 'Eduardo Ramos', price: 249, startDate: todayISO(-60), dueDate: todayISO(-30), status: 'cancelado' },
  { id: 'sub_6', barbershopId: BSP, planId: 'pln_1', planName: 'Clube do Corte Mensal', clientId: 'cli_2', clientName: 'Marcelo Dias', price: 149, startDate: todayISO(-10), dueDate: todayISO(20), status: 'ativo' },
]

subscriptions.push(
  { id: 'sub_7', barbershopId: BSP, planId: 'pln_3', planName: 'Premium Barba & Cabelo', clientId: 'cli_11', clientName: 'Henrique Azevedo', price: 249, startDate: todayISO(-12), dueDate: todayISO(18), status: 'ativo' },
  { id: 'sub_8', barbershopId: BSP, planId: 'pln_1', planName: 'Clube do Corte Mensal', clientId: 'cli_22', clientName: 'Jhonathan Michaeli', price: 149, startDate: todayISO(-28), dueDate: todayISO(1), status: 'vencendo' },
  { id: 'sub_9', barbershopId: BSP, planId: 'pln_1', planName: 'Clube do Corte Mensal', clientId: 'cli_23', clientName: 'Leandro Serqueira', price: 149, startDate: todayISO(-27), dueDate: todayISO(1), status: 'vencendo' },
  { id: 'sub_10', barbershopId: BSP, planId: 'pln_3', planName: 'Premium Barba & Cabelo', clientId: 'cli_24', clientName: 'Victor Hugo Carvalho', price: 249, startDate: todayISO(-25), dueDate: todayISO(2), status: 'vencendo' },
  { id: 'sub_11', barbershopId: BSP, planId: 'pln_2', planName: 'Pacote 4 Cortes', clientId: 'cli_20', clientName: 'Samuel Lopes', price: 200, startDate: todayISO(-18), dueDate: todayISO(45), status: 'ativo', creditsUsed: 3, creditsTotal: 4 },
  { id: 'sub_12', barbershopId: BSP, planId: 'pln_5', planName: 'Plano Pai & Filho', clientId: 'cli_13', clientName: 'Otávio Rezende', price: 319, startDate: todayISO(-42), dueDate: todayISO(-2), status: 'vencido' },
  { id: 'sub_13', barbershopId: BSP, planId: 'pln_6', planName: 'Pré-pago Executivo', clientId: 'cli_16', clientName: 'Ramon Tavares', price: 420, startDate: todayISO(-15), dueDate: todayISO(75), status: 'ativo', creditsUsed: 2, creditsTotal: 8 },
  { id: 'sub_14', barbershopId: BSP, planId: 'pln_1', planName: 'Clube do Corte Mensal', clientId: 'cli_15', clientName: 'Leonardo Bueno', price: 149, startDate: todayISO(-50), dueDate: todayISO(-14), status: 'vencido' },
)

export const commissions: Commission[] = [
  { id: 'com_1', barbershopId: BSP, employeeId: 'emp_1', employeeName: 'Rafael Moura', origin: 'servico', reference: 'Comanda #1042', base: 100, rate: 48, amount: 48, status: 'pendente', date: todayISO(0) },
  { id: 'com_2', barbershopId: BSP, employeeId: 'emp_1', employeeName: 'Rafael Moura', origin: 'produto', reference: 'Comanda #1042', base: 45, rate: 10, amount: 4.5, status: 'pendente', date: todayISO(0) },
  { id: 'com_3', barbershopId: BSP, employeeId: 'emp_3', employeeName: 'Bruno Lima', origin: 'servico', reference: 'Comanda #1043', base: 70, rate: 42, amount: 29.4, status: 'pendente', date: todayISO(0) },
  { id: 'com_4', barbershopId: BSP, employeeId: 'emp_1', employeeName: 'Rafael Moura', origin: 'servico', reference: 'Comanda #1046', base: 65, rate: 50, amount: 32.5, status: 'pendente', date: todayISO(0) },
  { id: 'com_5', barbershopId: BSP, employeeId: 'emp_2', employeeName: 'Diego Santos', origin: 'servico', reference: 'Comanda #1039', base: 60, rate: 40, amount: 24, status: 'paga', date: todayISO(-2) },
  { id: 'com_6', barbershopId: BSP, employeeId: 'emp_1', employeeName: 'Rafael Moura', origin: 'assinatura', reference: 'Clube do Corte Mensal', base: 149, rate: 15, amount: 22.35, status: 'paga', date: todayISO(-3) },
  { id: 'com_7', barbershopId: BSP, employeeId: 'emp_3', employeeName: 'Bruno Lima', origin: 'servico', reference: 'Comanda #1040', base: 100, rate: 42, amount: 42, status: 'paga', date: todayISO(-4) },
]

commissions.push(
  { id: 'com_8', barbershopId: BSP, employeeId: 'emp_6', employeeName: 'Matheus Pires', origin: 'servico', reference: 'Comanda #1047', base: 180, rate: 35, amount: 63, status: 'pendente', date: todayISO(0) },
  { id: 'com_9', barbershopId: BSP, employeeId: 'emp_7', employeeName: 'João Victor', origin: 'servico', reference: 'Comanda #1048', base: 70, rate: 35, amount: 24.5, status: 'pendente', date: todayISO(0) },
  { id: 'com_10', barbershopId: BSP, employeeId: 'emp_1', employeeName: 'Rafael Moura', origin: 'produto', reference: 'Comanda #1049', base: 55, rate: 10, amount: 5.5, status: 'pendente', date: todayISO(0) },
  { id: 'com_11', barbershopId: BSP, employeeId: 'emp_6', employeeName: 'Matheus Pires', origin: 'servico', reference: 'Comanda #1038', base: 100, rate: 47, amount: 47, status: 'paga', date: todayISO(-1) },
  { id: 'com_12', barbershopId: BSP, employeeId: 'emp_1', employeeName: 'Rafael Moura', origin: 'assinatura', reference: 'Premium Barba & Cabelo', base: 249, rate: 15, amount: 37.35, status: 'paga', date: todayISO(-2) },
  { id: 'com_13', barbershopId: BSP, employeeId: 'emp_2', employeeName: 'Diego Santos', origin: 'produto', reference: 'Comanda #1034', base: 46, rate: 8, amount: 3.68, status: 'paga', date: todayISO(-6) },
  { id: 'com_14', barbershopId: BSP, employeeId: 'emp_7', employeeName: 'João Victor', origin: 'servico', reference: 'Comanda #1033', base: 70, rate: 35, amount: 24.5, status: 'pendente', date: todayISO(-4) },
)

export const financialEntries: FinancialEntry[] = [
  { id: 'fin_1', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1042', amount: 135, method: 'pix', date: todayISO(0) },
  { id: 'fin_2', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1043', amount: 70, method: 'credito', date: todayISO(0) },
  { id: 'fin_3', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1046', amount: 113, method: 'debito', date: todayISO(0) },
  { id: 'fin_4', barbershopId: BSP, type: 'entrada', category: 'Assinaturas', description: 'Clube do Corte Mensal - André', amount: 149, method: 'pix', date: todayISO(-1) },
  { id: 'fin_5', barbershopId: BSP, type: 'saida', category: 'Estoque', description: 'Reposição de produtos', amount: 480, method: 'pix', date: todayISO(-1) },
  { id: 'fin_6', barbershopId: BSP, type: 'saida', category: 'Comissões', description: 'Pagamento comissões semana', amount: 620, method: 'pix', date: todayISO(-2) },
  { id: 'fin_7', barbershopId: BSP, type: 'saida', category: 'Fixos', description: 'Aluguel', amount: 3200, method: 'outro', date: todayISO(-5) },
  { id: 'fin_8', barbershopId: BSP, type: 'entrada', category: 'Produtos', description: 'Venda balcão', amount: 93, method: 'dinheiro', date: todayISO(-2) },
]

financialEntries.push(
  { id: 'fin_9', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1048', amount: 70, method: 'pix', date: todayISO(0) },
  { id: 'fin_10', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1049', amount: 120, method: 'credito', date: todayISO(0) },
  { id: 'fin_11', barbershopId: BSP, type: 'entrada', category: 'Assinaturas', description: 'Premium Barba & Cabelo - Henrique', amount: 249, method: 'pix', date: todayISO(-1) },
  { id: 'fin_12', barbershopId: BSP, type: 'entrada', category: 'Produtos', description: 'Venda finalizadores e acessórios', amount: 154, method: 'debito', date: todayISO(-1) },
  { id: 'fin_13', barbershopId: BSP, type: 'saida', category: 'Marketing', description: 'Campanha Instagram semana', amount: 220, method: 'credito', date: todayISO(-1) },
  { id: 'fin_14', barbershopId: BSP, type: 'saida', category: 'Estoque', description: 'Compra shampoo e minoxidil', amount: 840, method: 'pix', date: todayISO(-3) },
  { id: 'fin_15', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1037', amount: 95, method: 'pix', date: todayISO(-2) },
  { id: 'fin_16', barbershopId: BSP, type: 'entrada', category: 'Serviços', description: 'Comanda #1036', amount: 130, method: 'dinheiro', date: todayISO(-4) },
  { id: 'fin_17', barbershopId: BSP, type: 'saida', category: 'Fixos', description: 'Conta de energia', amount: 680, method: 'pix', date: todayISO(-6) },
  { id: 'fin_18', barbershopId: BSP, type: 'saida', category: 'Operacional', description: 'Lavanderia de toalhas', amount: 190, method: 'debito', date: todayISO(-5) },
)

export const imports: ImportRecord[] = [
  { id: 'imp_1', barbershopId: BSP, entity: 'clientes', fileName: 'clientes_sistema_antigo.csv', totalRows: 480, importedRows: 472, errorRows: 8, status: 'com_erros', createdAt: todayISO(-6), createdBy: 'Rafael Moura' },
  { id: 'imp_2', barbershopId: BSP, entity: 'produtos', fileName: 'produtos_estoque.csv', totalRows: 64, importedRows: 64, errorRows: 0, status: 'concluida', createdAt: todayISO(-6), createdBy: 'Carla Nunes' },
  { id: 'imp_3', barbershopId: BSP, entity: 'servicos', fileName: 'servicos.csv', totalRows: 22, importedRows: 22, errorRows: 0, status: 'concluida', createdAt: todayISO(-5), createdBy: 'Carla Nunes' },
  { id: 'imp_4', barbershopId: BSP, entity: 'assinaturas', fileName: 'planos_clientes.csv', totalRows: 118, importedRows: 96, errorRows: 22, status: 'com_erros', createdAt: todayISO(-2), createdBy: 'Rafael Moura' },
  { id: 'imp_5', barbershopId: BSP, entity: 'comandas', fileName: 'historico_comandas_2025.xlsx', totalRows: 1320, importedRows: 1288, errorRows: 32, status: 'com_erros', createdAt: todayISO(-1), createdBy: 'Renata Costa' },
  { id: 'imp_6', barbershopId: BSP, entity: 'funcionarios', fileName: 'equipe_unidade.csv', totalRows: 8, importedRows: 8, errorRows: 0, status: 'concluida', createdAt: todayISO(-10), createdBy: 'Carla Nunes' },
  { id: 'imp_7', barbershopId: BSP, entity: 'produtos', fileName: 'ajuste_estoque_julho.csv', totalRows: 42, importedRows: 39, errorRows: 3, status: 'processando', createdAt: todayISO(0), createdBy: 'Renata Costa' },
]

// Séries derivadas para gráficos (últimos 7 dias / receita e comandas)
export const revenueSeries = [
  { label: 'Seg', receita: 2860, comandas: 34 },
  { label: 'Ter', receita: 3180, comandas: 38 },
  { label: 'Qua', receita: 2740, comandas: 31 },
  { label: 'Qui', receita: 3920, comandas: 46 },
  { label: 'Sex', receita: 4680, comandas: 55 },
  { label: 'Sáb', receita: 6120, comandas: 68 },
  { label: 'Dom', receita: 1280, comandas: 14 },
]

export const revenueByMethod = [
  { method: 'Pix', value: 12480 },
  { method: 'Crédito', value: 9110 },
  { method: 'Débito', value: 6240 },
  { method: 'Dinheiro', value: 3180 },
  { method: 'Outro', value: 780 },
]
