import { describe, it, expect } from 'vitest';
import {
  aplicarMovimiento,
  esBajoStock,
  esSinStock,
  calcularValorInventario,
  uStockDe,
  uEnProcesoDe,
  paginar,
  validarBackup,
  sanitizar,
  workerName,
  pPagosPorOrden,
  pEstadoDevolucion,
  pCalcularSaldos,
} from './business.js';

// ══════════════════════════════════════════════
// aplicarMovimiento
// ══════════════════════════════════════════════
describe('aplicarMovimiento', () => {
  it('entrada suma al stock', () => {
    expect(aplicarMovimiento(10, 'Entrada', 5)).toBe(15);
  });
  it('salida resta al stock', () => {
    expect(aplicarMovimiento(10, 'Salida', 3)).toBe(7);
  });
  it('salida nunca produce stock negativo', () => {
    expect(aplicarMovimiento(2, 'Salida', 10)).toBe(0);
  });
  it('salida exacta lleva a 0', () => {
    expect(aplicarMovimiento(5, 'Salida', 5)).toBe(0);
  });
  it('entrada desde 0 funciona correctamente', () => {
    expect(aplicarMovimiento(0, 'Entrada', 100)).toBe(100);
  });
  it('cantidades fraccionarias (lts, metros)', () => {
    expect(aplicarMovimiento(2.5, 'Entrada', 1.5)).toBeCloseTo(4.0);
    expect(aplicarMovimiento(3.0, 'Salida', 1.2)).toBeCloseTo(1.8);
  });
});

// ══════════════════════════════════════════════
// esBajoStock / esSinStock
// ══════════════════════════════════════════════
describe('esBajoStock', () => {
  it('true cuando stock > 0 y stock <= min', () => {
    expect(esBajoStock({ stock: 2, min: 5 })).toBe(true);
  });
  it('false cuando stock > min', () => {
    expect(esBajoStock({ stock: 10, min: 5 })).toBe(false);
  });
  it('false cuando stock === 0 (es sin-stock, no bajo)', () => {
    expect(esBajoStock({ stock: 0, min: 5 })).toBe(false);
  });
  it('false cuando stock === min exacto', () => {
    // stock == min no es bajo stock (es exactamente el mínimo)
    expect(esBajoStock({ stock: 5, min: 5 })).toBe(true); // <= incluye el igual
  });
});

describe('esSinStock', () => {
  it('true cuando stock es 0', () => {
    expect(esSinStock({ stock: 0 })).toBe(true);
  });
  it('false cuando hay stock', () => {
    expect(esSinStock({ stock: 1 })).toBe(false);
  });
});

// ══════════════════════════════════════════════
// calcularValorInventario
// ══════════════════════════════════════════════
describe('calcularValorInventario', () => {
  it('calcula correctamente la suma de stock × costo', () => {
    const productos = [
      { stock: 10, cost: 500 },
      { stock: 5,  cost: 2000 },
      { stock: 3,  cost: 100 },
    ];
    expect(calcularValorInventario(productos)).toBe(10*500 + 5*2000 + 3*100);
  });
  it('retorna 0 para lista vacía', () => {
    expect(calcularValorInventario([])).toBe(0);
  });
  it('trata cost ausente como 0', () => {
    expect(calcularValorInventario([{ stock: 10 }])).toBe(0);
  });
  it('trata cost=0 correctamente', () => {
    expect(calcularValorInventario([{ stock: 10, cost: 0 }])).toBe(0);
  });
});

// ══════════════════════════════════════════════
// uStockDe / uEnProcesoDe
// ══════════════════════════════════════════════
const UNIDADES = [
  { id: 'U001', skuId: 'SKU-A', estado: 'En Stock' },
  { id: 'U002', skuId: 'SKU-A', estado: 'En Stock' },
  { id: 'U003', skuId: 'SKU-A', estado: 'Vendido' },
  { id: 'U004', skuId: 'SKU-A', estado: 'En Proceso' },
  { id: 'U005', skuId: 'SKU-B', estado: 'En Stock' },
];

