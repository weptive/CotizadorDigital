// Common types
export type UnidadMedida = "pulgadas" | "pies" | "centimetros" | "metros";

export type PrecioConFormula = {
  valor: number | null;
  formula?: string;
};

export type ItemExtendido = {
  ancho: number | null;
  alto: number | null;
  unidadMedida: UnidadMedida;
  costoPorPie: number | null;
};

// General quotation types
export interface Item {
  id: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: PrecioConFormula;
  extendido?: ItemExtendido;
  mostrarExtendido: boolean;
  areaPiesCuadrados?: number;
  esImpresion: boolean;
  costoReal?: number;
  categoria?: string;
}

export interface CotizadorTemplate {
  id?: string;
  nombre: string;
  items: Item[];
}

export interface Escenario {
  id: string;
  nombre: string;
  descripcion: string;
  items: Item[];
  margenGanancia: number;
  porcentajeComision: number;
  precioFinal: PrecioConFormula;
  fechaCreacion: string;
  clienteId?: string;
}

export interface Cliente {
  id?: string;
  nombre: string;
  correo: string;
  telefono: string;
  proyecto: string;
}

// Printing quotation types
export interface ItemImpresion {
  id: string;
  ancho: number;
  alto: number;
  unidadMedida: UnidadMedida;
  cantidad: number;
  costoPorPie: number;
  precioVentaPorPie: number;
  areaPiesCuadrados: number;
}

export interface ItemAdicional {
  id: string;
  descripcion: string;
  costo: number;
  tipo?: string;
  incluido: boolean; // Indica si el ítem está incluido en el precio base
  precioVenta?: number; // Precio de venta calculado o ingresado directamente
  margen?: number; // Porcentaje de margen si se calcula por porcentaje
  modoPrecio: "directo" | "margen"; // Indica cómo se calcula el precio
}

export interface TemplateImpresion {
  id?: string;
  nombre: string;
  itemsImpresion: ItemImpresion[];
  itemsAdicionales: ItemAdicional[];
}

export interface EscenarioImpresion {
  id: string;
  nombre: string;
  descripcion: string;
  itemsImpresion: ItemImpresion[];
  itemsAdicionales: ItemAdicional[];
  porcentajeComision: number;
  precioFinal?: number;
  fechaCreacion: string;
  clienteId?: string;
}

// PDF generation types
export interface ResumenCotizacion {
  subtotal: number;
  margenGanancia?: number;
  porcentajeComision?: number;
  itbis: number;
  total: number;
}

export interface PDFGenerationParams {
  title: string;
  cliente: Cliente;
  items: Item[] | ItemImpresion[];
  itemsAdicionales?: ItemAdicional[];
  resumen: ResumenCotizacion;
  notas?: string;
}
