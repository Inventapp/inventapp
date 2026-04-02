import { describe, it, expect } from 'vitest';
import {
  workerName,
  fmtFecha,
  fmtNum,
  pValorUnitario,
  sanitizar,
  generarIdMaterial,
} from './utils.js';

// ══════════════════════════════════════════════
// workerName
// ══════════════════════════════════════════════
describe('workerName', () => {
  it('retorna el nombre si es objeto', () => {
    expect(workerName({ name: 'Juan Pérez', area: 'Materiales' })).toBe('Juan Pérez');
  });
  it('retorna el valor si ya es string (formato antiguo)', () => {
    expect(workerName('María González')).toBe('María González');
  });
  it('maneja null sin explotar', () => {
    expect(workerName(null)).toBe(null);
  });
});

// ══════════════════════════════════════════════
// fmtFecha
// ══════════════════════════════════════════════
describe('fmtFecha', () => {
  it('convierte ISO a formato dd/mm/aa', () => {
    expect(fmtFecha('2026-04-02')).toBe('02/04/26');
  });
  it('retorna guión si la fecha es nula', () => {
    expect(fmtFecha(null)).toBe('—');
    expect(fmtFecha('')).toBe('—');
    expect(fmtFecha(undefined)).toBe('—');
  });
  it('mantiene el día con cero a la izquierda', () => {
    expect(fmtFecha('2026-01-05')).toBe('05/01/26');
  });
});

// ══════════════════════════════════════════════
// fmtNum
// ══════════════════════════════════════════════
describe('fmtNum', () => {
  it('formatea con separador de miles en es-CL', () => {
    expect(fmtNum(1000)).toBe('1.000');
    expect(fmtNum(1000000)).toBe('1.000.000');
  });
  it('redondea decimales', () => {
    expect(fmtNum(1234.9)).toBe('1.235');
  });
  it('maneja cero', () => {
    expect(fmtNum(0)).toBe('0');
  });
});

// ══════════════════════════════════════════════
// pValorUnitario
// ══════════════════════════════════════════════
describe('pValorUnitario', () => {
  it('retorna el costo del producto', () => {
    expect(pValorUnitario({ cost: 850 })).toBe(850);
  });
  it('retorna 0 si no tiene costo', () => {
    expect(pValorUnitario({})).toBe(0);
    expect(pValorUnitario({ cost: 0 })).toBe(0);
  });
});

// ══════════════════════════════════════════════
// sanitizar — protección XSS
// ══════════════════════════════════════════════
describe('sanitizar', () => {
  it('escapa tags HTML peligrosos', () => {
    expect(sanitizar('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('escapa comillas dobles y simples', () => {
    expect(sanitizar('<img src=x onerror="alert(1)">')).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(sanitizar("O'Brien")).toBe('O&#x27;Brien');
  });
  it('retorna string vacío para valores falsy', () => {
    expect(sanitizar('')).toBe('');
    expect(sanitizar(null)).toBe('');
    expect(sanitizar(undefined)).toBe('');
  });
  it('no modifica texto normal', () => {
    expect(sanitizar('Barniz Oscuro 1L')).toBe('Barniz Oscuro 1L');
  });
  it('preserva tildes y caracteres especiales del español', () => {
    expect(sanitizar('Urña Nº 5 — Mármol')).toBe('Urña Nº 5 — Mármol');
  });
});

// ══════════════════════════════════════════════
// generarIdMaterial
// ══════════════════════════════════════════════
describe('generarIdMaterial', () => {
  it('una palabra corta → primeras 4 letras', () => {
    expect(generarIdMaterial('Barniz', [])).toBe('BARN');
  });
  it('una palabra larga → primeras 4 letras', () => {
    expect(generarIdMaterial('Diluyente', [])).toBe('DILU');
  });
  it('dos palabras → 2 iniciales + letras de la primera hasta 4 chars', () => {
    // 'Barniz Negro' → iniciales 'BN' + resto de 'BARNIZ' → 'BNAR'
    expect(generarIdMaterial('Barniz Negro', [])).toBe('BNAR');
  });
  it('tres o más palabras → iniciales de cada una', () => {
    expect(generarIdMaterial('Barniz Negro Rápido', [])).toBe('BNR');
  });
  it('nombre con dimensiones → letras + números', () => {
    expect(generarIdMaterial('Vidrio 10x10', [])).toBe('VID1010');
  });
  it('solo números → prefijo MAT', () => {
    expect(generarIdMaterial('100x200', [])).toBe('MAT100200');
  });
  it('colisión → agrega sufijo letra', () => {
    const lista = [{ id: 'BARN' }];
    expect(generarIdMaterial('Barniz', lista)).toBe('BARNA');
  });
  it('múltiples colisiones → avanza en el alfabeto', () => {
    const lista = [{ id: 'BARN' }, { id: 'BARNA' }, { id: 'BARNB' }];
    expect(generarIdMaterial('Barniz', lista)).toBe('BARNC');
  });
  it('ignora espacios y guiones al inicio/fin', () => {
    expect(generarIdMaterial('  Barniz  ', [])).toBe('BARN');
  });
  it('es insensible a mayúsculas/minúsculas', () => {
    expect(generarIdMaterial('barniz', [])).toBe('BARN');
    expect(generarIdMaterial('BARNIZ', [])).toBe('BARN');
  });
});