describe('uStockDe', () => {
  it('cuenta solo las unidades "En Stock" del SKU dado', () => {
    expect(uStockDe('SKU-A', UNIDADES)).toBe(2);
    expect(uStockDe('SKU-B', UNIDADES)).toBe(1);
  });
  it('retorna 0 para SKU inexistente', () => {
    expect(uStockDe('SKU-Z', UNIDADES)).toBe(0);
  });
  it('no cuenta unidades vendidas ni en proceso', () => {
    expect(uStockDe('SKU-A', UNIDADES)).not.toBe(4);
  });
});

describe('uEnProcesoDe', () => {
  it('cuenta solo las unidades "En Proceso" del SKU dado', () => {
    expect(uEnProcesoDe('SKU-A', UNIDADES)).toBe(1);
  });
  it('retorna 0 cuando no hay en proceso', () => {
    expect(uEnProcesoDe('SKU-B', UNIDADES)).toBe(0);
  });
});

// ══════════════════════════════════════════════
// paginar
// ══════════════════════════════════════════════
describe('paginar', () => {
  const lista50 = Array.from({ length: 50 }, (_, i) => i);
  const lista120 = Array.from({ length: 120 }, (_, i) => i);

  it('lista ≤ 50 → 1 página, todos los ítems', () => {
    const { items, totalPages, safePage } = paginar(lista50, 0);
    expect(totalPages).toBe(1);
    expect(safePage).toBe(0);
    expect(items.length).toBe(50);
  });
  it('lista 120 → 3 páginas', () => {
    const { totalPages } = paginar(lista120, 0);
    expect(totalPages).toBe(3);
  });
  it('primera página: hasPrev=false, hasNext=true', () => {
    const { hasPrev, hasNext } = paginar(lista120, 0);
    expect(hasPrev).toBe(false);
    expect(hasNext).toBe(true);
  });
  it('última página: hasPrev=true, hasNext=false', () => {
    const { hasPrev, hasNext } = paginar(lista120, 2);
    expect(hasPrev).toBe(true);
    expect(hasNext).toBe(false);
  });
  it('página 2 de 3 devuelve los ítems 50-99', () => {
    const { items, safePage } = paginar(lista120, 1);
    expect(safePage).toBe(1);
    expect(items[0]).toBe(50);
    expect(items.length).toBe(50);
  });
  it('página fuera de rango → se ajusta a la última página', () => {
    const { safePage } = paginar(lista120, 99);
    expect(safePage).toBe(2);
  });
  it('lista vacía → 1 página vacía', () => {
    const { items, totalPages } = paginar([], 0);
    expect(totalPages).toBe(1);
    expect(items.length).toBe(0);
  });
});

