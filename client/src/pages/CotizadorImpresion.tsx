import React, { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { generatePDF } from "@/lib/pdfUtils";
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
  LayoutTemplateIcon as Template,
  Info,
  BarChart4,
  Percent,
  ArrowUpDown,
  Zap,
  Lightbulb,
  Coins,
  Target,
  Check,
  X,
  type LucideIcon,
  Printer,
  PieChart,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container";
import { toast } from "@/hooks/use-toast";

import type { ItemImpresion, ItemAdicional, TemplateImpresion, EscenarioImpresion, UnidadMedida, Cliente } from "@shared/types";

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

const formatearPrecioDOP = (precio: number) => {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(precio);
};

const getTipoLabel = (tipo: string) => {
  switch (tipo) {
    case "acabado": return "Acabado";
    case "material": return "Material";
    case "instalacion": return "Instalación";
    case "diseno": return "Diseño";
    case "transporte": return "Transporte";
    default: return "Otro";
  }
};

const getTipoBadgeClass = (tipo: string) => {
  switch (tipo) {
    case "acabado": return "bg-blue-100 text-blue-800";
    case "material": return "bg-yellow-100 text-yellow-800";
    case "instalacion": return "bg-purple-100 text-purple-800";
    case "diseno": return "bg-indigo-100 text-indigo-800";
    case "transporte": return "bg-green-100 text-green-800";
    default: return "bg-gray-100 text-gray-800";
  }
};

// ItemImpresionForm Component
const ItemImpresionForm = ({ onAdd }: { onAdd: (item: ItemImpresion) => void }) => {
  const [ancho, setAncho] = useState<number | null>(null);
  const [alto, setAlto] = useState<number | null>(null);
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>("pulgadas");
  const [cantidad, setCantidad] = useState<number | null>(null);
  const [costoPorPie, setCostoPorPie] = useState<number | null>(null);
  const [precioVentaPorPie, setPrecioVentaPorPie] = useState<number | null>(null);
  const [modoPrecio, setModoPrecio] = useState<"porPie" | "total">("porPie");
  const [precioTotal, setPrecioTotal] = useState<number | null>(null);

  const anchoInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      ancho &&
      alto &&
      cantidad &&
      ((modoPrecio === "porPie" && precioVentaPorPie) || (modoPrecio === "total" && precioTotal)) &&
      costoPorPie
    ) {
      const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida);

      // Calculate price per square foot if total price was entered
      let calculatedPrecioVentaPorPie = precioVentaPorPie;
      if (modoPrecio === "total" && precioTotal) {
        calculatedPrecioVentaPorPie = precioTotal / (areaPiesCuadrados * cantidad);
      }

      onAdd({
        id: Date.now().toString(),
        ancho,
        alto,
        unidadMedida,
        cantidad,
        costoPorPie,
        precioVentaPorPie: calculatedPrecioVentaPorPie || 0,
        areaPiesCuadrados,
      });

      setAncho(null);
      setAlto(null);
      setCantidad(null);
      setCostoPorPie(null);
      setPrecioVentaPorPie(null);
      setPrecioTotal(null);

      // Focus on the first input after submission
      setTimeout(() => {
        if (anchoInputRef.current) {
          anchoInputRef.current.focus();
        }
      }, 0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ancho">Ancho</Label>
          <Input
            id="ancho"
            ref={anchoInputRef}
            type="number"
            value={ancho === null ? "" : ancho}
            onChange={(e) => setAncho(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Ancho"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="alto">Alto</Label>
          <Input
            id="alto"
            type="number"
            value={alto === null ? "" : alto}
            onChange={(e) => setAlto(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Alto"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="unidadMedida">Unidad de Medida</Label>
          <Select value={unidadMedida} onValueChange={(value: UnidadMedida) => setUnidadMedida(value)}>
            <SelectTrigger id="unidadMedida">
              <SelectValue placeholder="Unidad de Medida" />
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
          <Label htmlFor="cantidad">Cantidad</Label>
          <Input
            id="cantidad"
            type="number"
            value={cantidad === null ? "" : cantidad}
            onChange={(e) => setCantidad(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Cantidad"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="costoPorPie">Costo por pie²</Label>
          <Input
            id="costoPorPie"
            type="number"
            value={costoPorPie === null ? "" : costoPorPie}
            onChange={(e) => setCostoPorPie(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Costo por pie²"
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="modoPrecio">Modo de Precio</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="modoPorPie" className="text-sm cursor-pointer">
                Por pie²
              </Label>
              <Switch
                id="modoPrecio"
                checked={modoPrecio === "total"}
                onCheckedChange={(checked) => setModoPrecio(checked ? "total" : "porPie")}
              />
              <Label htmlFor="modoTotal" className="text-sm cursor-pointer">
                Total
              </Label>
            </div>
          </div>

          {modoPrecio === "porPie" ? (
            <div className="space-y-2">
              <Label htmlFor="precioVentaPorPie">Precio de venta por pie²</Label>
              <Input
                id="precioVentaPorPie"
                type="number"
                value={precioVentaPorPie === null ? "" : precioVentaPorPie}
                onChange={(e) => setPrecioVentaPorPie(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Precio de venta por pie²"
                required={modoPrecio === "porPie"}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="precioTotal">Precio total de venta</Label>
              <Input
                id="precioTotal"
                type="number"
                value={precioTotal === null ? "" : precioTotal}
                onChange={(e) => setPrecioTotal(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Precio total de venta"
                required={modoPrecio === "total"}
              />
              {ancho && alto && cantidad && (
                <p className="text-xs text-muted-foreground">
                  Precio por pie²:{" "}
                  {precioTotal && ancho && alto && cantidad
                    ? formatearPrecioDOP(precioTotal / (convertirAPiesCuadrados(ancho, alto, unidadMedida) * cantidad))
                    : "Calculando..."}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ítem de Impresión
      </Button>
    </form>
  );
};

// ItemAdicionalForm Component
const ItemAdicionalForm = ({ onAdd }: { onAdd: (item: ItemAdicional) => void }) => {
  const [descripcion, setDescripcion] = useState("");
  const [costo, setCosto] = useState<number | null>(null);
  const [tipo, setTipo] = useState<string>("acabado");
  const [incluido, setIncluido] = useState(true);
  const [modoPrecio, setModoPrecio] = useState<"directo" | "margen">("directo");
  const [margen, setMargen] = useState<number | null>(30);
  const [precioVenta, setPrecioVenta] = useState<number | null>(null);

  const descripcionInputRef = useRef<HTMLInputElement>(null);

  // Calculate selling price based on cost and margin
  useEffect(() => {
    if (modoPrecio === "margen" && costo !== null && margen !== null) {
      // Formula: price = cost / (1 - margin/100)
      const precio = costo / (1 - margen / 100);
      setPrecioVenta(precio);
    }
  }, [costo, margen, modoPrecio]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // If it's included, we only require description and cost
    // If not included, we also require selling price or margin
    if (
      descripcion &&
      costo !== null &&
      (incluido || (modoPrecio === "directo" ? precioVenta !== null : margen !== null))
    ) {
      // Calculate the final selling price based on the mode
      const precioFinal = incluido
        ? costo // If included, use cost as the default price
        : modoPrecio === "directo"
          ? precioVenta
          : costo / (1 - (margen || 0) / 100);

      onAdd({
        id: Date.now().toString(),
        descripcion,
        costo,
        tipo,
        incluido,
        precioVenta: precioFinal || costo,
        margen: modoPrecio === "margen" ? margen : undefined,
        modoPrecio,
      });
      setDescripcion("");
      setCosto(null);
      setPrecioVenta(null);
      setTipo("acabado");
      setIncluido(true);
      setModoPrecio("directo");
      setMargen(30);

      // Focus on the first input after submission
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
        <div className="md:col-span-1">
          <Label htmlFor="descripcion-adicional">Descripción</Label>
          <Input
            id="descripcion-adicional"
            ref={descripcionInputRef}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            className="mt-1"
            required
          />
        </div>
        <div>
          <Label htmlFor="tipo-adicional">Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="tipo-adicional">
              <SelectValue placeholder="Seleccione tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acabado">Acabado</SelectItem>
              <SelectItem value="material">Material</SelectItem>
              <SelectItem value="instalacion">Instalación</SelectItem>
              <SelectItem value="diseno">Diseño</SelectItem>
              <SelectItem value="transporte">Transporte</SelectItem>
              <SelectItem value="otros">Otros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="costo-adicional">Costo</Label>
          <Input
            id="costo-adicional"
            type="number"
            value={costo === null ? "" : costo}
            onChange={(e) => setCosto(e.target.value === "" ? null : Number(e.target.value))}
            min={0}
            className="mt-1"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between">
            <Label htmlFor="modo-precio-adicional">Modo de Precio</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="modo-directo" className="text-xs cursor-pointer">
                Directo
              </Label>
              <Switch
                id="modo-precio-adicional"
                checked={modoPrecio === "margen"}
                onCheckedChange={(checked) => setModoPrecio(checked ? "margen" : "directo")}
              />
              <Label htmlFor="modo-margen" className="text-xs cursor-pointer">
                Margen
              </Label>
            </div>
          </div>
          {modoPrecio === "directo" ? (
            <Input
              id="precio-venta-adicional"
              type="number"
              value={precioVenta === null ? "" : precioVenta}
              onChange={(e) => setPrecioVenta(e.target.value === "" ? null : Number(e.target.value))}
              placeholder="Precio de venta"
              className="mt-1"
              required={!incluido && modoPrecio === "directo"}
            />
          ) : (
            <>
              <Input
                id="margen-adicional"
                type="number"
                value={margen === null ? "" : margen}
                onChange={(e) => setMargen(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Margen (%)"
                className="mt-1"
                required={!incluido && modoPrecio === "margen"}
              />
              {costo !== null && margen !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Precio de venta: {formatearPrecioDOP(costo / (1 - margen / 100))}
                </p>
              )}
            </>
          )}
        </div>
        <div>
          <div className="flex h-full items-center pt-5">
            <div className="flex items-center space-x-2">
              <Switch id="incluido" checked={incluido} onCheckedChange={setIncluido} />
              <Label htmlFor="incluido" className="cursor-pointer">
                Incluido en el precio base
              </Label>
            </div>
          </div>
        </div>
      </div>

      <Button type="submit" className="w-full">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ítem Adicional
      </Button>
    </form>
  );
};

// Main Component
export default function CotizadorImpresion() {
  const [itemsImpresion, setItemsImpresion] = useState<ItemImpresion[]>([]);
  const [itemsAdicionales, setItemsAdicionales] = useState<ItemAdicional[]>([]);
  const [cliente, setCliente] = useState<Cliente>({
    nombre: "",
    correo: "",
    telefono: "",
    proyecto: ""
  });
  const [porcentajeComision, setPorcentajeComision] = useState<number>(10);
  const [incluirITBIS, setIncluirITBIS] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("cotizacion");
  const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);
  const [nombreEscenario, setNombreEscenario] = useState<string>("");
  const [descripcionEscenario, setDescripcionEscenario] = useState<string>("");
  const [openTemplateDialog, setOpenTemplateDialog] = useState<boolean>(false);
  const [nombreTemplate, setNombreTemplate] = useState<string>("");

  // Fetch templates and scenarios
  const { data: templates = [] } = useQuery<TemplateImpresion[]>({
    queryKey: ["/api/cotizador-impresion/templates"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { data: escenarios = [] } = useQuery<EscenarioImpresion[]>({
    queryKey: ["/api/cotizador-impresion/escenarios"],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutations for saving and loading data
  const saveEscenarioMutation = useMutation({
    mutationFn: async (escenario: EscenarioImpresion) => {
      return apiRequest("POST", "/api/cotizador-impresion/escenarios", escenario);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-impresion/escenarios"] });
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
    mutationFn: async (template: TemplateImpresion) => {
      return apiRequest("POST", "/api/cotizador-impresion/templates", template);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-impresion/templates"] });
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
      return apiRequest("DELETE", `/api/cotizador-impresion/escenarios/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-impresion/escenarios"] });
      toast({
        title: "Cotización eliminada",
        description: "La cotización se ha eliminado correctamente.",
        variant: "default",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/cotizador-impresion/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cotizador-impresion/templates"] });
      toast({
        title: "Plantilla eliminada",
        description: "La plantilla se ha eliminado correctamente.",
        variant: "default",
      });
    },
  });

  // Handlers
  const handleAddItemImpresion = (item: ItemImpresion) => {
    setItemsImpresion([...itemsImpresion, item]);
  };

  const handleAddItemAdicional = (item: ItemAdicional) => {
    setItemsAdicionales([...itemsAdicionales, item]);
  };

  const handleRemoveItemImpresion = (id: string) => {
    setItemsImpresion(itemsImpresion.filter((item) => item.id !== id));
  };

  const handleRemoveItemAdicional = (id: string) => {
    setItemsAdicionales(itemsAdicionales.filter((item) => item.id !== id));
  };

  const handleDragEndImpresion = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(itemsImpresion);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setItemsImpresion(reorderedItems);
  };

  const handleDragEndAdicional = (result: DropResult) => {
    if (!result.destination) return;

    const reorderedItems = Array.from(itemsAdicionales);
    const [movedItem] = reorderedItems.splice(result.source.index, 1);
    reorderedItems.splice(result.destination.index, 0, movedItem);

    setItemsAdicionales(reorderedItems);
  };

  const loadTemplate = (template: TemplateImpresion) => {
    setItemsImpresion(template.itemsImpresion);
    setItemsAdicionales(template.itemsAdicionales);
    toast({
      title: "Plantilla cargada",
      description: `Se ha cargado la plantilla "${template.nombre}"`,
      variant: "default",
    });
    setActiveTab("cotizacion");
  };

  const loadEscenario = (escenario: EscenarioImpresion) => {
    setItemsImpresion(escenario.itemsImpresion);
    setItemsAdicionales(escenario.itemsAdicionales);
    setPorcentajeComision(escenario.porcentajeComision);
    toast({
      title: "Cotización cargada",
      description: `Se ha cargado la cotización "${escenario.nombre}"`,
      variant: "default",
    });
    setActiveTab("cotizacion");
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
    const escenario: EscenarioImpresion = {
      id: Date.now().toString(),
      nombre: nombreEscenario,
      descripcion: descripcionEscenario,
      itemsImpresion,
      itemsAdicionales,
      porcentajeComision,
      precioFinal: calcularPrecioFinal(),
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
    const template: TemplateImpresion = {
      nombre: nombreTemplate,
      itemsImpresion,
      itemsAdicionales,
    };

    saveTemplateMutation.mutate(template);
  };

  const handleExportPDF = () => {
    // Combine included additional items with printing items for PDF generation
    const resumen = {
      subtotal: calcularSubtotalImpresion() + calcularSubtotalAdicionalesIncluidos(),
      porcentajeComision,
      itbis: incluirITBIS ? 0.18 : 0,
      total: calcularPrecioFinal(),
    };

    generatePDF({
      title: "Cotización de Impresión",
      cliente,
      items: itemsImpresion,
      itemsAdicionales,
      resumen,
      notas: "Cotización de impresión generada con el Sistema de Cotizaciones",
    });
  };

  // Calculations
  const calcularSubtotalImpresion = () => {
    return itemsImpresion.reduce((total, item) => {
      return total + item.areaPiesCuadrados * item.cantidad * item.precioVentaPorPie;
    }, 0);
  };

  const calcularSubtotalAdicionalesIncluidos = () => {
    return itemsAdicionales
      .filter((item) => item.incluido)
      .reduce((total, item) => {
        return total + (item.precioVenta || item.costo);
      }, 0);
  };

  const calcularSubtotalAdicionalesNoIncluidos = () => {
    return itemsAdicionales
      .filter((item) => !item.incluido)
      .reduce((total, item) => {
        return total + (item.precioVenta || item.costo);
      }, 0);
  };

  const calcularPrecioConComision = () => {
    const subtotal = calcularSubtotalImpresion() + calcularSubtotalAdicionalesIncluidos();
    return subtotal * (1 + porcentajeComision / 100);
  };

  const calcularITBIS = () => {
    const precioConComision = calcularPrecioConComision();
    const adicionalesNoIncluidos = calcularSubtotalAdicionalesNoIncluidos();
    return incluirITBIS ? (precioConComision + adicionalesNoIncluidos) * 0.18 : 0;
  };

  const calcularPrecioFinal = () => {
    const precioConComision = calcularPrecioConComision();
    const adicionalesNoIncluidos = calcularSubtotalAdicionalesNoIncluidos();
    const itbis = calcularITBIS();
    return precioConComision + adicionalesNoIncluidos + itbis;
  };
  
  // Variables de análisis de costos y precios para la pestaña de análisis
  const subtotalImpresion = calcularSubtotalImpresion();
  const subtotalAdicionalesIncluidos = calcularSubtotalAdicionalesIncluidos();
  const subtotalAdicionalesNoIncluidos = calcularSubtotalAdicionalesNoIncluidos();
  const subtotal = subtotalImpresion + subtotalAdicionalesIncluidos;
  const precioFinal = calcularPrecioFinal();
  const precioTotal = precioFinal;
  
  // Costos desglosados
  const costoImpresion = itemsImpresion.reduce((total, item) => {
    return total + item.areaPiesCuadrados * item.cantidad * item.costoPorPie;
  }, 0);
  
  // Costos por tipo de ítem adicional
  const costoMateriales = itemsAdicionales
    .filter(item => item.tipo === "material")
    .reduce((total, item) => total + item.costo, 0);
    
  const costoAcabados = itemsAdicionales
    .filter(item => item.tipo === "acabado")
    .reduce((total, item) => total + item.costo, 0);
    
  const costoInstalacion = itemsAdicionales
    .filter(item => item.tipo === "instalacion")
    .reduce((total, item) => total + item.costo, 0);
    
  const costoOtros = itemsAdicionales
    .filter(item => !["material", "acabado", "instalacion"].includes(item.tipo || ""))
    .reduce((total, item) => total + item.costo, 0);
    
  const costoTotal = costoImpresion + costoMateriales + costoAcabados + costoInstalacion + costoOtros;
  
  // Métricas para comparación y análisis
  const areaTotal = itemsImpresion.reduce((total, item) => {
    return total + item.areaPiesCuadrados * item.cantidad;
  }, 0);
  
  const precioImpresion = subtotalImpresion;
  const precioUnitarioPromedio = areaTotal > 0 ? precioImpresion / areaTotal : 0;
  const precioPromedioImpresion = 250; // Precio promedio del mercado por pie cuadrado

  // Render
  return (
    <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cotizador de Impresión</h1>
          <p className="mt-1 text-sm text-gray-500">Calcula precios específicos para servicios de impresión por área</p>
        </div>
        <div className="mt-4 sm:mt-0 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setActiveTab("templates")}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setSaveDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva Cotización
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <Tabs defaultValue="cotizacion" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-px flex space-x-8 border-b-0">
            <TabsTrigger value="cotizacion" className="border-b-2 border-transparent py-4 px-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary">
              <FileText className="mr-2 h-4 w-4" /> Cotización Actual
            </TabsTrigger>
            <TabsTrigger value="templates" className="border-b-2 border-transparent py-4 px-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary">
              <Template className="mr-2 h-4 w-4" /> Plantillas
            </TabsTrigger>
            <TabsTrigger value="historial" className="border-b-2 border-transparent py-4 px-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary">
              <Layers className="mr-2 h-4 w-4" /> Historial
            </TabsTrigger>
            <TabsTrigger value="analisis" className="border-b-2 border-transparent py-4 px-1 hover:border-gray-300 hover:text-gray-700 data-[state=active]:border-primary data-[state=active]:text-primary">
              <BarChart4 className="mr-2 h-4 w-4" /> Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="cotizacion" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column: Forms and Items */}
              <div className="lg:col-span-2 space-y-6">
                {/* Add Printing Items Form */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Agregar Ítem de Impresión</h2>
                    <ItemImpresionForm onAdd={handleAddItemImpresion} />
                  </CardContent>
                </Card>

                {/* Printing Items List */}
                <Card>
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Ítems de Impresión</h2>
                    <Badge variant="secondary" className="bg-secondary-100 text-secondary-800">
                      {itemsImpresion.length} ítems
                    </Badge>
                  </div>
                  <Separator />
                  <MobileOptimizedContainer>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Dimensiones</TableHead>
                          <TableHead>Pie² Unitario</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Costo Por Pie²</TableHead>
                          <TableHead>Precio Venta Por Pie²</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <DragDropContext onDragEnd={handleDragEndImpresion}>
                        <Droppable droppableId="itemsImpresion">
                          {(provided) => (
                            <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                              {itemsImpresion.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                                    No hay ítems de impresión agregados
                                  </TableCell>
                                </TableRow>
                              ) : (
                                itemsImpresion.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="hover:bg-muted/50"
                                      >
                                        <TableCell {...provided.dragHandleProps} className="w-[40px]">
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                          {item.ancho} x {item.alto} ({item.unidadMedida})
                                        </TableCell>
                                        <TableCell>{item.areaPiesCuadrados.toFixed(2)} pie²</TableCell>
                                        <TableCell>{item.cantidad}</TableCell>
                                        <TableCell>{formatearPrecioDOP(item.costoPorPie)}</TableCell>
                                        <TableCell>{formatearPrecioDOP(item.precioVentaPorPie)}</TableCell>
                                        <TableCell>
                                          {formatearPrecioDOP(item.areaPiesCuadrados * item.cantidad * item.precioVentaPorPie)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary">
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleRemoveItemImpresion(item.id)}
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

                {/* Add Additional Items Form */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Agregar Ítem Adicional</h2>
                    <ItemAdicionalForm onAdd={handleAddItemAdicional} />
                  </CardContent>
                </Card>

                {/* Additional Items List */}
                <Card>
                  <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                    <h2 className="text-lg font-medium text-gray-900">Ítems Adicionales</h2>
                    <Badge variant="secondary" className="bg-secondary-100 text-secondary-800">
                      {itemsAdicionales.length} ítems
                    </Badge>
                  </div>
                  <Separator />
                  <MobileOptimizedContainer>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40px]"></TableHead>
                          <TableHead>Descripción</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Costo</TableHead>
                          <TableHead>Precio Venta</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <DragDropContext onDragEnd={handleDragEndAdicional}>
                        <Droppable droppableId="itemsAdicionales">
                          {(provided) => (
                            <TableBody ref={provided.innerRef} {...provided.droppableProps}>
                              {itemsAdicionales.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
                                    No hay ítems adicionales agregados
                                  </TableCell>
                                </TableRow>
                              ) : (
                                itemsAdicionales.map((item, index) => (
                                  <Draggable key={item.id} draggableId={item.id} index={index}>
                                    {(provided) => (
                                      <TableRow
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className="hover:bg-muted/50"
                                      >
                                        <TableCell {...provided.dragHandleProps} className="w-[40px]">
                                          <GripVertical className="h-4 w-4 text-muted-foreground" />
                                        </TableCell>
                                        <TableCell className="font-medium">{item.descripcion}</TableCell>
                                        <TableCell>
                                          <Badge variant="secondary" className={getTipoBadgeClass(item.tipo || "otros")}>
                                            {getTipoLabel(item.tipo || "otros")}
                                          </Badge>
                                        </TableCell>
                                        <TableCell>{formatearPrecioDOP(item.costo)}</TableCell>
                                        <TableCell>{formatearPrecioDOP(item.precioVenta || item.costo)}</TableCell>
                                        <TableCell>
                                          <Badge
                                            variant={item.incluido ? "outline" : "secondary"}
                                            className={
                                              item.incluido
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                            }
                                          >
                                            {item.incluido ? "Incluido" : "No incluido"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                          <Button variant="ghost" size="icon" className="h-8 w-8 text-secondary">
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive"
                                            onClick={() => handleRemoveItemAdicional(item.id)}
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

              {/* Right Column: Client Data, Summary and Actions */}
              <div className="space-y-6">
                {/* Client Data */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Datos del Cliente</h2>
                    <div className="mt-4 space-y-4">
                      <div>
                        <Label htmlFor="nombre-cliente-imp">Nombre / Empresa</Label>
                        <Input
                          id="nombre-cliente-imp"
                          value={cliente.nombre}
                          onChange={(e) => setCliente({ ...cliente, nombre: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="correo-cliente-imp">Correo electrónico</Label>
                        <Input
                          id="correo-cliente-imp"
                          type="email"
                          value={cliente.correo}
                          onChange={(e) => setCliente({ ...cliente, correo: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="telefono-cliente-imp">Teléfono</Label>
                        <Input
                          id="telefono-cliente-imp"
                          type="tel"
                          value={cliente.telefono}
                          onChange={(e) => setCliente({ ...cliente, telefono: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="proyecto-cliente-imp">Proyecto</Label>
                        <Input
                          id="proyecto-cliente-imp"
                          value={cliente.proyecto}
                          onChange={(e) => setCliente({ ...cliente, proyecto: e.target.value })}
                          className="mt-1"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Summary Card */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Resumen de Cotización</h2>
                    <dl className="mt-4 space-y-4">
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Subtotal de impresión</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatearPrecioDOP(calcularSubtotalImpresion())}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm font-medium text-gray-500">Subtotal adicionales incluidos</dt>
                        <dd className="text-sm font-medium text-gray-900">{formatearPrecioDOP(calcularSubtotalAdicionalesIncluidos())}</dd>
                      </div>
                      <div className="border-t border-gray-200 pt-4 flex justify-between">
                        <dt className="flex items-center text-sm font-medium text-gray-500">
                          <span>Adicionales no incluidos</span>
                        </dt>
                        <dd className="text-sm font-medium text-gray-900">{formatearPrecioDOP(calcularSubtotalAdicionalesNoIncluidos())}</dd>
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
                        <dd className="text-base font-medium text-secondary">{formatearPrecioDOP(calcularPrecioFinal())}</dd>
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
                        <Label htmlFor="porcentaje-comision-imp">Porcentaje de comisión (%)</Label>
                        <Input
                          id="porcentaje-comision-imp"
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
                          id="incluir-itbis-imp"
                          checked={incluirITBIS}
                          onCheckedChange={setIncluirITBIS}
                        />
                        <Label htmlFor="incluir-itbis-imp">Incluir ITBIS (18%)</Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Actions Card */}
                <Card>
                  <CardContent className="px-4 py-5 sm:p-6">
                    <h2 className="text-lg font-medium text-gray-900">Acciones</h2>
                    <div className="mt-4 space-y-3">
                      <Button className="w-full" variant="secondary" onClick={() => setSaveDialogOpen(true)}>
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
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.length === 0 ? (
                <div className="col-span-full text-center py-10">
                  <Template className="h-12 w-12 mx-auto text-muted-foreground" />
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
                            onClick={() => deleteTemplateMutation.mutate(template.id || "")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <CardDescription>
                        {template.itemsImpresion.length} ítems de impresión, {template.itemsAdicionales.length} adicionales
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-3">
                      <div className="text-sm text-muted-foreground mb-2">
                        <div className="font-medium text-gray-700">Ítems de impresión:</div>
                        <ul className="list-disc pl-5 space-y-1">
                          {template.itemsImpresion.slice(0, 2).map((item) => (
                            <li key={item.id}>
                              {item.ancho} x {item.alto} ({item.unidadMedida})
                            </li>
                          ))}
                          {template.itemsImpresion.length > 2 && (
                            <li>Y {template.itemsImpresion.length - 2} ítems más...</li>
                          )}
                        </ul>
                      </div>
                      {template.itemsAdicionales.length > 0 && (
                        <div className="text-sm text-muted-foreground">
                          <div className="font-medium text-gray-700">Ítems adicionales:</div>
                          <ul className="list-disc pl-5 space-y-1">
                            {template.itemsAdicionales.slice(0, 2).map((item) => (
                              <li key={item.id}>{item.descripcion}</li>
                            ))}
                            {template.itemsAdicionales.length > 2 && (
                              <li>Y {template.itemsAdicionales.length - 2} ítems más...</li>
                            )}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                    <div className="bg-muted/50 px-4 py-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
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
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
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
                        <span>Ítems:</span>
                        <span>{escenario.itemsImpresion.length} impresión, {escenario.itemsAdicionales.length} adicionales</span>
                      </div>
                      <div className="flex justify-between text-sm mt-1">
                        <span>Total:</span>
                        <span className="font-medium text-secondary">
                          {formatearPrecioDOP(escenario.precioFinal || 0)}
                        </span>
                      </div>
                    </CardContent>
                    <div className="bg-muted/50 px-4 py-3 flex justify-end">
                      <Button
                        size="sm"
                        variant="secondary"
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

          <TabsContent value="analisis" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Análisis de Costos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    <DollarSign className="h-5 w-5 text-primary inline mr-2" />
                    Análisis de Costos
                  </CardTitle>
                  <CardDescription>
                    Desglose de costos y rentabilidad del proyecto
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-700 mb-1">Costo Total</h3>
                        <p className="text-xl font-bold text-blue-900">
                          {formatearPrecioDOP(costoTotal)}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Suma de todos los costos de producción
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h3 className="text-sm font-medium text-green-700 mb-1">Precio Final</h3>
                        <p className="text-xl font-bold text-green-900">
                          {formatearPrecioDOP(precioTotal)}
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Precio final incluyendo ITBIS
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h3 className="text-sm font-medium mb-2">Desglose de Rentabilidad</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Margen Bruto:</span>
                          <span className="font-medium">
                            {precioFinal > 0 && costoTotal > 0
                              ? `${(((precioFinal - costoTotal) / precioFinal) * 100).toFixed(2)}%`
                              : "0%"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ganancia Bruta:</span>
                          <span className="font-medium">{formatearPrecioDOP(precioFinal - costoTotal)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Comisión ({porcentajeComision}%):</span>
                          <span className="font-medium">{formatearPrecioDOP((precioFinal * porcentajeComision) / 100)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Ganancia Neta:</span>
                          <span className="font-medium">{formatearPrecioDOP(precioFinal - costoTotal - (precioFinal * porcentajeComision) / 100)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Distribución de Costos */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    <PieChart className="h-5 w-5 text-primary inline mr-2" />
                    Distribución de Costos
                  </CardTitle>
                  <CardDescription>
                    Análisis por categoría de productos y servicios
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium mb-2">Por Tipo de Ítem</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Impresión</span>
                          <span className="text-sm font-medium">
                            {formatearPrecioDOP(costoImpresion)} 
                            ({costoTotal > 0 ? `${((costoImpresion / costoTotal) * 100).toFixed(1)}%` : "0%"})
                          </span>
                        </div>
                        <Progress className="h-2" value={(costoImpresion / costoTotal) * 100} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Materiales</span>
                          <span className="text-sm font-medium">
                            {formatearPrecioDOP(costoMateriales)} 
                            ({costoTotal > 0 ? `${((costoMateriales / costoTotal) * 100).toFixed(1)}%` : "0%"})
                          </span>
                        </div>
                        <Progress className="h-2" value={(costoMateriales / costoTotal) * 100} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Acabados</span>
                          <span className="text-sm font-medium">
                            {formatearPrecioDOP(costoAcabados)} 
                            ({costoTotal > 0 ? `${((costoAcabados / costoTotal) * 100).toFixed(1)}%` : "0%"})
                          </span>
                        </div>
                        <Progress className="h-2" value={(costoAcabados / costoTotal) * 100} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Instalación</span>
                          <span className="text-sm font-medium">
                            {formatearPrecioDOP(costoInstalacion)} 
                            ({costoTotal > 0 ? `${((costoInstalacion / costoTotal) * 100).toFixed(1)}%` : "0%"})
                          </span>
                        </div>
                        <Progress className="h-2" value={(costoInstalacion / costoTotal) * 100} />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Otros</span>
                          <span className="text-sm font-medium">
                            {formatearPrecioDOP(costoOtros)} 
                            ({costoTotal > 0 ? `${((costoOtros / costoTotal) * 100).toFixed(1)}%` : "0%"})
                          </span>
                        </div>
                        <Progress className="h-2" value={(costoOtros / costoTotal) * 100} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recomendaciones de Optimización */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    <Lightbulb className="h-5 w-5 text-primary inline mr-2" />
                    Recomendaciones de Optimización
                  </CardTitle>
                  <CardDescription>
                    Sugerencias para mejorar la rentabilidad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {precioImpresion > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
                          <Zap className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-blue-900">Optimización de materiales</h4>
                          <p className="text-xs text-blue-700 mt-1">
                            Ajustar las dimensiones para reducir el desperdicio puede disminuir los costos en aproximadamente un 5-10%.
                          </p>
                        </div>
                      </div>
                    )}

                    {costoImpresion > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <div className="p-1.5 bg-green-100 rounded-full text-green-600">
                          <Target className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-green-900">Análisis de precios</h4>
                          <p className="text-xs text-green-700 mt-1">
                            El margen actual está {costoImpresion > 0 && precioImpresion > 0
                              ? (precioImpresion / costoImpresion) < 2
                                ? "por debajo del promedio del sector (2x)"
                                : "en línea con el promedio del sector"
                              : "pendiente de analizar"}. 
                            {costoImpresion > 0 && precioImpresion > 0 && (precioImpresion / costoImpresion) < 2
                              ? " Considere aumentar el precio por pie²."
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}

                    {itemsAdicionales.length > 0 && (
                      <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                        <div className="p-1.5 bg-yellow-100 rounded-full text-yellow-600">
                          <Info className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-yellow-900">Servicios adicionales</h4>
                          <p className="text-xs text-yellow-700 mt-1">
                            Hay {itemsAdicionales.filter(item => !item.incluido).length} servicios adicionales no incluidos en el precio base.
                            {itemsAdicionales.filter(item => !item.incluido).length > 2
                              ? " Considere incluir algunos en el precio base para simplificar la cotización."
                              : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comparación con Proyectos Similares */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">
                    <BarChart4 className="h-5 w-5 text-primary inline mr-2" />
                    Análisis Comparativo
                  </CardTitle>
                  <CardDescription>
                    Comparación con proyectos similares
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-sm font-medium">Precio por pie²</h3>
                        <p className="text-xs text-muted-foreground">Comparado con proyectos similares</p>
                      </div>
                      <Badge variant="outline" className={
                        precioPromedioImpresion > 0 && precioUnitarioPromedio > 0
                          ? precioUnitarioPromedio > precioPromedioImpresion * 1.1
                            ? "bg-green-50 text-green-700 border-green-200"
                            : precioUnitarioPromedio < precioPromedioImpresion * 0.9
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-gray-50 text-gray-500"
                      }>
                        {precioUnitarioPromedio > 0 && precioPromedioImpresion > 0
                          ? precioUnitarioPromedio > precioPromedioImpresion
                            ? `${((precioUnitarioPromedio / precioPromedioImpresion - 1) * 100).toFixed(1)}% más alto`
                            : `${((1 - precioUnitarioPromedio / precioPromedioImpresion) * 100).toFixed(1)}% más bajo`
                          : "Sin datos suficientes"}
                      </Badge>
                    </div>

                    <div className="space-y-3 pt-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
                          <span className="text-sm">Proyecto actual</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatearPrecioDOP(precioUnitarioPromedio)} / pie²
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-secondary rounded-full mr-2"></div>
                          <span className="text-sm">Promedio de proyectos</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatearPrecioDOP(precioPromedioImpresion)} / pie²
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-3 h-3 bg-muted rounded-full mr-2"></div>
                          <span className="text-sm">Precio más alto</span>
                        </div>
                        <span className="text-sm font-medium">
                          {formatearPrecioDOP(precioPromedioImpresion * 1.25)} / pie²
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Guardar Cotización de Impresión</DialogTitle>
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
            <Button type="submit" variant="secondary" onClick={handleSaveEscenario}>
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
            <Button type="submit" variant="secondary" onClick={handleSaveTemplate}>
              Guardar Plantilla
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
