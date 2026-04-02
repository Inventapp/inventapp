/**
 * Funciones puras extraídas de index.html para testing.
 * Deben mantenerse sincronizadas con sus equivalentes en index.html.
 */

export function workerName(w) {
  return typeof w === 'object' && w !== null ? w.name : w;
}

export function fmtFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-');
  return d + '/' + m + '/' + y.slice(-2);
}

export function fmtNum(n) {
  return Number(n).toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function pValorUnitario(p) {
  return p.cost || 0;
}

export function sanitizar(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

export function generarIdMaterial(nombre, lista) {
  const n = nombre.trim().toUpperCase();
  const tokens = n.split(/[\s\-_\/]+/).filter(Boolean);

  const textTokens = [];
  const numTokens  = [];

  tokens.forEach(tok => {
    if (/\d/.test(tok)) {
      const digits = tok.replace(/x/gi, '').replace(/[^0-9]/g, '');
      if (digits) numTokens.push(digits);
    } else {
      const letters = tok.replace(/[^A-Z]/g, '');
      if (letters) textTokens.push(letters);
    }
  });

  const nums = numTokens.join('');
  let textPart = '';

  if (textTokens.length === 0) {
    textPart = 'MAT';
  } else if (nums) {
    if (textTokens.length === 1) {
      textPart = textTokens[0].slice(0, 3);
    } else {
      const iniciales = textTokens.map(t => t[0]).join('');
      if (iniciales.length >= 3) {
        textPart = iniciales.slice(0, 3);
      } else {
        textPart = (iniciales + textTokens[0].slice(1)).slice(0, 3);
      }
    }
  } else {
    if (textTokens.length === 1) {
      textPart = textTokens[0].slice(0, 4);
    } else {
      const iniciales = textTokens.map(t => t[0]).join('');
      if (iniciales.length >= 3) {
        textPart = iniciales.slice(0, 4);
      } else if (iniciales.length === 2) {
        textPart = (iniciales + textTokens[0].slice(1)).slice(0, 4);
      } else {
        textPart = textTokens[0].slice(0, 4);
      }
    }
  }

  const baseId = textPart + nums;
  const ids = (lista || []).map(p => p.id);
  if (!ids.includes(baseId)) return baseId;

  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let i = 0; i < alpha.length; i++) {
    const c = baseId + alpha[i];
    if (!ids.includes(c)) return c;
  }
  return baseId + Date.now().toString().slice(-3);
}
