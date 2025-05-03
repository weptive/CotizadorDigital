import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdfUtils";
import { formatearPrecioDOP } from "@/lib/utils";
import { generateCostOptimizationSuggestions } from "@/lib/costOptimizer";
import CostOptimizationSuggestions from "@/components/CostOptimizationSuggestions";
import {
  Calculator,
  FileText,
  Grid,
  Plus,
  Save,
  Trash2,
  GripVertical,
  Download,
  RefreshCw,
  Upload,
  Edit,
  ChevronDown,
  ChevronRight,
  Layers,
  DollarSign,
  Settings,
  Info,
  ChevronUp,
  BarChart4,
  ArrowUpDown,
  Zap,
  Lightbulb,
  Coins,
  Target,
  AlertTriangle,
  Check,
  X,
  LayoutTemplate as Template,
  Calendar,
  Printer,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container";
import { toast } from "@/hooks/use-toast";

import type { Item, Escenario, CotizadorTemplate, Cliente } from "@shared/types";

// Utility functions
const convertirAPiesCuadrados = (ancho: number, alto: number, unidad: string): number => {
  const factorConversion: Record<string, number> = {
    pulgadas: 1 / 144,
    pies: 1,
    centimetros: 1 / 929.0304,
    metros: 10.7639,
  };
  return ancho * alto * factorConversion[unidad];
};

// Función de formateo de precios ahora importada desde @/lib/utils

const calcularExpresion = (expresion: string): number => {
  try {
    // eslint-disable-next-line no-new-func
    const resultado = new Function(`return ${expresion}`)();
    return isNaN(resultado) ? 0 : resultado;
  } catch (error) {
    console.error("Error al calcular la expresión:", error);
    return 0;
  }
};

// ItemForm Component
const ItemForm = ({
  onAdd,
}: {
  onAdd: (item: Item) => void;
}) => {
  const [descripcion, setDescripcion] = useState("");
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [precioUnitario, setPrecioUnitario] = useState<{ valor: number | null; formula?: string }>({ valor: null });
  const [mostrarExtendido, setMostrarExtendido] = useState(false);
  const [categoria, setCategoria] = useState<string>("");
  const [itemExtendido, setItemExtendido] = useState<{
    ancho: number | null;
    alto: number | null;
    unidadMedida: string;
    costoPorPie: number | null;
  }>({
    ancho: null,
    alto: null,
    unidadMedida: "pulgadas",
    costoPorPie: null,
  });

  const descripcionInputRef = useRef<HTMLInputElement>(null);

  const handleDescripcionChange = (value: string) => {
    setDescripcion(value);
    const esImpresion = value.toLowerCase().includes("impresion");
    setMostrarExtendido(esImpresion);
  };

  const handleCategoriaChange = (value: string) => {
    setCategoria(value);
    if (value === "impresion") {
      setMostrarExtendido(true);
    } else if (mostrarExtendido && !descripcion.toLowerCase().includes("impresion")) {
      setMostrarExtendido(false);
    }
  };

  const handleItemExtendidoChange = (campo: string, valor: number | null | string) => {
    setItemExtendido({ ...itemExtendido, [campo]: valor });
  };

  const handlePrecioChange = (valor: string) => {
    if (valor === "") {
      setPrecioUnitario({ valor: null });
    } else if (valor.startsWith("=")) {
      setPrecioUnitario({ valor: null, formula: valor });
    } else {
      const numeroValor = Number.parseFloat(valor);
      setPrecioUnitario({ valor: isNaN(numeroValor) ? null : numeroValor });
    }
  };

  const calcularYActualizarPrecio = (precio: { valor: number | null; formula?: string }, setter: (value: { valor: number | null; formula?: string }) => void) => {
    if (precio.formula) {
      const resultado = calcularExpresion(precio.formula.slice(1));
      setter({ valor: resultado, formula: undefined });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (descripcion && cantidad !== null && cantidad > 0) {
      const esImpresion = categoria === "impresion" || descripcion.toLowerCase().includes("impresion");
      let newItem: Item = {
        id: Date.now().toString(),
        descripcion,
        cantidad,
        precioUnitario,
        mostrarExtendido: esImpresion,
        esImpresion,
        categoria,
      };

      if (
        esImpresion &&
        itemExtendido.ancho !== null &&
        itemExtendido.alto !== null &&
        itemExtendido.costoPorPie !== null
      ) {
        const areaPiesCuadrados = convertirAPiesCuadrados(
          itemExtendido.ancho,
          itemExtendido.alto,
          itemExtendido.unidadMedida,
        );
        newItem = {
          ...newItem,
          extendido: itemExtendido,
          areaPiesCuadrados,
        };
      }

      onAdd(newItem);
      setDescripcion("");
      setCantidad(null);
      setPrecioUnitario({ valor: null, formula: undefined });
      setMostrarExtendido(false);
      setCategoria("");
      setItemExtendido({
        ancho: null,
        alto: null,
        unidadMedida: "pulgadas",
        costoPorPie: null,
      });

      // Focus first input after submitting
      setTimeout(() => {
        if (descripcionInputRef.current) {
          descripcionInputRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            ref={descripcionInputRef}
            value={descripcion}
            onChange={(e) => handleDescripcionChange(e.target.value)}
            placeholder="Escriba una descripción"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="categoria">Categoría</Label>
          <Select value={categoria} onValueChange={handleCategoriaChange}>
            <SelectTrigger id="categoria">
              <SelectValue placeholder="Seleccione categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="impresion">Impresión</SelectItem>
              <SelectItem value="materiales">Materiales</SelectItem>
              <SelectItem value="mano_obra">Mano de Obra</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="servicios">Servicios</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            type="number"
            value={cantidad === null ? "" : cantidad}
            onChange={(e) => setCantidad(e.target.value === "" ? null : Number(e.target.value))}
            min={1}
            placeholder="Cantidad"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="precioUnitario">Precio Unitario</Label>
          <Input
            id="precioUnitario"
            type="text"
            value={precioUnitario.formula || (precioUnitario.valor !== null ? precioUnitario.valor.toString() : "")}
            onChange={(e) => handlePrecioChange(e.target.value)}
            onBlur={() => calcularYActualizarPrecio(precioUnitario, setPrecioUnitario)}
            placeholder="Precio o =expresión"
            required
          />
        </div>
      </div>

      <Collapsible open={mostrarExtendido} onOpenChange={setMostrarExtendido} className="w-full">
        <CollapsibleTrigger asChild>
          <Button
            variant="outline"
            type="button"
            className="flex items-center justify-between w-full mb-2"
            onClick={() => setMostrarExtendido(!mostrarExtendido)}
          >
            <span className="flex items-center gap-2">
              {mostrarExtendido ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {mostrarExtendido ? "Ocultar campos extendidos" : "Mostrar campos extendidos"}
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="ancho">Ancho</Label>
              <Input
                id="ancho"
                type="number"
                value={itemExtendido.ancho === null ? "" : itemExtendido.ancho}
                onChange={(e) =>
                  handleItemExtendidoChange("ancho", e.target.value === "" ? null : Number(e.target.value))
                }
                min={0}
                step={0.01}
                placeholder="Ancho"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="alto">Alto</Label>
              <Input
                id="alto"
                type="number"
                value={itemExtendido.alto === null ? "" : itemExtendido.alto}
                onChange={(e) =>
                  handleItemExtendidoChange("alto", e.target.value === "" ? null : Number(e.target.value))
                }
                min={0}
                step={0.01}
                placeholder="Alto"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unidadMedida">Unidad de Medida</Label>
              <Select
                value={itemExtendido.unidadMedida}
                onValueChange={(value) => handleItemExtendidoChange("unidadMedida", value)}
              >
                <SelectTrigger id="unidadMedida">
                  <SelectValue placeholder="Seleccione unidad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pulgadas">Pulgadas</SelectItem>
                  <SelectItem value="pies">Pies</SelectItem>
                  <SelectItem value="centimetros">Centímetros</SelectItem>
                  <SelectItem value="metros">Metros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="costoPorPie">Costo por pie²</Label>
              <Input
                id="costoPorPie"
                type="number"
                value={itemExtendido.costoPorPie === null ? "" : itemExtendido.costoPorPie}
                onChange={(e) =>
                  handleItemExtendidoChange("costoPorPie", e.target.value === "" ? null : Number(e.target.value))
                }
                min={0}
                step={0.01}
                placeholder="Costo por pie²"
              />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      <Button type="submit" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ítem
      </Button>
    </form>
  );
};

// Main Component
export default function CotizadorGeneral() {
  const [items, setItems] = useState<Item[]>([]);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: "",
    correo: "",
    telefono: "",
    proyecto: ""
  });
  const [margenGanancia, setMargenGanancia] = useState<number>(25);
  const [porcentajeComision, setPorcentajeComision] = useState<number>(10);
  const [incluirITBIS, setIncluirITBIS] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("cotizacion");
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [nombreEscenario, setNombreEscenario] = useState<string>("");
  const [descripcionEscenario, setDescripcionEscenario] = useState<string>("");
  const [openTemplateDialog, setOpenTemplateDialog] = useState<boolean>(false);
  const [nombreTemplate, setNombreTemplate] = useState<string>("");
  const [itemEditing, setItemEditing] = useState<Item | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState<boolean>(false);
  const [selectedOptimizationItems, setSelectedOptimizationItems] = useState<string[]>([]);

  // Fetch templates and scenarios
  const { data: templates = [] } = useQuery<CotizadorTemplate[]>({
    queryKey: ["/api/cotizador-general/templates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: escenarios = [] } = useQuery<Escenario[]>({
    queryKey: ["/api/cotizador-general/escenarios"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutations for saving and loading data
  const saveEscenarioMutation = useMutation({
    mutationFn: async (escenario: Escenario) => {
      return apiRequest("POST", "/api/cotizador-general/escenarios", escenario);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-general/escenarios"] });
      toast({
        title: "Cotización guardada",
        description: "La cotización se ha guardado correctamente.",
        variant: "default",
      });
      setSaveDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description: `No se pudo guardar la cotización: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const saveTemplateMutation = useMutation({
    mutationFn: async (template: CotizadorTemplate) => {
      return apiRequest("POST", "/api/cotizador-general/templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-general/templates"] });
      toast({
        title: "Plantilla guardada",
        description: "La plantilla se ha guardado correctamente.",
        variant: "default",
      });
      setOpenTemplateDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error al guardar",
        description: `No se pudo guardar la plantilla: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteEscenarioMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cotizador-general/escenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-general/escenarios"] });
      toast({
        title: "Cotización eliminada",
        description: "La cotización se ha eliminado correctamente.",
        variant: "default",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cotizador-general/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-general/templates"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente.",
        variant: "default",
      });
    },
  });

  // Handlers
  const handleAddItem = (item: Item) => {
    setItems([...items, item]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };
  
  const handleEditItem = (item: Item) => {
    setItemEditing(item);
    setEditDialogOpen(true);
  };
  
  const handleSaveEditedItem = (updatedItem: Item) => {
    setItems(items.map(item => item.id === updatedItem.id ? updatedItem : item));
    setItemEditing(null);
    setEditDialogOpen(false);
    toast({
      title: "Ítem actualizado",
      description: "El ítem ha sido actualizado correctamente",
      variant: "default",
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(items);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setItems(reorderedItems);
  };

  const loadTemplate = (template: CotizadorTemplate) => {
    setItems(template.items);
    toast({
      title: "Plantilla cargada",
      description: `Se ha cargado la plantilla "${template.nombre}"`,
      variant: "default",
    });
  };

  const loadEscenario = (escenario: Escenario) => {
    setItems(escenario.items);
    setMargenGanancia(escenario.margenGanancia);
    setPorcentajeComision(escenario.porcentajeComision);
    toast({
      title: "Cotización cargada",
      description: `Se ha cargado la cotización "${escenario.nombre}"`,
      variant: "default",
    });
  };

  const handleSaveEscenario = () => {
    if (!nombreEscenario) {
      toast({
        title: "Error al guardar",
        description: "Debe proporcionar un nombre para la cotización.",
        variant: "destructive",
      });
      return;
    }

    // Prepare scenario data
    const escenario: Escenario = {
      id: Date.now().toString(),
      nombre: nombreEscenario,
      descripcion: descripcionEscenario,
      items,
      margenGanancia,
      porcentajeComision,
      precioFinal: { valor: calcularPrecioFinal() },
      fechaCreacion: new Date().toISOString(),
    };

    saveEscenarioMutation.mutate(escenario);
  };

  const handleSaveTemplate = () => {
    if (!nombreTemplate) {
      toast({
        title: "Error al guardar",
        description: "Debe proporcionar un nombre para la plantilla.",
        variant: "destructive",
      });
      return;
    }

    // Prepare template data
    const template: CotizadorTemplate = {
      nombre: nombreTemplate,
      items,
    };

    saveTemplateMutation.mutate(template);
  };

  const handleExportPDF = () => {
    generatePDF({
      title: "Cotización General",
      cliente,
      items,
      resumen: {
        subtotal: calcularSubtotal(),
        margenGanancia,
        porcentajeComision,
        itbis: incluirITBIS ? 0.18 : 0,
        total: calcularPrecioFinal(),
      },
      notas: "Cotización generada con el Sistema de Cotizaciones",
    });
  };

  // Calculations
  // Calcula el costo base (subtotal) sin márgenes ni impuestos
  const calcularCostoBase = () => {
    return items.reduce((total, item) => {
      const costo = item.precioUnitario.valor || 0;
      return total + costo * item.cantidad;
    }, 0);
  };

  // Alias para mantener compatibilidad con el resto del código
  const calcularSubtotal = calcularCostoBase;
  const calcularSubtotalSinMargen = calcularCostoBase;

  // Calcula el precio con margen (el margen se calcula sobre el precio final)
  const calcularPrecioConMargen = () => {
    const costoBase = calcularCostoBase();
    // Si el margen es 50%, entonces el costo base representa el 50% del precio con margen
    // Es decir, si el costo es $10,000 y el margen es 50%, el precio será $20,000 ($10,000 de costo + $10,000 de margen)
    // Precio con margen = costo base / (1 - margen/100)
    return margenGanancia >= 100 
      ? costoBase * 100 // Evitar división por cero o negativo
      : costoBase / (1 - margenGanancia/100);
  };

  // Calcular el monto del margen
  const calcularMontoMargen = () => {
    return calcularPrecioConMargen() - calcularCostoBase();
  };

  // Calcula el monto de la comisión (que se resta del margen)
  const calcularMontoComision = () => {
    return calcularPrecioConMargen() * (porcentajeComision / 100);
  };

  // Calcula el precio final - la comisión ya está incluida en el precio con margen
  // Este método ahora simplemente devuelve el mismo valor que calcularPrecioConMargen
  // ya que la comisión se resta de la ganancia y no se adiciona al precio
  const calcularPrecioConComision = () => {
    return calcularPrecioConMargen();
  };

  // Calcula el ITBIS (18% si está habilitado)
  const calcularITBIS = () => {
    const precioConComision = calcularPrecioConComision();
    return incluirITBIS ? precioConComision * 0.18 : 0;
  };

  // Calcula el precio final (precio con comisión + ITBIS)
  const calcularPrecioFinal = () => {
    const precioConComision = calcularPrecioConComision();
    const itbis = calcularITBIS();
    return precioConComision + itbis;
  };
  
  // Calcula el costo real total basado en los costos reales ingresados
  const calcularCostoRealTotal = () => {
    return items.reduce((total, item) => {
      // Si hay un costo real registrado, usarlo; de lo contrario, usar el costo estimado
      const costoItem = (item.costoReal !== undefined && item.costoReal !== null) 
        ? item.costoReal * item.cantidad 
        : (item.precioUnitario.valor || 0) * item.cantidad;
      return total + costoItem;
    }, 0);
  };
  
  // Calcula la diferencia entre el costo estimado y el real
  const calcularDiferenciaCostos = () => {
    const costoEstimado = calcularCostoBase();
    const costoReal = calcularCostoRealTotal();
    return costoReal - costoEstimado;
  };
  
  // Calcula el porcentaje de diferencia entre el costo estimado y el real
  const calcularPorcentajeDiferencia = () => {
    const costoEstimado = calcularCostoBase();
    const diferencia = calcularDiferenciaCostos();
    
    if (costoEstimado === 0) return 0;
    return (diferencia / costoEstimado) * 100;
  };
  
  // Verifica si hay costos reales ingresados para mostrar o no el análisis
  const hayDatosCostosReales = () => {
    return items.some(item => item.costoReal !== undefined && item.costoReal !== null);
  };
  
  // Función para generar sugerencias de optimización de costos
  const generarSugerenciasOptimizacion = () => {
    return generateCostOptimizationSuggestions(
      items,
      margenGanancia,
      porcentajeComision,
      hayDatosCostosReales()
    );
  };
  
  // Función para destacar elementos seleccionados en las sugerencias
  const handleOptimizationItemsClick = (itemIds: string[]) => {
    setSelectedOptimizationItems(itemIds);
    
    // Scroll hacia la tabla de items
    const tablaItems = document.getElementById('items-table');
    if (tablaItems) {
      tablaItems.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Destacar visualmente los items por 2 segundos
    setTimeout(() => {
      setSelectedOptimizationItems([]);
    }, 5000);
  };

  // Render
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizador General</h1>
          <p className="mt-1 text-sm text-gray-500">Crea cotizaciones para cualquier tipo de proyecto o servicio</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab("templates")}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="default" size="sm" onClick={() => setSaveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <Tabs defaultValue="cotizacion" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-px flex w-full border-b-0">
            <TabsTrigger value="cotizacion" className="border-b-2 border-transparent py-3 md:py-4 px-2 md:px-3 text-sm md:text-base flex-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap">
              Cotización
            </TabsTrigger>
            <TabsTrigger value="analisis" className="border-b-2 border-transparent py-3 md:py-4 px-2 md:px-3 text-sm md:text-base flex-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary flex items-center justify-center whitespace-nowrap">
              <BarChart4 className="mr-1 h-4 w-4" />
              <span>Análisis</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="border-b-2 border-transparent py-3 md:py-4 px-2 md:px-3 text-sm md:text-base flex-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap">
              Plantillas
            </TabsTrigger>
            <TabsTrigger value="historial" className="border-b-2 border-transparent py-3 md:py-4 px-2 md:px-3 text-sm md:text-base flex-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary whitespace-nowrap">
              Historial
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cotizacion" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Forms and Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Client Data */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Datos del Cliente</h2>
                    <div className="mt-4 grid grid-cols-1 gap-y-4 gap-x-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="nombre-cliente">Nombre / Empresa</Label>
                        <Input
                          id="nombre-cliente"
                          value={cliente.nombre}
                          onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="correo-cliente">Correo electrónico</Label>
                        <Input
                          id="correo-cliente"
                          type="email"
                          value={cliente.correo}
                          onChange={(e) => setCliente({ ...cliente, correo: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono-cliente">Teléfono</Label>
                        <Input
                          id="telefono-cliente"
                          type="tel"
                          value={cliente.telefono}
                          onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proyecto">Proyecto</Label>
                        <Input
                          id="proyecto"
                          value={cliente.proyecto}
                          onChange={(e) => setCliente({ ...cliente, proyecto: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Add Item Form */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Agregar Ítem</h2>
                    <ItemForm onAdd={handleAddItem} />
                  </CardContent>
                </Card>

                {/* Item List */}
                <Card>
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Lista de Ítems</h2>
                    <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                      {items.length} ítems
                    </Badge>
                  </div>
                  <Separator />
                  <MobileOptimizedContainer>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Unitario</TableHead>
                          <TableHead>Costo Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="items">
                          {(provided) => (
                            <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                              {items.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                    No hay ítems en la cotización
                                  </TableCell>
                                </TableRow>
                              ) : (
                                items.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`hover:bg-muted/50 ${
                                          selectedOptimizationItems.includes(item.id) 
                                            ? "bg-amber-50 border-l-4 border-amber-400" 
                                            : ""
                                        }`}
                                        id={`item-row-${item.id}`}
                                      >
                                        <TableCell {...provided.dragHandleProps} className="w-[40px]">
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          <div className="flex items-center">
                                            {item.categoria === "impresion" ? (
                                              <Printer className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-500" />
                                            ) : item.categoria === "materiales" ? (
                                              <Layers className="flex-shrink-0 mr-1.5 h-4 w-4 text-yellow-500" />
                                            ) : item.categoria === "mano_obra" ? (
                                              <Coins className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-500" />
                                            ) : item.categoria === "transporte" ? (
                                              <Zap className="flex-shrink-0 mr-1.5 h-4 w-4 text-purple-500" />
                                            ) : item.categoria === "servicios" ? (
                                              <Target className="flex-shrink-0 mr-1.5 h-4 w-4 text-indigo-500" />
                                            ) : (
                                              <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            )}
                                            <span>{item.descripcion}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell>{item.cantidad}</TableCell>
                                        <TableCell>{formatearPrecioDOP(item.precioUnitario.valor || 0)}</TableCell>
                                        <TableCell>{formatearPrecioDOP((item.precioUnitario.valor || 0) * item.cantidad)}</TableCell>
                                        <TableCell className="text-right">
                                          <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-8 w-8 text-primary"
                                            onClick={() => handleEditItem(item)}
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleRemoveItem(item.id)}
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </Button>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}
                            </TableBody>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </Table>
                  </MobileOptimizedContainer>
                </Card>
              </div>

              {/* Right Column: Summary and Actions */}
              <div className="space-y-6">
                {/* Summary Card */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Resumen de Cotización</h2>
                    <dl className="mt-4 space-y-4">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Subtotal</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatearPrecioDOP(calcularSubtotal())}</dd>
                      </div>
                      <div className="border-t border-gray-200 pt-4 flex justify-between">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <span>Margen de ganancia</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Porcentaje calculado sobre el precio final</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </dt>
                        <dd className="text-sm font-medium flex flex-col items-end">
                          <span className="text-gray-900">{margenGanancia}%</span>
                          <span className="text-xs text-gray-500">({formatearPrecioDOP(calcularMontoMargen())})</span>
                        </dd>
                      </div>
                      <div className="border-t border-gray-200 pt-4 flex justify-between">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <span>Comisión</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Porcentaje de comisión sobre el precio con margen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </dt>
                        <dd className="text-sm font-medium text-gray-900">{porcentajeComision}%</dd>
                      </div>
                      <div className="border-t border-gray-200 pt-4 flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">ITBIS (18%)</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatearPrecioDOP(calcularITBIS())}</dd>
                      </div>
                      <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                        <dt className="text-base font-medium text-gray-900">Total</dt>
                        <dd className="text-base font-medium text-primary">{formatearPrecioDOP(calcularPrecioFinal())}</dd>
                      </div>
                    </dl>
                  </CardContent>
                </Card>

                {/* Options Card */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Opciones</h2>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="margen-ganancia">Margen de ganancia (%)</Label>
                        <Input
                          id="margen-ganancia"
                          type="number"
                          min={0}
                          max={100}
                          value={margenGanancia}
                          onChange={(e) => setMargenGanancia(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="porcentaje-comision">Porcentaje de comisión (%)</Label>
                        <Input
                          id="porcentaje-comision"
                          type="number"
                          min={0}
                          max={100}
                          value={porcentajeComision}
                          onChange={(e) => setPorcentajeComision(Number(e.target.value))}
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="incluir-itbis"
                          checked={incluirITBIS}
                          onCheckedChange={setIncluirITBIS}
                        />
                        <Label htmlFor="incluir-itbis">Incluir ITBIS (18%)</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Acciones</h2>
                    <div className="mt-4 space-y-3">
                      <Button className="w-full" onClick={() => setSaveDialogOpen(true)}>
                        <Save className="h-5 w-5 mr-2" />
                        Guardar Cotización
                      </Button>
                      <Button variant="outline" className="w-full" onClick={handleExportPDF}>
                        <Download className="h-5 w-5 mr-2" />
                        Exportar a PDF
                      </Button>
                      <Button variant="outline" className="w-full" onClick={() => setOpenTemplateDialog(true)}>
                        <Template className="h-5 w-5 mr-2" />
                        Guardar como Plantilla
                      </Button>
                      
                      <Separator className="my-2" />
                      
                      <Button 
                        variant="outline" 
                        className="w-full bg-amber-50 border-amber-200 hover:bg-amber-100 hover:text-amber-900 text-amber-800"
                        onClick={() => {
                          setActiveTab("analisis");
                          // Scroll al componente de sugerencias después de cambiar de pestaña
                          setTimeout(() => {
                            const sugerenciasEl = document.querySelector('.optimization-suggestions');
                            if (sugerenciasEl) {
                              sugerenciasEl.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                      >
                        <Sparkles className="h-5 w-5 mr-2 text-amber-500" />
                        Ver sugerencias de optimización
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analisis" className="mt-6">
            <div className="mx-auto max-w-7xl">
              <Card className="overflow-hidden shadow-lg">
                <CardHeader className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
                  <CardTitle className="flex items-center">
                    <BarChart4 className="h-6 w-6 mr-2" />
                    Análisis profundo de cotización
                  </CardTitle>
                  <CardDescription className="text-primary-100">
                    Visualiza datos y métricas clave para optimizar tu cotización
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                    {/* Sugerencias de optimización de costos */}
                    <div className="lg:col-span-3 optimization-suggestions">
                      <CostOptimizationSuggestions 
                        suggestions={generarSugerenciasOptimizacion()}
                        onItemClick={handleOptimizationItemsClick}
                      />
                    </div>
                  
                    {/* Métricas principales */}
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                      <Card className="p-4 border-l-4 border-primary-500">
                        <div className="flex items-center">
                          <div className="p-2 bg-primary-100 rounded-lg mr-4">
                            <DollarSign className="h-5 w-5 text-primary-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Subtotal</div>
                            <div className="text-xl font-bold text-gray-900">{formatearPrecioDOP(calcularSubtotal())}</div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4 border-l-4 border-yellow-500">
                        <div className="flex items-center">
                          <div className="p-2 bg-yellow-100 rounded-lg mr-4">
                            <Lightbulb className="h-5 w-5 text-yellow-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Margen</div>
                            <div className="text-xl font-bold text-gray-900">{formatearPrecioDOP(calcularMontoMargen())}</div>
                            <div className="text-xs text-gray-500">({margenGanancia}% del precio final)</div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4 border-l-4 border-green-500">
                        <div className="flex items-center">
                          <div className="p-2 bg-green-100 rounded-lg mr-4">
                            <Coins className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Comisión</div>
                            <div className="text-xl font-bold text-gray-900">{formatearPrecioDOP(calcularPrecioConMargen() * (porcentajeComision / 100))}</div>
                            <div className="text-xs text-gray-500">({porcentajeComision}%)</div>
                          </div>
                        </div>
                      </Card>
                      
                      <Card className="p-4 border-l-4 border-indigo-500">
                        <div className="flex items-center">
                          <div className="p-2 bg-indigo-100 rounded-lg mr-4">
                            <Calculator className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-500">Total</div>
                            <div className="text-xl font-bold text-gray-900">{formatearPrecioDOP(calcularPrecioFinal())}</div>
                            <div className="text-xs text-green-600">{((calcularPrecioFinal() / calcularSubtotal() - 1) * 100).toFixed(1)}% sobre costo</div>
                          </div>
                        </div>
                      </Card>
                    </div>
                    
                    {/* Distribución de costos */}
                    <Card className="lg:col-span-2 p-6">
                      <h3 className="text-lg font-semibold mb-4">Distribución de costos por categoría</h3>
                      <div className="h-64">
                        {items.length > 0 ? (
                          <div className="space-y-4">
                            {/* Distribución por categoría */}
                            {['impresion', 'materiales', 'mano_obra', 'transporte', 'servicios', 'otros'].map(categoria => {
                              const itemsEnCategoria = items.filter(item => item.categoria === categoria);
                              if (itemsEnCategoria.length === 0) return null;
                              
                              const totalCategoria = itemsEnCategoria.reduce((sum, item) => 
                                sum + (item.precioUnitario.valor || 0) * item.cantidad, 0);
                              const porcentaje = (totalCategoria / calcularSubtotal()) * 100;
                              
                              const categoriaTexto = categoria === 'impresion' ? 'Impresión' :
                                categoria === 'materiales' ? 'Materiales' :
                                categoria === 'mano_obra' ? 'Mano de obra' :
                                categoria === 'transporte' ? 'Transporte' :
                                categoria === 'servicios' ? 'Servicios' : 'Otros';
                              
                              const colorClass = categoria === 'impresion' ? 'bg-blue-500' :
                                categoria === 'materiales' ? 'bg-yellow-500' :
                                categoria === 'mano_obra' ? 'bg-green-500' :
                                categoria === 'transporte' ? 'bg-purple-500' :
                                categoria === 'servicios' ? 'bg-indigo-500' : 'bg-gray-500';
                              
                              return (
                                <div key={categoria} className="space-y-1">
                                  <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                      <div className={`w-3 h-3 rounded-full ${colorClass}`}></div>
                                      <span>{categoriaTexto}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium">{formatearPrecioDOP(totalCategoria)}</span>
                                      <span className="text-gray-500 text-sm">({porcentaje.toFixed(1)}%)</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className={`${colorClass} h-2.5 rounded-full`} style={{ width: `${porcentaje}%` }}></div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                              <BarChart4 className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                              <p>Agrega ítems para ver el análisis de costos</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </Card>
                    
                    {/* Análisis de costos reales */}
                    {hayDatosCostosReales() && (
                      <Card className="p-6 mb-6">
                        <h3 className="text-lg font-semibold mb-4">Análisis de Costos Reales</h3>
                        <div className="space-y-6">
                          {/* Primera fila: Diferencia total y comparación de costos */}
                          <div className="grid grid-cols-1 gap-4">
                            <div className={`p-4 rounded-lg border-l-4 ${calcularDiferenciaCostos() > 0 ? 'border-red-500 bg-red-50' : 'border-green-500 bg-green-50'}`}>
                              <h4 className="text-lg font-medium mb-2">Diferencia Total</h4>
                              <div className="flex items-center space-x-2">
                                <span className={`text-2xl font-bold ${calcularDiferenciaCostos() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {formatearPrecioDOP(calcularDiferenciaCostos())}
                                </span>
                                <Badge variant={calcularDiferenciaCostos() > 0 ? "destructive" : "outline"} className={calcularDiferenciaCostos() > 0 ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                                  {calcularPorcentajeDiferencia() > 0 ? "+" : ""}{calcularPorcentajeDiferencia().toFixed(1)}%
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                {calcularDiferenciaCostos() > 0 
                                  ? "Sobrecosto detectado. Los costos reales superaron los estimados." 
                                  : calcularDiferenciaCostos() < 0
                                  ? "Ahorro de costos. Los costos reales fueron menores a los estimados."
                                  : "Los costos reales coinciden con los estimados."}
                              </p>
                            </div>
                            
                            <div className="p-4 rounded-lg border">
                              <h4 className="text-lg font-medium mb-2">Comparación de Costos</h4>
                              <div className="space-y-4">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Costo Estimado</span>
                                    <span className="font-medium">{formatearPrecioDOP(calcularCostoBase())}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: "100%" }}
                                    ></div>
                                  </div>
                                </div>
                                
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-500">Costo Real</span>
                                    <span className="font-medium">{formatearPrecioDOP(calcularCostoRealTotal())}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={calcularCostoRealTotal() > calcularCostoBase() ? "bg-red-500 h-2 rounded-full" : "bg-green-500 h-2 rounded-full"}
                                      style={{ 
                                        width: `${Math.min(
                                          calcularCostoRealTotal() / calcularCostoBase() * 100, 
                                          200
                                        )}%` 
                                      }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Segunda fila: Impacto en Rentabilidad */}
                          <div className="p-4 rounded-lg border">
                            <h4 className="text-lg font-medium mb-3">Impacto en Rentabilidad</h4>
                            <div className="space-y-4">
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-500 mb-1">Margen estimado</span>
                                <span className="text-xl font-semibold">{margenGanancia}%</span>
                                <div className="mt-1 text-xs text-gray-500">
                                  Margen planificado en la cotización
                                </div>
                              </div>
                              
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-500 mb-1">Margen real</span>
                                <span className={`text-xl font-semibold ${calcularDiferenciaCostos() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {(100 - (calcularCostoRealTotal() / calcularPrecioFinal() * 100)).toFixed(1)}%
                                </span>
                                <div className="mt-1 text-xs text-gray-500">
                                  Basado en costos reales
                                </div>
                              </div>
                              
                              <div className="flex flex-col">
                                <span className="text-sm text-gray-500 mb-1">Diferencia</span>
                                <span className={`text-xl font-semibold ${calcularDiferenciaCostos() > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  {((100 - (calcularCostoRealTotal() / calcularPrecioFinal() * 100)) - 
                                    (100 - (calcularCostoBase() / calcularPrecioFinal() * 100))) > 0 ? "+" : ""}
                                  {((100 - (calcularCostoRealTotal() / calcularPrecioFinal() * 100)) - 
                                    (100 - (calcularCostoBase() / calcularPrecioFinal() * 100))).toFixed(1)}%
                                </span>
                                <div className="mt-1 text-xs text-gray-500">
                                  {calcularDiferenciaCostos() > 0 ? "Reducción" : "Aumento"} en la rentabilidad
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-8">
                          <h4 className="text-lg font-medium mb-4">Detalle de costos por ítem</h4>
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <Table className="min-w-full">
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="w-[30%]">Descripción</TableHead>
                                  <TableHead className="whitespace-nowrap">Costo Est.</TableHead>
                                  <TableHead className="whitespace-nowrap">Costo Real</TableHead>
                                  <TableHead className="whitespace-nowrap">Diferencia</TableHead>
                                  <TableHead className="whitespace-nowrap text-right">% Var.</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {items
                                  .filter(item => item.costoReal !== undefined && item.costoReal !== null)
                                  .map(item => {
                                    const costoEstimadoTotal = (item.precioUnitario.valor || 0) * item.cantidad;
                                    const costoRealTotal = (item.costoReal || 0) * item.cantidad;
                                    const diferencia = costoRealTotal - costoEstimadoTotal;
                                    const porcentaje = costoEstimadoTotal === 0 ? 0 : (diferencia / costoEstimadoTotal) * 100;
                                    
                                    return (
                                      <TableRow key={item.id}>
                                        <TableCell>
                                          <div className="flex items-center">
                                            {item.categoria === "impresion" ? (
                                              <Printer className="flex-shrink-0 mr-1.5 h-4 w-4 text-blue-500" />
                                            ) : item.categoria === "materiales" ? (
                                              <Layers className="flex-shrink-0 mr-1.5 h-4 w-4 text-yellow-500" />
                                            ) : item.categoria === "mano_obra" ? (
                                              <Coins className="flex-shrink-0 mr-1.5 h-4 w-4 text-green-500" />
                                            ) : item.categoria === "transporte" ? (
                                              <Zap className="flex-shrink-0 mr-1.5 h-4 w-4 text-purple-500" />
                                            ) : item.categoria === "servicios" ? (
                                              <Target className="flex-shrink-0 mr-1.5 h-4 w-4 text-indigo-500" />
                                            ) : (
                                              <FileText className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                            )}
                                            <span>{item.descripcion}</span>
                                          </div>
                                        </TableCell>
                                        <TableCell className="text-right">{formatearPrecioDOP(costoEstimadoTotal)}</TableCell>
                                        <TableCell className="text-right">{formatearPrecioDOP(costoRealTotal)}</TableCell>
                                        <TableCell className={`text-right ${diferencia > 0 ? "text-red-600" : "text-green-600"}`}>
                                          {formatearPrecioDOP(diferencia)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Badge variant={diferencia > 0 ? "destructive" : "outline"} className={diferencia > 0 ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                                            {porcentaje > 0 ? "+" : ""}{porcentaje.toFixed(1)}%
                                          </Badge>
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      </Card>
                    )}
                    
                    {/* Mensaje cuando no hay costos reales */}
                    {!hayDatosCostosReales() && (
                      <Card className="p-6 mb-6 bg-blue-50 border-blue-200">
                        <div className="flex">
                          <Info className="h-6 w-6 text-blue-500 mr-3 flex-shrink-0" />
                          <div>
                            <h3 className="text-lg font-medium text-blue-800 mb-1">Registro de costos reales</h3>
                            <p className="text-blue-700">
                              Para ver un análisis comparativo entre los costos estimados y los reales, edita cada ítem haciendo clic en el 
                              icono de lápiz y registra el costo real después de completar el trabajo.
                            </p>
                            <div className="mt-4">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-blue-600 border-blue-200 hover:border-blue-300 hover:bg-blue-50"
                                onClick={() => setActiveTab("cotizacion")}
                              >
                                <Edit className="h-4 w-4 mr-2" />
                                Editar ítems
                              </Button>
                            </div>
                          </div>
                        </div>
                      </Card>
                    )}
                    
                    {/* Recomendaciones y predicciones */}
                    <Card className="p-6">
                      <h3 className="text-lg font-semibold mb-4">Recomendaciones</h3>
                      
                      <div className="space-y-4">
                        {items.length === 0 ? (
                          <div className="text-gray-500 flex items-center justify-center">
                            <div className="text-center">
                              <Lightbulb className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                              <p>Agrega ítems para recibir recomendaciones</p>
                            </div>
                          </div>
                        ) : (
                          <>
                            {margenGanancia < 15 && (
                              <div className="flex gap-3 pb-3 border-b">
                                <div className="flex-shrink-0">
                                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Margen de ganancia bajo</h4>
                                  <p className="text-sm text-gray-600">El margen actual ({margenGanancia}% del precio final) está por debajo del recomendado (15-30%).</p>
                                  <p className="mt-1 text-xs text-gray-500">Ejemplo: Para un precio de venta de $100, estás obteniendo ${margenGanancia} de ganancia.</p>
                                </div>
                              </div>
                            )}
                            
                            {margenGanancia > 40 && (
                              <div className="flex gap-3 pb-3 border-b">
                                <div className="flex-shrink-0">
                                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Margen de ganancia alto</h4>
                                  <p className="text-sm text-gray-600">El margen actual ({margenGanancia}% del precio final) podría reducir tu competitividad.</p>
                                  <p className="mt-1 text-xs text-gray-500">Ejemplo: Para un precio de venta de $100, estás obteniendo ${margenGanancia} de ganancia.</p>
                                </div>
                              </div>
                            )}
                            
                            {items.filter(item => (item.precioUnitario.valor || 0) === 0).length > 0 && (
                              <div className="flex gap-3 pb-3 border-b">
                                <div className="flex-shrink-0">
                                  <AlertTriangle className="h-5 w-5 text-red-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Ítems sin precio</h4>
                                  <p className="text-sm text-gray-600">{items.filter(item => (item.precioUnitario.valor || 0) === 0).length} ítem(s) tienen precio cero.</p>
                                </div>
                              </div>
                            )}
                            
                            {calcularSubtotal() > 0 && (
                              <div className="flex gap-3 pb-3 border-b">
                                <div className="flex-shrink-0">
                                  <Check className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">Precio competitivo</h4>
                                  <p className="text-sm text-gray-600">El precio final representa un {((calcularPrecioFinal() / calcularSubtotal() - 1) * 100).toFixed(1)}% sobre el costo base.</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <Layers className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No hay plantillas guardadas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Crea una cotización y guárdala como plantilla para reutilizarla en el futuro.
                  </p>
                </div>
              ) : (
                templates.map((template) => (
                  <Card key={template.nombre} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{template.nombre}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteTemplateMutation.mutate(template.nombre)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>{template.items.length} ítems</CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="text-sm text-muted-foreground">
                        <ul className="list-disc pl-5 space-y-1">
                          {template.items.slice(0, 3).map((item) => (
                            <li key={item.id}>{item.descripcion}</li>
                          ))}
                          {template.items.length > 3 && (
                            <li>Y {template.items.length - 3} ítems más...</li>
                          )}
                        </ul>
                      </div>
                    </CardContent>
                    <div className="bg-muted/50 px-4 py-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs"
                        onClick={() => loadTemplate(template)}
                      >
                        <Upload className="h-3 w-3 mr-1" /> Cargar plantilla
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="historial" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {escenarios.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No hay cotizaciones guardadas</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Guarda tus cotizaciones para acceder a ellas en el futuro.
                  </p>
                </div>
              ) : (
                escenarios.map((escenario) => (
                  <Card key={escenario.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{escenario.nombre}</CardTitle>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deleteEscenarioMutation.mutate(escenario.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {new Date(escenario.fechaCreacion).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="text-sm text-muted-foreground mb-2">
                        {escenario.descripcion || "Sin descripción"}
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total:</span>
                        <span className="font-medium text-primary">
                          {formatearPrecioDOP(escenario.precioFinal?.valor || 0)}
                        </span>
                      </div>
                    </CardContent>
                    <div className="bg-muted/50 px-4 py-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="default"
                        className="text-xs"
                        onClick={() => loadEscenario(escenario)}
                      >
                        <Upload className="h-3 w-3 mr-1" /> Cargar cotización
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Cotización</DialogTitle>
            <DialogDescription>
              Ingrese un nombre y descripción para guardar esta cotización.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombre" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombre"
                value={nombreEscenario}
                onChange={(e) => setNombreEscenario(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="descripcion" className="text-right">
                Descripción
              </Label>
              <Textarea
                id="descripcion"
                value={descripcionEscenario}
                onChange={(e) => setDescripcionEscenario(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSaveEscenario}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Dialog */}
      <Dialog open={openTemplateDialog} onOpenChange={setOpenTemplateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar como Plantilla</DialogTitle>
            <DialogDescription>
              Guarde los ítems actuales como una plantilla reutilizable.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="nombreTemplate" className="text-right">
                Nombre
              </Label>
              <Input
                id="nombreTemplate"
                value={nombreTemplate}
                onChange={(e) => setNombreTemplate(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSaveTemplate}>
              Guardar Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Ítem</DialogTitle>
            <DialogDescription>
              Actualiza la información del ítem y agrega el costo real si ya completaste el trabajo.
            </DialogDescription>
          </DialogHeader>
          {itemEditing && (
            <div className="space-y-5 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-descripcion">Descripción</Label>
                <Input
                  id="edit-descripcion"
                  value={itemEditing.descripcion}
                  onChange={(e) => setItemEditing({...itemEditing, descripcion: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-cantidad">Cantidad</Label>
                  <Input
                    id="edit-cantidad"
                    type="number"
                    min={1}
                    step={1}
                    value={itemEditing.cantidad}
                    onChange={(e) => setItemEditing({...itemEditing, cantidad: Number(e.target.value)})}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-precio-unitario">Costo Unitario Estimado</Label>
                  <Input
                    id="edit-precio-unitario"
                    type="number"
                    min={0}
                    step={0.01}
                    value={itemEditing.precioUnitario.valor === null ? "" : itemEditing.precioUnitario.valor}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number(e.target.value);
                      setItemEditing({
                        ...itemEditing, 
                        precioUnitario: { 
                          ...itemEditing.precioUnitario, 
                          valor: value 
                        }
                      });
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-categoria">Categoría</Label>
                <Select 
                  value={itemEditing.categoria || "sin_categoria"}
                  onValueChange={(value) => setItemEditing({...itemEditing, categoria: value === "sin_categoria" ? "" : value})}
                >
                  <SelectTrigger id="edit-categoria">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin_categoria">Sin categoría</SelectItem>
                    <SelectItem value="impresion">Impresión</SelectItem>
                    <SelectItem value="materiales">Materiales</SelectItem>
                    <SelectItem value="mano_obra">Mano de Obra</SelectItem>
                    <SelectItem value="transporte">Transporte</SelectItem>
                    <SelectItem value="servicios">Servicios</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator className="my-4" />
              
              <div className="space-y-5">
                <div className="flex items-center">
                  <h3 className="text-lg font-medium">Costo Real (post-ejecución)</h3>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Ingresa el costo real después de completar el trabajo para analizar las diferencias.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-costo-real">Costo Real Unitario</Label>
                  <Input
                    id="edit-costo-real"
                    type="number"
                    min={0}
                    step={0.01}
                    value={itemEditing.costoReal === undefined || itemEditing.costoReal === null ? "" : itemEditing.costoReal}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : Number(e.target.value);
                      setItemEditing({
                        ...itemEditing, 
                        costoReal: value
                      });
                    }}
                    className="border-green-200 focus:border-green-500"
                  />
                </div>
                
                {itemEditing.costoReal !== undefined && itemEditing.costoReal !== null && itemEditing.precioUnitario.valor !== null && (
                  <div className="p-3 rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-500">Diferencia por unidad:</span>
                      <Badge variant={itemEditing.costoReal > itemEditing.precioUnitario.valor ? "destructive" : "outline"} className={itemEditing.costoReal > itemEditing.precioUnitario.valor ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                        {formatearPrecioDOP(itemEditing.costoReal - itemEditing.precioUnitario.valor)}
                        ({((itemEditing.costoReal - itemEditing.precioUnitario.valor) / itemEditing.precioUnitario.valor * 100).toFixed(1)}%)
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-gray-500">Diferencia total:</span>
                      <Badge variant={itemEditing.costoReal > itemEditing.precioUnitario.valor ? "destructive" : "outline"} className={itemEditing.costoReal > itemEditing.precioUnitario.valor ? "" : "bg-green-100 text-green-800 hover:bg-green-100"}>
                        {formatearPrecioDOP((itemEditing.costoReal - itemEditing.precioUnitario.valor) * itemEditing.cantidad)}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>

              {itemEditing.mostrarExtendido && itemEditing.extendido && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h3 className="text-lg font-medium">Campos Extendidos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="edit-ancho">Ancho</Label>
                        <Input
                          id="edit-ancho"
                          type="number"
                          value={itemEditing.extendido.ancho === null ? "" : itemEditing.extendido.ancho}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setItemEditing({
                              ...itemEditing,
                              extendido: {
                                ...itemEditing.extendido,
                                ancho: value
                              }
                            });
                          }}
                          min={0}
                          step={0.01}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="edit-alto">Alto</Label>
                        <Input
                          id="edit-alto"
                          type="number"
                          value={itemEditing.extendido.alto === null ? "" : itemEditing.extendido.alto}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : Number(e.target.value);
                            setItemEditing({
                              ...itemEditing,
                              extendido: {
                                ...itemEditing.extendido,
                                alto: value
                              }
                            });
                          }}
                          min={0}
                          step={0.01}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={() => itemEditing && handleSaveEditedItem(itemEditing)}>
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
