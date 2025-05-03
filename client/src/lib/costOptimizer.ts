import { Item } from '@shared/types';

export interface OptimizationSuggestion {
  id: string;
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  potentialSavings?: number;
  itemIds?: string[]; // IDs de los ítems relacionados con la sugerencia
}

// Esta función analiza los datos de cotización y genera sugerencias de optimización
export function generateCostOptimizationSuggestions(
  items: Item[],
  margenGanancia: number,
  porcentajeComision: number,
  hayDatosReales: boolean
): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = [];
  
  // Análisis de margen de ganancia
  if (margenGanancia < 15) {
    suggestions.push({
      id: 'margin-too-low',
      type: 'warning',
      title: 'Margen de ganancia bajo',
      description: `Tu margen actual de ${margenGanancia}% está por debajo del rango recomendado (15-30%). Considera aumentarlo para mejorar la rentabilidad.`,
      impact: 'high',
    });
  } else if (margenGanancia > 40) {
    suggestions.push({
      id: 'margin-too-high',
      type: 'warning',
      title: 'Margen de ganancia elevado',
      description: `Tu margen actual de ${margenGanancia}% está por encima del rango típico. Podría afectar tu competitividad en el mercado.`,
      impact: 'medium',
    });
  }
  
  // Análisis de comisiones
  if (porcentajeComision > 15) {
    suggestions.push({
      id: 'commission-high',
      type: 'warning',
      title: 'Comisión elevada',
      description: `La comisión del ${porcentajeComision}% es superior al promedio del sector. Considera renegociar o ajustar este porcentaje.`,
      impact: 'medium',
      potentialSavings: calculateCommissionImpact(items, porcentajeComision),
    });
  }
  
  // Identificar ítems sin precio
  const itemsSinPrecio = items.filter(item => (item.precioUnitario.valor || 0) === 0);
  if (itemsSinPrecio.length > 0) {
    suggestions.push({
      id: 'items-without-price',
      type: 'error',
      title: 'Ítems sin precio definido',
      description: `${itemsSinPrecio.length} ítem(s) no tienen precio asignado. Esto afecta el cálculo total.`,
      impact: 'high',
      itemIds: itemsSinPrecio.map(item => item.id),
    });
  }
  
  // Análisis de costos reales vs estimados (si hay datos reales)
  if (hayDatosReales) {
    const itemsConSobrecosto = items.filter(
      item => item.costoReal !== undefined && 
              item.costoReal !== null && 
              item.precioUnitario.valor !== null && 
              item.costoReal > item.precioUnitario.valor
    );
    
    if (itemsConSobrecosto.length > 0) {
      // Calcular el porcentaje promedio de sobrecosto
      const porcentajePromedio = itemsConSobrecosto.reduce(
        (sum, item) => sum + ((item.costoReal! - item.precioUnitario.valor!) / item.precioUnitario.valor! * 100), 
        0
      ) / itemsConSobrecosto.length;
      
      suggestions.push({
        id: 'items-over-budget',
        type: 'warning',
        title: 'Ítems por encima del presupuesto',
        description: `${itemsConSobrecosto.length} ítem(s) superaron su costo estimado en un promedio de ${porcentajePromedio.toFixed(1)}%. Revisa estos ítems para futuros proyectos.`,
        impact: 'high',
        itemIds: itemsConSobrecosto.map(item => item.id),
      });
    }
  }
  
  // Análisis de distribución por categorías
  const categoryCounts: Record<string, { count: number, totalCost: number }> = {};
  items.forEach(item => {
    const categoria = item.categoria || 'sin_categoria';
    if (!categoryCounts[categoria]) {
      categoryCounts[categoria] = { count: 0, totalCost: 0 };
    }
    categoryCounts[categoria].count += 1;
    categoryCounts[categoria].totalCost += (item.precioUnitario.valor || 0) * item.cantidad;
  });
  
  // Encontrar la categoría con mayor costo
  let maxCostCategory = '';
  let maxCost = 0;
  for (const [category, data] of Object.entries(categoryCounts)) {
    if (data.totalCost > maxCost) {
      maxCost = data.totalCost;
      maxCostCategory = category;
    }
  }
  
  // Si hay una categoría dominante, sugerir revisar esos costos
  const totalCost = items.reduce((sum, item) => sum + ((item.precioUnitario.valor || 0) * item.cantidad), 0);
  if (maxCost > 0 && (maxCost / totalCost) > 0.6) {
    const categoryDisplayName = getCategoryDisplayName(maxCostCategory);
    suggestions.push({
      id: 'dominant-category',
      type: 'info',
      title: `Alta concentración en ${categoryDisplayName}`,
      description: `El ${((maxCost / totalCost) * 100).toFixed(1)}% del costo total corresponde a ${categoryDisplayName}. Considera revisar si hay oportunidades de optimización en esta área.`,
      impact: 'medium',
    });
  }
  
  // Sugerencias para impresión (basadas en tamaño y cantidad)
  const itemsImpresion = items.filter(
    item => item.mostrarExtendido && 
            item.extendido && 
            item.extendido.ancho !== null && 
            item.extendido.alto !== null
  );
  
  if (itemsImpresion.length > 0) {
    // Verificar si hay ítems de impresión con áreas pequeñas pero precios altos
    const itemsIneficientes = itemsImpresion.filter(item => {
      const area = (item.extendido!.ancho! * item.extendido!.alto!);
      const precioPorUnidadArea = (item.precioUnitario.valor || 0) / area;
      // Si el precio por unidad de área es muy alto comparado con el promedio
      return precioPorUnidadArea > 20; // este valor podría ajustarse según el sector
    });
    
    if (itemsIneficientes.length > 0) {
      suggestions.push({
        id: 'inefficient-printing',
        type: 'info',
        title: 'Optimización de impresión posible',
        description: `${itemsIneficientes.length} ítem(s) de impresión tienen un costo por unidad de área elevado. Considera agrupar trabajos o cambiar el formato para reducir costos.`,
        impact: 'medium',
        itemIds: itemsIneficientes.map(item => item.id),
      });
    }
  }
  
  // Verificar cantidades muy pequeñas con precios unitarios altos
  const smallQuantityItems = items.filter(
    item => item.cantidad < 3 && (item.precioUnitario.valor || 0) > 1000
  );
  
  if (smallQuantityItems.length > 0) {
    suggestions.push({
      id: 'small-quantity-high-price',
      type: 'info',
      title: 'Cantidades pequeñas con precio alto',
      description: `${smallQuantityItems.length} ítem(s) tienen cantidades pequeñas pero precios elevados. Considera aumentar la cantidad para mejorar la rentabilidad.`,
      impact: 'low',
      itemIds: smallQuantityItems.map(item => item.id),
    });
  }
  
  return suggestions;
}

// Función auxiliar para calcular el impacto de la comisión
function calculateCommissionImpact(items: Item[], porcentajeComision: number): number {
  const subtotal = items.reduce((sum, item) => sum + ((item.precioUnitario.valor || 0) * item.cantidad), 0);
  const comisionActual = subtotal * (porcentajeComision / 100);
  const comisionRecomendada = subtotal * (10 / 100); // Asumiendo 10% como referencia
  return comisionActual - comisionRecomendada;
}

// Función para obtener nombres legibles de categorías
function getCategoryDisplayName(categoryKey: string): string {
  const categoryMap: Record<string, string> = {
    'impresion': 'Impresión',
    'materiales': 'Materiales',
    'mano_obra': 'Mano de Obra',
    'transporte': 'Transporte',
    'servicios': 'Servicios',
    'sin_categoria': 'ítems sin categoría'
  };
  
  return categoryMap[categoryKey] || categoryKey;
}