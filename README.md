# Presupuesto

Backend enterprise para gestion presupuestaria por departamentos, preparado para tablas grandes, calculos mensuales y multiples usuarios.

## Stack

- Node.js + Express
- PostgreSQL + Prisma
- Redis para cache de resumenes
- Zod para validacion
- Vitest + Supertest para pruebas

## Inicio local

### Demo local sin Docker

Este modo usa SQLite en `prisma/dev.db` para que puedas abrir la app completa en tu PC aunque no tengas PostgreSQL, Redis o Docker instalados.

```bash
copy .env.demo.example .env
npm install
npm run demo:generate
npm run demo:push
npm run demo:seed
npm run build:frontend
npm run dev:api
```

Abre:

- App completa: `http://localhost:4000`
- API health: `http://localhost:4000/health`

Si quieres desarrollar el frontend con Vite, puedes usar `npm run dev:frontend` y abrir `http://localhost:5173`, pero el modo recomendado en Windows es servir el build desde Express para evitar errores `spawn EPERM` del dev server.

### Enterprise con PostgreSQL y Redis

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:migrate
npm run dev
```

La API queda disponible en `http://localhost:4000`.

## Scripts

```bash
npm run dev
npm start
npm test
npm run prisma:generate
npm run prisma:migrate
npm run prisma:validate
npm run demo:generate
npm run demo:push
npm run demo:seed
npm run dev:frontend
npm run build:frontend
```

## Endpoints

- `GET /health`
- `POST /departments`
- `GET /departments`
- `POST /monthly-budgets`
- `GET /monthly-budgets?departmentId=1&year=2026`
- `POST /transactions/expense`
- `POST /transactions/transfer`
- `GET /transactions?departmentId=1&year=2026&month=1&type=EXPENSE&cursor=10&limit=50`
- `GET /summary?departmentId=1&year=2026&months=1,2,3`

## Modelo financiero

Disponible mensual:

```text
inicial + transferido_recibido - transferido_enviado - gastos
```

El dinero se guarda como `Decimal(14,2)` en Prisma. La API acepta `amount` como numero o string decimal y responde montos como string, por ejemplo `"1200.50"`.

## Performance

- `getMonthlySummary()` usa `groupBy` en base de datos y no carga todos los movimientos en memoria.
- Los gastos, transferencias enviadas y transferencias recibidas se agregan en consultas separadas.
- Redis guarda resultados de resumen por `departmentId`, `year` y lista de meses durante 60 segundos.
- La cache se invalida al crear o actualizar presupuestos mensuales, gastos o transferencias.
- `GET /transactions` usa paginacion cursor-based con limite maximo de 100.
- `Transaction` incluye indices compuestos para filtros por departamento, tipo, mes origen y mes destino.

## Frontend MVP

La carpeta `frontend/` contiene una app React con:

- dashboard mensual por departamento y año;
- grafico compacto de disponible vs gastos;
- tabla de movimientos paginada;
- formularios para departamentos, presupuestos, gastos y transferencias;
- refresco automatico del resumen despues de cada operacion.

## Ejemplos

Crear departamento:

```bash
curl -X POST http://localhost:4000/departments \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Finanzas\"}"
```

Crear presupuesto mensual:

```bash
curl -X POST http://localhost:4000/monthly-budgets \
  -H "Content-Type: application/json" \
  -d "{\"departmentId\":1,\"year\":2026,\"month\":1,\"amount\":\"5000.00\"}"
```

Crear gasto:

```bash
curl -X POST http://localhost:4000/transactions/expense \
  -H "Content-Type: application/json" \
  -d "{\"departmentId\":1,\"year\":2026,\"month\":1,\"amount\":\"250.00\",\"description\":\"Software\"}"
```

Crear transferencia:

```bash
curl -X POST http://localhost:4000/transactions/transfer \
  -H "Content-Type: application/json" \
  -d "{\"departmentId\":1,\"fromYear\":2026,\"fromMonth\":1,\"toYear\":2026,\"toMonth\":2,\"amount\":\"300.00\"}"
```

Consultar resumen parcial:

```bash
curl "http://localhost:4000/summary?departmentId=1&year=2026&months=1,2,3"
```
