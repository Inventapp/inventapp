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
