/**
 * Formata valores monetários para Kwanza Angolano (Kz)
 * Sempre usa "Kz" como sufixo, sem símbolo de dólar
 */

export const formatKz = (value: number): string => {
  return `${value.toFixed(2)} Kz`;
};

export const formatKzCompact = (value: number): string => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M Kz`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K Kz`;
  }
  return `${value.toFixed(2)} Kz`;
};

/**
 * Formata com separadores de milhares
 */
export const formatKzWithSeparator = (value: number): string => {
  return `${value.toLocaleString('pt-AO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Kz`;
};