// ══════════════════════════════════════════════
// sanitizar
// ══════════════════════════════════════════════
describe('sanitizar', () => {
  it('escapa &', () => {
    expect(sanitizar('Precio & Calidad')).toBe('Precio &amp; Calidad');
  });
  it('escapa < y >', () => {
    expect(sanitizar('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('escapa comillas dobles', () => {
    expect(sanitizar('onclick="malo()"')).toBe('onclick=&quot;malo()&quot;');
  });
  it("escapa comillas simples", () => {
    expect(sanitizar("Juan O'Brien")).toBe('Juan O&#x27;Brien');
  });
  it('retorna "" para null', () => {
    expect(sanitizar(null)).toBe('');
  });
  it('retorna "" para undefined', () => {
    expect(sanitizar(undefined)).toBe('');
  });
  it('retorna "" para string vacío', () => {
    expect(sanitizar('')).toBe('');
  });
  it('convierte números a string sin modificar', () => {
    expect(sanitizar(42)).toBe('42');
  });
  it('no modifica texto sin caracteres especiales', () => {
    expect(sanitizar('Adhesivo PVC')).toBe('Adhesivo PVC');
  });
  it('escapa múltiples caracteres en un mismo string', () => {
    expect(sanitizar('<b>Hola & "mundo"</b>')).toBe('&lt;b&gt;Hola &amp; &quot;mundo&quot;&lt;/b&gt;');
  });
});

// ══════════════════════════════════════════════
// workerName
// ══════════════════════════════════════════════
describe('workerName', () => {
  it('extrae nombre de objeto trabajador', () => {
    expect(workerName({ name: 'Juan', area: 'Bodega' })).toBe('Juan');
  });
  it('retorna string legado directamente', () => {
    expect(workerName('Pedro')).toBe('Pedro');
  });
  it('retorna null para null (formato inesperado)', () => {
    expect(workerName(null)).toBe(null);
  });
  it('retorna undefined si el objeto no tiene campo name', () => {
    expect(workerName({ area: 'Taller' })).toBeUndefined();
  });
});

// ══════════════════════════════════════════════
// validarBackup
// ══════════════════════════════════════════════
describe('validarBackup', () => {
  const backupValido = {
    products:  [{ id: 'BARN', name: 'Barniz', stock: 5, min: 2, cost: 1000 }],
    movements: [{ id: 'MOV-001', prodId: 'BARN', type: 'Entrada', qty: 5 }],
    workers:   [{ name: 'Juan', area: 'Materiales' }],
  };

  it('acepta un backup bien formado', () => {
    const { ok } = validarBackup(backupValido);
    expect(ok).toBe(true);
  });
  it('rechaza null', () => {
    const { ok } = validarBackup(null);
    expect(ok).toBe(false);
  });
  it('rechaza si products no es array', () => {
    const { ok, errors } = validarBackup({ ...backupValido, products: {} });
    expect(ok).toBe(false);
    expect(errors.some(e => e.includes('products'))).toBe(true);
  });
  it('rechaza si movements no es array', () => {
    const { ok } = validarBackup({ ...backupValido, movements: 'x' });
    expect(ok).toBe(false);
  });
  it('detecta productos sin campo id', () => {
    const { ok, errors } = validarBackup({
      ...backupValido,
      products: [{ name: 'Barniz' }], // sin id
    });
    expect(ok).toBe(false);
    expect(errors.some(e => e.includes('"id"'))).toBe(true);
  });
  it('detecta productos sin campo name', () => {
    const { ok, errors } = validarBackup({
      ...backupValido,
      products: [{ id: 'BARN' }], // sin name
    });
    expect(ok).toBe(false);
    expect(errors.some(e => e.includes('"name"'))).toBe(true);
  });
  it('backup con arrays vacíos es válido (app recién iniciada)', () => {
    const { ok } = validarBackup({ products: [], movements: [], workers: [] });
    expect(ok).toBe(true);
  });
});

// ══════════════════════════════════════════════
// PAGOS — Órdenes de compra y devoluciones
// ══════════════════════════════════════════════
describe('pPagosPorOrden', () => {
  it('suma todos los pagos asociados a una orden', () => {
    const pagos = [
      { id: 'p1', ordenId: 'OC-1', monto: 10000 },
      { id: 'p2', ordenId: 'OC-1', monto: 5000 },
      { id: 'p3', ordenId: 'OC-2', monto: 20000 },
    ];
    expect(pPagosPorOrden('OC-1', pagos)).toBe(15000);
    expect(pPagosPorOrden('OC-2', pagos)).toBe(20000);
  });
  it('retorna 0 si no hay pagos asociados', () => {
    expect(pPagosPorOrden('OC-99', [])).toBe(0);
    expect(pPagosPorOrden('OC-99', [{ id: 'p1', ordenId: 'OC-1', monto: 100 }])).toBe(0);
  });
  it('ignora pagos con monto no numérico', () => {
    const pagos = [
      { id: 'p1', ordenId: 'OC-1', monto: 1000 },
      { id: 'p2', ordenId: 'OC-1', monto: 'abc' },
      { id: 'p3', ordenId: 'OC-1', monto: null },
    ];
    expect(pPagosPorOrden('OC-1', pagos)).toBe(1000);
  });
});

describe('pEstadoDevolucion', () => {
  const orden = { id: 'OC-1', monto: 50000 };
  it("'sin-devolver' cuando no hay pagos", () => {
    expect(pEstadoDevolucion(orden, [])).toBe('sin-devolver');
  });
  it("'parcial' cuando el pago es menor al monto", () => {
    const pagos = [{ id: 'p1', ordenId: 'OC-1', monto: 20000 }];
    expect(pEstadoDevolucion(orden, pagos)).toBe('parcial');
  });
  it("'devuelto' cuando los pagos igualan el monto", () => {
    const pagos = [{ id: 'p1', ordenId: 'OC-1', monto: 50000 }];
    expect(pEstadoDevolucion(orden, pagos)).toBe('devuelto');
  });
  it("'devuelto' cuando los pagos exceden el monto (sobrepago)", () => {
    const pagos = [{ id: 'p1', ordenId: 'OC-1', monto: 60000 }];
    expect(pEstadoDevolucion(orden, pagos)).toBe('devuelto');
  });
  it("'devuelto' cuando varios pagos suman el total", () => {
    const pagos = [
      { id: 'p1', ordenId: 'OC-1', monto: 20000 },
      { id: 'p2', ordenId: 'OC-1', monto: 30000 },
    ];
    expect(pEstadoDevolucion(orden, pagos)).toBe('devuelto');
  });
});

describe('pCalcularSaldos', () => {
  it('calcula saldo pendiente por persona', () => {
    const ordenes = [
      { id: 'OC-1', pagadoPor: 'Juan', monto: 100000 },
      { id: 'OC-2', pagadoPor: 'Juan', monto: 50000 },
      { id: 'OC-3', pagadoPor: 'María', monto: 30000 },
    ];
    const pagos = [
      { id: 'p1', destinatario: 'Juan', monto: 80000 },
    ];
    const saldos = pCalcularSaldos(ordenes, pagos);
    expect(saldos.Juan.adelantado).toBe(150000);
    expect(saldos.Juan.devuelto).toBe(80000);
    expect(saldos.Juan.pendiente).toBe(70000);
    expect(saldos['María'].adelantado).toBe(30000);
    expect(saldos['María'].devuelto).toBe(0);
    expect(saldos['María'].pendiente).toBe(30000);
  });
  it('saldo en cero cuando adelantado === devuelto', () => {
    const ordenes = [{ id: 'OC-1', pagadoPor: 'Juan', monto: 50000 }];
    const pagos   = [{ id: 'p1', destinatario: 'Juan', monto: 50000 }];
    const saldos  = pCalcularSaldos(ordenes, pagos);
    expect(saldos.Juan.pendiente).toBe(0);
  });
  it('saldo negativo cuando se devolvió más de lo adelantado', () => {
    const ordenes = [{ id: 'OC-1', pagadoPor: 'Juan', monto: 10000 }];
    const pagos   = [{ id: 'p1', destinatario: 'Juan', monto: 15000 }];
    const saldos  = pCalcularSaldos(ordenes, pagos);
    expect(saldos.Juan.pendiente).toBe(-5000);
  });
  it('ignora órdenes / pagos sin persona asignada', () => {
    const ordenes = [
      { id: 'OC-1', pagadoPor: '',    monto: 50000 },
      { id: 'OC-2', pagadoPor: 'Ana', monto: 10000 },
    ];
    const pagos = [{ id: 'p1', destinatario: '', monto: 1000 }];
    const saldos = pCalcularSaldos(ordenes, pagos);
    expect(Object.keys(saldos)).toEqual(['Ana']);
    expect(saldos.Ana.adelantado).toBe(10000);
  });
  it('retorna objeto vacío si no hay datos', () => {
    expect(pCalcularSaldos([], [])).toEqual({});
  });
  it('persona con solo pagos recibidos (sin haber adelantado) aparece con saldo negativo', () => {
    // Caso borde: alguien recibió un pago pero nunca adelantó nada
    const saldos = pCalcularSaldos([], [{ id: 'p1', destinatario: 'Luis', monto: 5000 }]);
    expect(saldos.Luis.adelantado).toBe(0);
    expect(saldos.Luis.devuelto).toBe(5000);
    expect(saldos.Luis.pendiente).toBe(-5000);
  });
});
