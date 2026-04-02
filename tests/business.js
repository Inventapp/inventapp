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
