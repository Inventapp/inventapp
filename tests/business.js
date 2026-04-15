/**
 * Funciones de lógica de negocio extraídas de index.html para testing.
 * Deben mantenerse sincronizadas con sus equivalentes en index.html.
 */

// ── Materiales: actualización de stock ─────────────────
/**
 * Aplica un movimiento de entrada o salida sobre el stock de un producto.
 * Retorna el nuevo valor de stock (nunca negativo).
 */
export function aplicarMovimiento(stockActual, tipo, qty) {
  if (tipo === 'Entrada') return stockActual + qty;
  return Math.max(0, stockActual - qty);
}

// ── Materiales: detección de stock bajo ────────────────
/**
 * true si el producto está bajo su mínimo (pero tiene algo de stock).
 */
export function esBajoStock(producto) {
  return producto.stock > 0 && producto.stock <= producto.min;
}

/**
 * true si el producto no tiene stock.
 */
export function esSinStock(producto) {
  return producto.stock === 0;
}

// ── Materiales: valor de inventario ───────────────────
/**
 * Calcula el valor total del inventario: suma de stock × costo por producto.
 */
export function calcularValorInventario(productos) {
  return productos.reduce((sum, p) => sum + p.stock * (p.cost || 0), 0);
}

// ── Urnas: stock derivado de unidades ─────────────────
/**
 * Cuenta las unidades serializadas de un SKU que están "En Stock".
 */
export function uStockDe(skuId, unidades) {
  return unidades.filter(u => u.skuId === skuId && u.estado === 'En Stock').length;
}

/**
 * Cuenta las unidades de un SKU "En Proceso" (en fabricación).
 */
export function uEnProcesoDe(skuId, unidades) {
  return unidades.filter(u => u.skuId === skuId && u.estado === 'En Proceso').length;
}

// ── Paginación ─────────────────────────────────────────
const INV_PAGE_SIZE = 50;

/**
 * Calcula la página actual y el slice visible de una lista.
 */
export function paginar(lista, page) {
  const total = lista.length;
  const totalPages = Math.ceil(total / INV_PAGE_SIZE) || 1;
  const safePage = Math.min(Math.max(0, page), totalPages - 1);
  const start = safePage * INV_PAGE_SIZE;
  const items = lista.slice(start, start + INV_PAGE_SIZE);
  return { items, safePage, totalPages, hasPrev: safePage > 0, hasNext: safePage < totalPages - 1 };
}

// ── Sanitización XSS ─────────────────────────────────
/**
 * Escapa caracteres especiales HTML para prevenir XSS.
 * Debe mantenerse sincronizada con sanitizar() en index.html.
 */
export function sanitizar(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// ── Trabajadores: nombre normalizado ─────────────────
/**
 * Retorna el nombre de un trabajador ya sea objeto o string legado.
 */
export function workerName(w) {
  return typeof w === 'object' && w !== null ? w.name : w;
}

// ── Pagos: lógica de saldos y estado de devolución ────
/**
 * Suma de pagos (devoluciones) registrados contra una orden específica.
 */
export function pPagosPorOrden(ordenId, pagosRegistros) {
  return pagosRegistros
    .filter(p => p.ordenId === ordenId)
    .reduce((acc, p) => acc + (Number(p.monto) || 0), 0);
}

/**
 * Estado de devolución de una orden según cuánto se ha pagado.
 * Retorna 'sin-devolver' | 'parcial' | 'devuelto'.
 */
export function pEstadoDevolucion(orden, pagosRegistros) {
  const pagado = pPagosPorOrden(orden.id, pagosRegistros);
  const total  = Number(orden.monto) || 0;
  if (pagado <= 0)     return 'sin-devolver';
  if (pagado >= total) return 'devuelto';
  return 'parcial';
}

/**
 * Calcula saldos por persona: cuánto adelantó vs cuánto recibió de vuelta.
 * Retorna { persona: { adelantado, devuelto, pendiente } }.
 * Si pendiente > 0, la empresa le debe; si < 0, la persona debe a la empresa.
 */
export function pCalcularSaldos(pagosOrdenes, pagosRegistros) {
  const saldos = {};
  pagosOrdenes.forEach(o => {
    const k = (o.pagadoPor || '').trim();
    if (!k) return;
    if (!saldos[k]) saldos[k] = { adelantado: 0, devuelto: 0, pendiente: 0 };
    saldos[k].adelantado += Number(o.monto) || 0;
  });
  pagosRegistros.forEach(p => {
    const k = (p.destinatario || '').trim();
    if (!k) return;
    if (!saldos[k]) saldos[k] = { adelantado: 0, devuelto: 0, pendiente: 0 };
    saldos[k].devuelto += Number(p.monto) || 0;
  });
  Object.values(saldos).forEach(s => { s.pendiente = s.adelantado - s.devuelto; });
  return saldos;
}

// ── Backup: validación ────────────────────────────────
/**
 * Valida la estructura básica de un backup antes de importarlo.
 * Retorna un objeto { ok, errors }.
 */
export function validarBackup(data) {
  const errors = [];
  if (!data || typeof data !== 'object') { return { ok: false, errors: ['El backup no es un objeto válido'] }; }
  if (!Array.isArray(data.products))  errors.push('Campo "products" inválido o ausente');
  if (!Array.isArray(data.movements)) errors.push('Campo "movements" inválido o ausente');
  if (!Array.isArray(data.workers))   errors.push('Campo "workers" inválido o ausente');
  if (data.products && data.products.length > 0) {
    const p = data.products[0];
    if (typeof p.id === 'undefined')   errors.push('Los productos no tienen campo "id"');
    if (typeof p.name === 'undefined') errors.push('Los productos no tienen campo "name"');
  }
  return { ok: errors.length === 0, errors };
}
