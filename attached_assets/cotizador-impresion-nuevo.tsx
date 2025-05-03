"use client"

import React, { useState, useRef, useEffect } from "react"
import { DragDropContext, Droppable, Draggable, type DropResult } from "react-beautiful-dnd"
import Link from "next/link"
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
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { Switch } from "@/components/ui/switch"
import {
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
  PieChart,
  Pie,
} from "recharts"

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"

// Importar y usar el contenedor optimizado para móviles
import { MobileOptimizedContainer } from "@/components/mobile-optimized-container"

// Types
type UnidadMedida = "pulgadas" | "pies" | "centimetros" | "metros"

interface ItemBase {
  id: string
}

interface ItemImpresion extends ItemBase {
  ancho: number
  alto: number
  unidadMedida: UnidadMedida
  cantidad: number
  costoPorPie: number
  precioVentaPorPie: number
  areaPiesCuadrados: number
}

// Modificar la interfaz ItemAdicional para incluir campos de precio de venta y modo de cálculo
interface ItemAdicional extends ItemBase {
  descripcion: string
  costo: number
  tipo?: string
  incluido: boolean // Indica si el ítem está incluido en el precio base
  precioVenta?: number // Precio de venta calculado o ingresado directamente
  margen?: number // Porcentaje de margen si se calcula por porcentaje
  modoPrecio: "directo" | "margen" // Indica cómo se calcula el precio
}

type TemplateType = {
  nombre: string
  itemsImpresion: ItemImpresion[]
  itemsAdicionales: ItemAdicional[]
}

type Escenario = {
  id: string
  nombre: string
  descripcion: string
  itemsImpresion: ItemImpresion[]
  itemsAdicionales: ItemAdicional[]
  porcentajeComision: number
  precioFinal?: number
  fechaCreacion: string
}

// Utility functions
const convertirAPiesCuadrados = (ancho: number, alto: number, unidad: UnidadMedida): number => {
  const factorConversion = {
    pulgadas: 1 / 144,
    pies: 1,
    centimetros: 1 / 929.0304,
    metros: 10.7639,
  }
  return ancho * alto * factorConversion[unidad]
}

const formatearPrecioDOP = (precio: number) => {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(precio)
}

// Sub-components
const ItemImpresionForm = ({ onAdd }: { onAdd: (item: ItemImpresion) => void }) => {
  const [ancho, setAncho] = useState<number | null>(null)
  const [alto, setAlto] = useState<number | null>(null)
  const [unidadMedida, setUnidadMedida] = useState<UnidadMedida>("pulgadas")
  const [cantidad, setCantidad] = useState<number | null>(null)
  const [costoPorPie, setCostoPorPie] = useState<number | null>(null)
  const [precioVentaPorPie, setPrecioVentaPorPie] = useState<number | null>(null)
  const [modoPrecio, setModoPrecio] = useState<"porPie" | "total">("porPie")
  const [precioTotal, setPrecioTotal] = useState<number | null>(null)

  // Añadir referencia al primer input
  const anchoInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      ancho &&
      alto &&
      cantidad &&
      ((modoPrecio === "porPie" && precioVentaPorPie) || (modoPrecio === "total" && precioTotal)) &&
      costoPorPie
    ) {
      const areaPiesCuadrados = convertirAPiesCuadrados(ancho, alto, unidadMedida)

      // Calcular el precio por pie cuadrado si se ingresó el precio total
      let calculatedPrecioVentaPorPie = precioVentaPorPie
      if (modoPrecio === "total" && precioTotal) {
        calculatedPrecioVentaPorPie = precioTotal / (areaPiesCuadrados * cantidad)
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
      })

      setAncho(null)
      setAlto(null)
      setCantidad(null)
      setCostoPorPie(null)
      setPrecioVentaPorPie(null)
      setPrecioTotal(null)

      // Enfocar el primer input después de enviar el formulario
      setTimeout(() => {
        if (anchoInputRef.current) {
          anchoInputRef.current.focus()
        }
      }, 0)
    }
  }

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
  )
}

// Actualizar el componente ItemAdicionalForm para incluir la opción de calcular por porcentaje o precio directo
const ItemAdicionalForm = ({ onAdd }: { onAdd: (item: ItemAdicional) => void }) => {
  const [descripcion, setDescripcion] = useState("")
  const [costo, setCosto] = useState<number | null>(null)
  const [tipo, setTipo] = useState<string>("acabado")
  const [incluido, setIncluido] = useState(true) // Por defecto, está incluido (se suma al precio)
  const [modoPrecio, setModoPrecio] = useState<"directo" | "margen">("directo")
  const [margen, setMargen] = useState<number | null>(30) // Margen por defecto del 30%
  const [precioVenta, setPrecioVenta] = useState<number | null>(null)

  // Añadir referencia al primer input
  const descripcionInputRef = useRef<HTMLInputElement>(null)

  // Calcular precio de venta basado en costo y margen
  useEffect(() => {
    if (modoPrecio === "margen" && costo !== null && margen !== null) {
      // Fórmula: precio = costo / (1 - margen/100)
      const precio = costo / (1 - margen / 100)
      setPrecioVenta(precio)
    }
  }, [costo, margen, modoPrecio])

  // Modificar la función handleSubmit en el componente ItemAdicionalForm para hacer que el precio sea opcional cuando el ítem está incluido
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Si está incluido, solo requerimos descripción y costo
    // Si no está incluido, requerimos también precio de venta o margen
    if (
      descripcion &&
      costo !== null &&
      (incluido || (modoPrecio === "directo" ? precioVenta !== null : margen !== null))
    ) {
      // Calcular el precio de venta final según el modo
      const precioFinal = incluido
        ? costo // Si está incluido, usamos el costo como precio por defecto
        : modoPrecio === "directo"
          ? precioVenta
          : costo / (1 - (margen || 0) / 100)

      onAdd({
        id: Date.now().toString(),
        descripcion,
        costo,
        tipo,
        incluido,
        precioVenta: precioFinal || costo,
        margen: modoPrecio === "margen" ? margen : undefined,
        modoPrecio,
      })
      setDescripcion("")
      setCosto(null)
      setPrecioVenta(null)
      setTipo("acabado")
      setIncluido(true)

      // Enfocar el primer input después de enviar el formulario
      setTimeout(() => {
        if (descripcionInputRef.current) {
          descripcionInputRef.current.focus()
        }
      }, 0)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            ref={descripcionInputRef}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Clear, Laminado, Instalación"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoAdicional">Tipo</Label>
          <Select value={tipo} onValueChange={setTipo}>
            <SelectTrigger id="tipoAdicional">
              <SelectValue placeholder="Seleccione tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="acabado">Acabado</SelectItem>
              <SelectItem value="material">Material adicional</SelectItem>
              <SelectItem value="servicio">Servicio</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="costo">Costo</Label>
          <Input
            id="costo"
            type="number"
            value={costo === null ? "" : costo}
            onChange={(e) => setCosto(e.target.value === "" ? null : Number(e.target.value))}
            placeholder="Costo del ítem"
            required
          />
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-4 mb-2">
        <Switch id="incluido" checked={incluido} onCheckedChange={setIncluido} />
        <Label htmlFor="incluido" className="cursor-pointer">
          Incluido en el precio base (no suma al total)
        </Label>
      </div>

      <div className="space-y-2 mt-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="modoPrecio">Modo de Precio {!incluido && <span className="text-red-500">*</span>}</Label>
          <div className="flex items-center space-x-2">
            <Label htmlFor="modoDirecto" className="text-sm cursor-pointer">
              Precio directo
            </Label>
            <Switch
              id="modoPrecio"
              checked={modoPrecio === "margen"}
              onCheckedChange={(checked) => setModoPrecio(checked ? "margen" : "directo")}
              disabled={incluido}
            />
            <Label htmlFor="modoMargen" className="text-sm cursor-pointer">
              Por margen
            </Label>
          </div>
        </div>

        {!incluido &&
          (modoPrecio === "directo" ? (
            <div className="space-y-2">
              <Label htmlFor="precioVenta">Precio de venta</Label>
              <Input
                id="precioVenta"
                type="number"
                value={precioVenta === null ? "" : precioVenta}
                onChange={(e) => setPrecioVenta(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Precio de venta"
                required={!incluido && modoPrecio === "directo"}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="margen">Margen de ganancia (%)</Label>
              <Input
                id="margen"
                type="number"
                value={margen === null ? "" : margen}
                onChange={(e) => setMargen(e.target.value === "" ? null : Number(e.target.value))}
                placeholder="Porcentaje de margen"
                required={!incluido && modoPrecio === "margen"}
              />
              {costo !== null && margen !== null && (
                <p className="text-xs text-muted-foreground">
                  Precio de venta calculado: {formatearPrecioDOP(costo / (1 - margen / 100))}
                </p>
              )}
            </div>
          ))}
      </div>
      <Button type="submit" className="w-full mt-4">
        <Plus className="mr-2 h-4 w-4" /> Agregar Ítem Adicional
      </Button>
    </form>
  )
}

const DraggableItemList = <T extends ItemBase>({
  items,
  onRemove,
  renderItem,
  onDoubleClick,
  headers,
}: {
  items: T[]
  onRemove: (id: string) => void
  renderItem: (item: T) => React.ReactNode
  onDoubleClick?: (item: T) => void
  headers: string[]
}) => {
  return (
    <DragDropContext onDragEnd={() => {}}>
      <Droppable droppableId="items" type="ITEM">
        {(provided) => (
          <div className="border rounded-md">
            <Table {...provided.droppableProps} ref={provided.innerRef}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  {headers.map((header, index) => (
                    <TableHead key={index}>{header}</TableHead>
                  ))}
                  <TableHead className="w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={headers.length + 2} className="text-center text-muted-foreground py-6">
                      No hay ítems agregados
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided) => (
                        <TableRow
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          onDoubleClick={() => onDoubleClick && onDoubleClick(item)}
                          className={onDoubleClick ? "cursor-pointer hover:bg-muted/50" : ""}
                        >
                          <TableCell>
                            <div {...provided.dragHandleProps} className="flex items-center justify-center">
                              <GripVertical className="h-5 w-5 text-muted-foreground" />
                            </div>
                          </TableCell>
                          {renderItem(item)}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {onDoubleClick && (
                                <Button variant="ghost" size="icon" onClick={() => onDoubleClick(item)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onRemove(item.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </TableBody>
            </Table>
          </div>
        )}
      </Droppable>
    </DragDropContext>
  )
}

// Componente de diálogo de edición separado
const EditarItemDialog = React.memo(
  ({
    item,
    isOpen,
    onClose,
    onSave,
  }: {
    item: ItemImpresion | null
    isOpen: boolean
    onClose: () => void
    onSave: (item: ItemImpresion) => void
  }) => {
    const [formValues, setFormValues] = useState<{
      ancho: number
      alto: number
      unidadMedida: UnidadMedida
      cantidad: number
      costoPorPie: number
      precioVentaPorPie: number
    }>({
      ancho: 0,
      alto: 0,
      unidadMedida: "pulgadas",
      cantidad: 0,
      costoPorPie: 0,
      precioVentaPorPie: 0,
    })

    const [modoPrecioEdit, setModoPrecioEdit] = useState<"porPie" | "total">("porPie")
    const [precioTotalEdit, setPrecioTotalEdit] = useState<number | null>(null)

    // Referencias para mantener el foco
    const anchoRef = useRef<HTMLInputElement>(null)
    const altoRef = useRef<HTMLInputElement>(null)
    const cantidadRef = useRef<HTMLInputElement>(null)
    const costoPorPieRef = useRef<HTMLInputElement>(null)
    const precioVentaPorPieRef = useRef<HTMLInputElement>(null)

    // Referencia al elemento actualmente enfocado
    const focusedElementRef = useRef<string | null>(null)

    // Inicializar el formulario cuando se abre el diálogo
    useEffect(() => {
      if (item && isOpen) {
        setFormValues({
          ancho: item.ancho,
          alto: item.alto,
          unidadMedida: item.unidadMedida,
          cantidad: item.cantidad,
          costoPorPie: item.costoPorPie,
          precioVentaPorPie: item.precioVentaPorPie,
        })

        // Calcular el precio total basado en los valores existentes
        const areaPiesCuadrados = convertirAPiesCuadrados(item.ancho, item.alto, item.unidadMedida)
        setPrecioTotalEdit(item.precioVentaPorPie * areaPiesCuadrados * item.cantidad)
        setModoPrecioEdit("porPie") // Por defecto, usar el modo por pie cuadrado
      }
    }, [item, isOpen])

    // Restaurar el foco después de cada renderizado
    useEffect(() => {
      if (isOpen && focusedElementRef.current) {
        const refs: Record<string, React.RefObject<HTMLInputElement>> = {
          ancho: anchoRef,
          alto: altoRef,
          cantidad: cantidadRef,
          costoPorPie: costoPorPieRef,
          precioVentaPorPie: precioVentaPorPieRef,
        }

        const ref = refs[focusedElementRef.current]
        if (ref && ref.current) {
          ref.current.focus()
        }
      }
    })

    const handleInputChange = (field: keyof typeof formValues, value: any) => {
      focusedElementRef.current = field
      setFormValues((prev) => ({
        ...prev,
        [field]: typeof value === "string" ? Number(value) : value,
      }))
    }

    const handleGuardarCambios = () => {
      if (!item) return

      const areaPiesCuadrados = convertirAPiesCuadrados(formValues.ancho, formValues.alto, formValues.unidadMedida)

      // Calcular el precio por pie cuadrado si se está usando el modo de precio total
      let finalPrecioVentaPorPie = formValues.precioVentaPorPie
      if (modoPrecioEdit === "total" && precioTotalEdit !== null) {
        finalPrecioVentaPorPie = precioTotalEdit / (areaPiesCuadrados * formValues.cantidad)
      }

      onSave({
        ...item,
        ...formValues,
        precioVentaPorPie: finalPrecioVentaPorPie,
        areaPiesCuadrados,
      })
    }

    if (!item) return null

    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Ítem de Impresión</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-ancho">Ancho</Label>
                <Input
                  id="edit-ancho"
                  ref={anchoRef}
                  type="number"
                  value={formValues.ancho}
                  onChange={(e) => handleInputChange("ancho", e.target.value)}
                  onFocus={() => {
                    focusedElementRef.current = "ancho"
                  }}
                  autoFocus={!focusedElementRef.current || focusedElementRef.current === "ancho"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-alto">Alto</Label>
                <Input
                  id="edit-alto"
                  ref={altoRef}
                  type="number"
                  value={formValues.alto}
                  onChange={(e) => handleInputChange("alto", e.target.value)}
                  onFocus={() => {
                    focusedElementRef.current = "alto"
                  }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-unidad">Unidad de Medida</Label>
              <Select
                value={formValues.unidadMedida}
                onValueChange={(value: UnidadMedida) => handleInputChange("unidadMedida", value)}
              >
                <SelectTrigger id="edit-unidad">
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
              <Label htmlFor="edit-cantidad">Cantidad</Label>
              <Input
                id="edit-cantidad"
                ref={cantidadRef}
                type="number"
                value={formValues.cantidad}
                onChange={(e) => handleInputChange("cantidad", e.target.value)}
                onFocus={() => {
                  focusedElementRef.current = "cantidad"
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-costo">Costo por pie²</Label>
              <Input
                id="edit-costo"
                ref={costoPorPieRef}
                type="number"
                value={formValues.costoPorPie}
                onChange={(e) => handleInputChange("costoPorPie", e.target.value)}
                onFocus={() => {
                  focusedElementRef.current = "costoPorPie"
                }}
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Modo de Precio</Label>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="editModoPorPie" className="text-sm cursor-pointer">
                    Por pie²
                  </Label>
                  <Switch
                    checked={modoPrecioEdit === "total"}
                    onCheckedChange={(checked) => setModoPrecioEdit(checked ? "total" : "porPie")}
                  />
                  <Label htmlFor="editModoTotal" className="text-sm cursor-pointer">
                    Total
                  </Label>
                </div>
              </div>

              {modoPrecioEdit === "porPie" ? (
                <div className="space-y-2">
                  <Label htmlFor="edit-precio">Precio de venta por pie²</Label>
                  <Input
                    id="edit-precio"
                    ref={precioVentaPorPieRef}
                    type="number"
                    value={formValues.precioVentaPorPie}
                    onChange={(e) => handleInputChange("precioVentaPorPie", e.target.value)}
                    onFocus={() => {
                      focusedElementRef.current = "precioVentaPorPie"
                    }}
                  />
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="edit-precioTotal">Precio total de venta</Label>
                  <Input
                    id="edit-precioTotal"
                    type="number"
                    value={precioTotalEdit === null ? "" : precioTotalEdit}
                    onChange={(e) => setPrecioTotalEdit(e.target.value === "" ? null : Number(e.target.value))}
                  />
                  {formValues.ancho && formValues.alto && formValues.cantidad && precioTotalEdit && (
                    <p className="text-xs text-muted-foreground">
                      Precio por pie²:{" "}
                      {formatearPrecioDOP(
                        precioTotalEdit /
                          (convertirAPiesCuadrados(formValues.ancho, formValues.alto, formValues.unidadMedida) *
                            formValues.cantidad),
                      )}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </DialogClose>
            <Button onClick={handleGuardarCambios}>Guardar Cambios</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  },
)

// Componente de resumen
const ResumenCotizacion = ({
  itemsImpresion,
  itemsAdicionales,
  porcentajeComision,
}: {
  itemsImpresion: ItemImpresion[]
  itemsAdicionales: ItemAdicional[]
  porcentajeComision: number
}) => {
  const costoTotalImpresion = itemsImpresion.reduce(
    (total, item) => total + item.costoPorPie * item.areaPiesCuadrados * item.cantidad,
    0,
  )
  const precioVentaTotalImpresion = itemsImpresion.reduce(
    (total, item) => total + item.precioVentaPorPie * item.areaPiesCuadrados * item.cantidad,
    0,
  )

  // Calcular el costo total de adicionales (TODOS, incluidos y no incluidos)
  const costoTotalAdicionales = itemsAdicionales.reduce((total, item) => total + item.costo, 0)

  // Calcular el costo de los ítems incluidos (que no se cobran pero sí representan un gasto)
  const costoItemsIncluidos = itemsAdicionales
    .filter((item) => item.incluido)
    .reduce((total, item) => total + item.costo, 0)

  // Calcular el precio de venta total de adicionales (solo los no incluidos)
  const precioVentaTotalAdicionales = itemsAdicionales
    .filter((item) => !item.incluido)
    .reduce((total, item) => total + (item.precioVenta || item.costo), 0)

  const margenGananciaPromedio =
    precioVentaTotalImpresion > 0
      ? ((precioVentaTotalImpresion - costoTotalImpresion) / precioVentaTotalImpresion) * 100
      : 0

  // Calcular el margen de ganancia final considerando tanto impresión como adicionales
  const margenGananciaFinal =
    precioVentaTotalImpresion + precioVentaTotalAdicionales > 0
      ? ((precioVentaTotalImpresion + precioVentaTotalAdicionales - costoTotalImpresion - costoTotalAdicionales) /
          (precioVentaTotalImpresion + precioVentaTotalAdicionales)) *
        100
      : 0

  // Calcular la comisión sobre el precio de venta total (impresión + adicionales)

  const comision = ((precioVentaTotalImpresion + precioVentaTotalAdicionales) * porcentajeComision) / 100

  // Calcular la ganancia post-comisión
  const gananciaPostComision =
    precioVentaTotalImpresion + precioVentaTotalAdicionales - costoTotalImpresion - costoTotalAdicionales - comision

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Costos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground flex items-center gap-1">
                Costo de Impresión
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Suma del costo de todos los ítems de impresión (costo por pie² × área × cantidad)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </span>
              <span className="font-medium">{formatearPrecioDOP(costoTotalImpresion)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Costo de Adicionales (no incluidos):</span>
              <span className="font-medium">{formatearPrecioDOP(costoTotalAdicionales - costoItemsIncluidos)}</span>
            </div>
            {costoItemsIncluidos > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Costo de Ítems Incluidos:</span>
                <span className="font-medium text-amber-600">{formatearPrecioDOP(costoItemsIncluidos)}</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium">Costo Total:</span>
              <span className="font-bold">{formatearPrecioDOP(costoTotalImpresion + costoTotalAdicionales)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Ventas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio Base Impresión:</span>
              <span className="font-medium">{formatearPrecioDOP(precioVentaTotalImpresion)}</span>
            </div>
            {itemsAdicionales.filter((item) => !item.incluido).length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ítems Adicionales (cobrados):</span>
                <span className="font-medium">{formatearPrecioDOP(precioVentaTotalAdicionales)}</span>
              </div>
            )}
            {itemsAdicionales.filter((item) => item.incluido).length > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ítems Incluidos (no cobrados):</span>
                <span className="font-medium text-amber-600">
                  {itemsAdicionales.filter((item) => item.incluido).length} ítem(s) -{" "}
                  {formatearPrecioDOP(costoItemsIncluidos)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Precio Final:</span>
              <span className="font-medium">
                {formatearPrecioDOP(precioVentaTotalImpresion + precioVentaTotalAdicionales)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comisión ({porcentajeComision}%):</span>
              <span className="font-medium">{formatearPrecioDOP(comision)}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="font-medium">Ganancia Final:</span>
              <span className="font-bold">{formatearPrecioDOP(gananciaPostComision)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center">
            <Info className="mr-2 h-5 w-5" />
            Márgenes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Margen de Impresión</span>
              <div className="flex items-center justify-between">
                <span className="font-medium">{margenGananciaPromedio.toFixed(2)}%</span>
                <Badge
                  variant={
                    margenGananciaPromedio > 30 ? "success" : margenGananciaPromedio > 15 ? "warning" : "destructive"
                  }
                >
                  {margenGananciaPromedio > 30 ? "Bueno" : margenGananciaPromedio > 15 ? "Regular" : "Bajo"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Margen Final</span>
              <div className="flex items-center justify-between">
                <span className="font-medium">{margenGananciaFinal.toFixed(2)}%</span>
                <Badge
                  variant={margenGananciaFinal > 30 ? "success" : margenGananciaFinal > 15 ? "warning" : "destructive"}
                >
                  {margenGananciaFinal > 30 ? "Bueno" : margenGananciaFinal > 15 ? "Regular" : "Bajo"}
                </Badge>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-sm text-muted-foreground">Ganancia Post-Comisión</span>
              <div className="flex items-center justify-between">
                <span className="font-bold">{formatearPrecioDOP(gananciaPostComision)}</span>
                <Badge variant={gananciaPostComision > 0 ? "success" : "destructive"}>
                  {gananciaPostComision > 0 ? "Rentable" : "Pérdida"}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Añadir el componente VisualizadorEscenarios justo antes del componente principal
const VisualizadorEscenarios = ({
  escenarios,
  onAplicarEscenario,
  onEliminarEscenario,
}: {
  escenarios: Escenario[]
  onAplicarEscenario: (escenario: Escenario) => void
  onEliminarEscenario: (id: string) => void
}) => {
  const [escenariosSeleccionados, setEscenariosSeleccionados] = useState<string[]>([])
  const [tipoGrafico, setTipoGrafico] = useState<"barras" | "lineas" | "pastel">("barras")

  // Calcular métricas para cada escenario
  const calcularMetricas = (escenario: Escenario) => {
    const costoTotalImpresion = escenario.itemsImpresion.reduce(
      (total, item) => total + item.costoPorPie * item.areaPiesCuadrados * item.cantidad,
      0,
    )

    // Calcular el costo total de adicionales (solo los no incluidos)
    const costoTotalAdicionales = escenario.itemsAdicionales
      .filter((item) => !item.incluido)
      .reduce((total, item) => total + item.costo, 0)

    const costoTotal = costoTotalImpresion + costoTotalAdicionales

    const precioVentaTotalImpresion = escenario.itemsImpresion.reduce(
      (total, item) => total + item.precioVentaPorPie * item.areaPiesCuadrados * item.cantidad,
      0,
    )

    // Calcular el precio de venta total de adicionales (solo los no incluidos)
    const precioVentaTotalAdicionales = escenario.itemsAdicionales
      .filter((item) => !item.incluido)
      .reduce((total, item) => total + (item.precioVenta || item.costo), 0)

    const precioVentaTotal = precioVentaTotalImpresion + precioVentaTotalAdicionales

    const comision = (precioVentaTotal * escenario.porcentajeComision) / 100
    const ganancia = precioVentaTotal - costoTotal - comision
    const margen = precioVentaTotal > 0 ? ((precioVentaTotal - costoTotal) / precioVentaTotal) * 100 : 0

    return {
      costoTotal,
      precioVenta: precioVentaTotal,
      comision,
      ganancia,
      margen,
      numItems: escenario.itemsImpresion.length + escenario.itemsAdicionales.length,
    }
  }

  // Preparar datos para gráficos
  const datosGraficos = escenarios
    .filter((escenario) => escenariosSeleccionados.includes(escenario.id))
    .map((escenario) => {
      const metricas = calcularMetricas(escenario)
      return {
        nombre: escenario.nombre,
        costoTotal: metricas.costoTotal,
        precioVenta: metricas.precioVenta,
        comision: metricas.comision,
        ganancia: metricas.ganancia,
        margen: metricas.margen,
      }
    })

  // Datos para gráfico de pastel
  const datosPastel =
    escenariosSeleccionados.length === 1 && escenariosSeleccionados[0]
      ? (() => {
          const escenario = escenarios.find((e) => e.id === escenariosSeleccionados[0])
          if (!escenario) return []

          const metricas = calcularMetricas(escenario)
          return [
            { name: "Costo", value: metricas.costoTotal, fill: "#3b82f6" },
            { name: "Comisión", value: metricas.comision, fill: "#ef4444" },
            { name: "Ganancia", value: metricas.ganancia, fill: "#22c55e" },
          ]
        })()
      : []

  // Colores para los gráficos
  const colores = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#6366f1"]

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="space-y-2">
          <Label>Seleccione escenarios para comparar</Label>
          <div className="flex flex-wrap gap-2">
            {escenarios.map((escenario) => (
              <Button
                key={escenario.id}
                variant={escenariosSeleccionados.includes(escenario.id) ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (escenariosSeleccionados.includes(escenario.id)) {
                    setEscenariosSeleccionados(escenariosSeleccionados.filter((id) => id !== escenario.id))
                  } else {
                    setEscenariosSeleccionados([...escenariosSeleccionados, escenario.id])
                  }
                }}
              >
                {escenario.nombre}
              </Button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Tipo de gráfico</Label>
          <div className="flex gap-2">
            <Button
              variant={tipoGrafico === "barras" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoGrafico("barras")}
            >
              <BarChart4 className="h-4 w-4 mr-1" /> Barras
            </Button>
            <Button
              variant={tipoGrafico === "lineas" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoGrafico("lineas")}
            >
              <ArrowUpDown className="h-4 w-4 mr-1" /> Líneas
            </Button>
            <Button
              variant={tipoGrafico === "pastel" ? "default" : "outline"}
              size="sm"
              onClick={() => setTipoGrafico("pastel")}
              disabled={escenariosSeleccionados.length !== 1}
            >
              <DollarSign className="h-4 w-4 mr-1" /> Pastel
            </Button>
          </div>
        </div>
      </div>

      {escenariosSeleccionados.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Seleccione al menos un escenario para visualizar</p>
        </div>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Comparación de Escenarios</CardTitle>
              <CardDescription>
                {escenariosSeleccionados.length === 1
                  ? "Visualización detallada del escenario seleccionado"
                  : `Comparando ${escenariosSeleccionados.length} escenarios`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {tipoGrafico === "barras" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={datosGraficos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis tickFormatter={(value) => `${formatearPrecioDOP(value)}`} />
                      <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                      <Legend />
                      <Bar dataKey="costoTotal" name="Costo Total" fill="#3b82f6" />
                      <Bar dataKey="precioVenta" name="Precio Venta" fill="#8b5cf6" />
                      <Bar dataKey="ganancia" name="Ganancia" fill="#22c55e" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {tipoGrafico === "lineas" && (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={datosGraficos}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="nombre" />
                      <YAxis tickFormatter={(value) => `${formatearPrecioDOP(value)}`} />
                      <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="costoTotal" name="Costo Total" stroke="#3b82f6" strokeWidth={2} />
                      <Line
                        type="monotone"
                        dataKey="precioVenta"
                        name="Precio Venta"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                      />
                      <Line type="monotone" dataKey="ganancia" name="Ganancia" stroke="#22c55e" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {tipoGrafico === "pastel" && escenariosSeleccionados.length === 1 && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={datosPastel}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {datosPastel.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabla Comparativa</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Escenario</TableHead>
                      <TableHead>Costo Total</TableHead>
                      <TableHead>Precio Venta</TableHead>
                      <TableHead>Margen</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Ganancia</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {escenarios
                      .filter((escenario) => escenariosSeleccionados.includes(escenario.id))
                      .map((escenario) => {
                        const metricas = calcularMetricas(escenario)
                        return (
                          <TableRow key={escenario.id}>
                            <TableCell className="font-medium">{escenario.nombre}</TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.costoTotal)}</TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.precioVenta)}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  metricas.margen > 30 ? "success" : metricas.margen > 15 ? "warning" : "destructive"
                                }
                              >
                                {metricas.margen.toFixed(2)}%
                              </Badge>
                            </TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.comision)}</TableCell>
                            <TableCell>{formatearPrecioDOP(metricas.ganancia)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => onAplicarEscenario(escenario)}>
                                  <Check className="h-4 w-4 mr-1" /> Aplicar
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive"
                                  onClick={() => {
                                    onEliminarEscenario(escenario.id)
                                    setEscenariosSeleccionados(
                                      escenariosSeleccionados.filter((id) => id !== escenario.id),
                                    )
                                  }}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Main component
export default function CotizadorImpresionNuevo() {
  const [itemsImpresion, setItemsImpresion] = useState<ItemImpresion[]>([])
  const [itemsAdicionales, setItemsAdicionales] = useState<ItemAdicional[]>([])
  const [porcentajeComision, setPorcentajeComision] = useState(0)
  const [nombreProyecto, setNombreProyecto] = useState("")
  const [nota, setNota] = useState("")
  const [templates, setTemplates] = useState<TemplateType[]>([])
  const [templateNombre, setTemplateNombre] = useState("")
  const [formatoExportacion, setFormatoExportacion] = useState<"pdf" | "json">("pdf")
  const [itemEditando, setItemEditando] = useState<ItemImpresion | null>(null)
  const [activeTab, setActiveTab] = useState("items")
  const [mostrarAnalisisAvanzado, setMostrarAnalisisAvanzado] = useState(false)
  const [escenarios, setEscenarios] = useState<Escenario[]>([])
  const [nombreEscenario, setNombreEscenario] = useState("")
  const [descripcionEscenario, setDescripcionEscenario] = useState("")
  const [escenarioSeleccionado, setEscenarioSeleccionado] = useState<string | null>(null)
  const [mostrarComparacion, setMostrarComparacion] = useState(false)
  const [showAnalisisDetallado, setShowAnalisisDetallado] = useState(false)
  const [clienteNombre, setClienteNombre] = useState("")

  const importFileRef = useRef<HTMLInputElement>(null)

  const calcularCostoTotalImpresion = () =>
    itemsImpresion.reduce((total, item) => total + item.costoPorPie * item.areaPiesCuadrados * item.cantidad, 0)

  const calcularPrecioVentaTotalImpresion = () =>
    itemsImpresion.reduce((total, item) => total + item.precioVentaPorPie * item.areaPiesCuadrados * item.cantidad, 0)

  // Actualizar la función para calcular el costo total de adicionales
  // Ahora debe incluir TODOS los ítems adicionales, tanto los incluidos como los no incluidos
  const calcularCostoTotalAdicionales = () => itemsAdicionales.reduce((total, item) => total + item.costo, 0)

  // Calcular el costo de los ítems incluidos (que no se cobran pero sí representan un gasto)
  const calcularCostoItemsIncluidos = () =>
    itemsAdicionales.filter((item) => item.incluido).reduce((total, item) => total + item.costo, 0)

  // Calcular el precio de venta total de adicionales (solo los no incluidos)
  const calcularPrecioVentaTotalAdicionales = () =>
    itemsAdicionales
      .filter((item) => !item.incluido)
      .reduce((total, item) => total + (item.precioVenta || item.costo), 0)

  // Actualizar el cálculo de ganancia post-comisión para considerar los ítems incluidos
  const calcularGananciaPostComision = () => {
    const precioVentaTotalImpresion = calcularPrecioVentaTotalImpresion()
    const precioVentaTotalAdicionales = calcularPrecioVentaTotalAdicionales()
    const costoTotalImpresion = calcularCostoTotalImpresion()
    const costoTotalAdicionales = calcularCostoTotalAdicionales() // Ahora incluye TODOS los ítems adicionales
    const comision = calcularComision()
    return (
      precioVentaTotalImpresion + precioVentaTotalAdicionales - costoTotalImpresion - costoTotalAdicionales - comision
    )
  }

  const calcularMargenGanancia = (precioVenta: number, costoTotal: number) =>
    precioVenta > 0 ? ((precioVenta - costoTotal) / precioVenta) * 100 : 0

  const calcularMargenGananciaPromedio = () => {
    const costoTotalImpresion = calcularCostoTotalImpresion()
    const precioVentaTotalImpresion = calcularPrecioVentaTotalImpresion()
    return calcularMargenGanancia(precioVentaTotalImpresion, costoTotalImpresion)
  }

  const calcularMargenGananciaFinal = () => {
    const costoTotalImpresion = calcularCostoTotalImpresion()
    const costoTotalAdicionales = calcularCostoTotalAdicionales()
    const precioVentaTotalImpresion = calcularPrecioVentaTotalImpresion()
    const precioVentaTotalAdicionales = calcularPrecioVentaTotalAdicionales()
    const precioVentaTotal = precioVentaTotalImpresion + precioVentaTotalAdicionales
    const costoTotal = costoTotalImpresion + costoTotalAdicionales
    return calcularMargenGanancia(precioVentaTotal, costoTotal)
  }

  const calcularComision = () => {
    const precioVentaTotalImpresion = calcularPrecioVentaTotalImpresion()
    const precioVentaTotalAdicionales = calcularPrecioVentaTotalAdicionales()
    return ((precioVentaTotalImpresion + precioVentaTotalAdicionales) * porcentajeComision) / 100
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    if (result.type === "impresion") {
      const newItems = Array.from(itemsImpresion)
      const [reorderedItem] = newItems.splice(result.source.index, 1)
      newItems.splice(result.destination.index, 0, reorderedItem)
      setItemsImpresion(newItems)
    } else {
      const newItems = Array.from(itemsAdicionales)
      const [reorderedItem] = newItems.splice(result.source.index, 1)
      newItems.splice(result.destination.index, 0, reorderedItem)
      setItemsAdicionales(newItems)
    }
  }

  const guardarTemplate = () => {
    if (templateNombre && (itemsImpresion.length > 0 || itemsAdicionales.length > 0)) {
      const newTemplate: TemplateType = {
        nombre: templateNombre,
        itemsImpresion,
        itemsAdicionales,
      }
      setTemplates([...templates, newTemplate])
      setTemplateNombre("")
    }
  }

  const cargarTemplate = (templateNombre: string) => {
    const template = templates.find((t) => t.nombre === templateNombre)
    if (template) {
      setItemsImpresion(template.itemsImpresion)
      setItemsAdicionales(template.itemsAdicionales)
    }
  }

  const guardarCotizacion = () => {
    const costoTotalImpresion = calcularCostoTotalImpresion()
    const costoTotalAdicionales = calcularCostoTotalAdicionales()
    const precioVentaTotalImpresion = calcularPrecioVentaTotalImpresion()
    const precioVentaTotalAdicionales = calcularPrecioVentaTotalAdicionales()
    const margenGananciaPromedio = calcularMargenGananciaPromedio()
    const margenGananciaFinal = calcularMargenGananciaFinal()
    const comision = calcularComision()
    const gananciaPostComision = calcularGananciaPostComision()

    const cotizacion = {
      itemsImpresion,
      itemsAdicionales,
      costoTotalImpresion,
      costoTotalAdicionales,
      precioVentaTotalImpresion,
      precioVentaTotalAdicionales,
      precioVentaSugerido: precioVentaTotalImpresion + precioVentaTotalAdicionales,
      precioFinal: precioVentaTotalImpresion + precioVentaTotalAdicionales,
      margenGanancia: margenGananciaFinal,
      porcentajeComision,
      comision,
      gananciaPostComision,
      nombreProyecto,
      cliente: clienteNombre,
      nota,
      fechaCreacion: new Date().toISOString().split("T")[0],
    }

    if (formatoExportacion === "pdf") {
      // Crear PDF con mejor diseño
      const doc = new jsPDF()

      // Configuración de colores y estilos
      const colorPrimario = [0, 122, 204] // Azul para cotizador de impresión

      // Encabezado con estilo
      doc.setFillColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
      doc.rect(0, 0, 210, 40, "F")

      // Título principal
      doc.setTextColor(255, 255, 255) // Texto blanco para el encabezado
      doc.setFontSize(24)
      doc.setFont("helvetica", "bold")
      doc.text(`COTIZACIÓN DE IMPRESIÓN`, 14, 20)

      // Subtítulo
      doc.setFontSize(14)
      doc.setFont("helvetica", "normal")
      doc.text(`${nombreProyecto || "Sin nombre"}`, 14, 30)

      // Información del cliente y fecha
      doc.setTextColor(0, 0, 0) // Volver a texto negro
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text(`INFORMACIÓN DEL PROYECTO`, 14, 50)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text(`Cliente: ${clienteNombre || "N/A"}`, 14, 58)
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 65)
      doc.text(`Referencia: ${nombreProyecto || "Sin referencia"}`, 14, 72)

      // Línea separadora
      doc.setDrawColor(colorPrimario[0], colorPrimario[1], colorPrimario[2])
      doc.setLineWidth(0.5)
      doc.line(14, 80, 196, 80)

      // Tabla de ítems de impresión
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("ÍTEMS DE IMPRESIÓN", 14, 90)

      autoTable(doc, {
        startY: 95,
        head: [["Dimensiones", "Área (pies²)", "Cantidad", "Costo/pie²", "Precio/pie²", "Subtotal"]],
        body: itemsImpresion.map((item) => [
          `${item.ancho} x ${item.alto} ${item.unidadMedida}`,
          item.areaPiesCuadrados.toFixed(2),
          item.cantidad.toString(),
          formatearPrecioDOP(item.costoPorPie),
          formatearPrecioDOP(item.precioVentaPorPie),
          formatearPrecioDOP(item.precioVentaPorPie * item.areaPiesCuadrados * item.cantidad),
        ]),
        headStyles: {
          fillColor: [colorPrimario[0], colorPrimario[1], colorPrimario[2]],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
      })

      // Tabla de ítems adicionales
      const finalY1 = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("ÍTEMS ADICIONALES", 14, finalY1)

      autoTable(doc, {
        startY: finalY1 + 5,
        head: [["Descripción", "Tipo", "Costo", "Precio Venta", "Estado"]],
        body: itemsAdicionales.map((item) => [
          item.descripcion,
          item.tipo || "N/A",
          formatearPrecioDOP(item.costo),
          formatearPrecioDOP(item.precioVenta || item.costo),
          item.incluido ? "Incluido" : "Adicional",
        ]),
        headStyles: {
          fillColor: [colorPrimario[0], colorPrimario[1], colorPrimario[2]],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        alternateRowStyles: {
          fillColor: [240, 240, 240],
        },
        bodyStyles: {
          fontSize: 10,
        },
      })

      // Resumen financiero con mejor presentación
      const finalY2 = (doc as any).lastAutoTable.finalY + 15
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("RESUMEN FINANCIERO", 14, finalY2)

      autoTable(doc, {
        startY: finalY2 + 5,
        head: [["Concepto", "Valor"]],
        body: [
          ["Costo Total de Impresión", formatearPrecioDOP(costoTotalImpresion)],
          ["Costo Total de Ítems Adicionales", formatearPrecioDOP(costoTotalAdicionales)],
          ["Precio de Venta Impresión", formatearPrecioDOP(precioVentaTotalImpresion)],
          ["Precio de Venta Adicionales", formatearPrecioDOP(precioVentaTotalAdicionales)],
          ["Precio de Venta Total", formatearPrecioDOP(precioVentaTotalImpresion + precioVentaTotalAdicionales)],
          ["Margen de Ganancia", `${margenGananciaFinal.toFixed(2)}%`],
          ["Comisión", formatearPrecioDOP(comision)],
          ["Ganancia Post-Comisión", formatearPrecioDOP(gananciaPostComision)],
        ],
        headStyles: {
          fillColor: [colorPrimario[0], colorPrimario[1], colorPrimario[2]],
          textColor: [255, 255, 255],
          fontStyle: "bold",
        },
        bodyStyles: {
          fontSize: 10,
        },
        columnStyles: {
          1: {
            fontStyle: "bold",
            halign: "right",
          },
        },
      })

      // Notas con mejor formato
      if (nota) {
        const notaY = (doc as any).lastAutoTable.finalY + 15
        doc.setFontSize(14)
        doc.setFont("helvetica", "bold")
        doc.text("NOTAS", 14, notaY)

        doc.setFontSize(10)
        doc.setFont("helvetica", "normal")
        const splitNota = doc.splitTextToSize(nota, 180)
        doc.text(splitNota, 14, notaY + 8)
      }

      // Pie de página
      const pageCount = doc.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(100, 100, 100)
        doc.text(
          `Cotizador 2025 - Página ${i} de ${pageCount} - Generado el ${new Date().toLocaleString()}`,
          14,
          doc.internal.pageSize.height - 10,
        )
      }

      // Guardar PDF
      doc.save(`cotizacion_impresion_${nombreProyecto || "sin_nombre"}.pdf`)
    } else {
      // Exportar como JSON (sin cambios)
      const contenido = JSON.stringify(cotizacion, null, 2)
      const tipo = "application/json"
      const extension = "json"

      const blob = new Blob([contenido], { type: tipo })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `cotizacion_impresion_${nombreProyecto || "sin_nombre"}.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  }

  const importarCotizacion = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const contenido = e.target?.result as string
          const cotizacion = JSON.parse(contenido)
          setItemsImpresion(cotizacion.itemsImpresion)
          setItemsAdicionales(cotizacion.itemsAdicionales)
          setPorcentajeComision(cotizacion.porcentajeComision)
          setNombreProyecto(cotizacion.nombreProyecto)
          setNota(cotizacion.nota)
          if (cotizacion.cliente) {
            setClienteNombre(cotizacion.cliente)
          }
        } catch (error) {
          console.error("Error al importar la cotización:", error)
          alert("El archivo seleccionado no es una cotización válida.")
        }
      }
      reader.readAsText(file)
    }
  }

  const limpiarTodo = () => {
    setItemsImpresion([])
    setItemsAdicionales([])
    setPorcentajeComision(0)
    setNombreProyecto("")
    setNota("")
    setClienteNombre("")
  }

  const handleDoubleClick = (item: ItemImpresion) => {
    setItemEditando({ ...item })
  }

  const handleSaveItem = (updatedItem: ItemImpresion) => {
    setItemsImpresion(itemsImpresion.map((item) => (item.id === updatedItem.id ? updatedItem : item)))
    setItemEditando(null)
  }

  const handleCloseDialog = () => {
    setItemEditando(null)
  }

  // Función para aplicar un escenario
  const aplicarEscenario = (escenario: Escenario) => {
    setItemsImpresion(escenario.itemsImpresion)
    setItemsAdicionales(escenario.itemsAdicionales)
    setPorcentajeComision(escenario.porcentajeComision)
  }

  return (
    <MobileOptimizedContainer className="container mx-auto p-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-9">
            <Link href="/">
              <ChevronRight className="mr-1 h-4 w-4 rotate-180" />
              <span className="sm:inline">Volver</span>
            </Link>
          </Button>
          <h1 className="text-xl sm:text-2xl font-bold truncate">Cotizador de Impresión</h1>
        </div>
        <div className="flex items-center gap-1 self-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => importFileRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Importar Cotización</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <input type="file" ref={importFileRef} onChange={importarCotizacion} accept=".json" className="hidden" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={guardarCotizacion}>
                  <Download className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Guardar Cotización</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9" onClick={limpiarTodo}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Limpiar Todo</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="items" className="flex items-center gap-2">
                <Layers className="h-4 w-4" />
                <span>Ítems</span>
              </TabsTrigger>
              <TabsTrigger value="calculos" className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span>Cálculos</span>
              </TabsTrigger>
              <TabsTrigger value="analisis" className="flex items-center gap-2">
                <BarChart4 className="h-4 w-4" />
                <span>Análisis</span>
              </TabsTrigger>
              <TabsTrigger value="escenarios" className="flex items-center gap-2">
                <Coins className="h-4 w-4" />
                <span>Escenarios</span>
              </TabsTrigger>
              <TabsTrigger value="proyecto" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Proyecto</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="items" className="space-y-6">
              <Collapsible defaultOpen className="space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <Grid className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Ítems de Impresión</h3>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <ItemImpresionForm onAdd={(item) => setItemsImpresion([...itemsImpresion, item])} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Lista de Ítems de Impresión</CardTitle>
                      <CardDescription>Haga doble clic en un ítem para editarlo</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DraggableItemList
                        items={itemsImpresion}
                        onRemove={(id) => setItemsImpresion(itemsImpresion.filter((item) => item.id !== id))}
                        onDoubleClick={(item) => handleDoubleClick(item as ItemImpresion)}
                        headers={["Dimensiones", "Área", "Cantidad", "Costo/pie²", "Precio/pie²", "Subtotal"]}
                        renderItem={(item) => (
                          <>
                            <TableCell>{`${item.ancho} x ${item.alto} ${item.unidadMedida}`}</TableCell>
                            <TableCell>{`${item.areaPiesCuadrados.toFixed(2)} pies²`}</TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatearPrecioDOP(item.costoPorPie)}</TableCell>
                            <TableCell>{formatearPrecioDOP(item.precioVentaPorPie)}</TableCell>
                            <TableCell>
                              {formatearPrecioDOP(item.precioVentaPorPie * item.areaPiesCuadrados * item.cantidad)}
                            </TableCell>
                          </>
                        )}
                      />
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>

              <Collapsible className="space-y-4">
                <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-muted/50 rounded-lg hover:bg-muted">
                  <div className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    <h3 className="text-lg font-medium">Ítems Adicionales</h3>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  <Card>
                    <CardContent className="pt-6">
                      <ItemAdicionalForm onAdd={(item) => setItemsAdicionales([...itemsAdicionales, item])} />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Lista de Ítems Adicionales</CardTitle>
                      <CardDescription>Estos ítems se sumarán al precio final de la cotización</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <DraggableItemList
                        items={itemsAdicionales}
                        onRemove={(id) => setItemsAdicionales(itemsAdicionales.filter((item) => item.id !== id))}
                        headers={["Descripción", "Tipo", "Costo", "Precio Venta", "Estado"]}
                        renderItem={(item) => (
                          <>
                            <TableCell>{item.descripcion}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {item.tipo === "acabado"
                                  ? "Acabado"
                                  : item.tipo === "material"
                                    ? "Material"
                                    : item.tipo === "servicio"
                                      ? "Servicio"
                                      : "Otro"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatearPrecioDOP(item.costo)}</TableCell>
                            <TableCell>
                              {formatearPrecioDOP(item.precioVenta || item.costo)}
                              {item.modoPrecio === "margen" && item.margen && (
                                <span className="text-xs text-muted-foreground ml-1">({item.margen}%)</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.incluido ? "outline" : "default"}>
                                {item.incluido ? "Incluido" : "Adicional"}
                              </Badge>
                            </TableCell>
                          </>
                        )}
                      />
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="calculos" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Resumen de Cotización
                  </CardTitle>
                  <CardDescription>Resumen de costos, precios y márgenes de ganancia</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResumenCotizacion
                    itemsImpresion={itemsImpresion}
                    itemsAdicionales={itemsAdicionales}
                    porcentajeComision={porcentajeComision}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configuración de Comisión
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="porcentajeComision">Porcentaje de Comisión (%)</Label>
                      <Input
                        id="porcentajeComision"
                        type="number"
                        value={porcentajeComision}
                        onChange={(e) => setPorcentajeComision(Number(e.target.value))}
                        min={0}
                        max={100}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Comisión Calculada:</span>
                      <span className="font-medium">{formatearPrecioDOP(calcularComision())}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Análisis de Costos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1">
                        <Label htmlFor="costoTotalImpresion">Costo Total de Impresión</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                Suma de los costos calculados para todos los ítems de impresión
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input
                        id="costoTotalImpresion"
                        value={formatearPrecioDOP(calcularCostoTotalImpresion())}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="costoTotalAdicionales">Costo Total de Ítems Adicionales</Label>
                      <Input
                        id="costoTotalAdicionales"
                        value={formatearPrecioDOP(calcularCostoTotalAdicionales())}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precioVentaTotalImpresion">Precio de Venta Impresión</Label>
                      <Input
                        id="precioVentaTotalImpresion"
                        value={formatearPrecioDOP(calcularPrecioVentaTotalImpresion())}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="precioVentaTotalAdicionales">Precio de Venta Adicionales</Label>
                      <Input
                        id="precioVentaTotalAdicionales"
                        value={formatearPrecioDOP(calcularPrecioVentaTotalAdicionales())}
                        readOnly
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gananciaPostComision">Ganancia Post-Comisión</Label>
                      <Input
                        id="gananciaPostComision"
                        value={formatearPrecioDOP(calcularGananciaPostComision())}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Button onClick={() => setShowAnalisisDetallado(true)}>Ver Análisis Detallado</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analisis" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Análisis Avanzado</h3>
                <Switch checked={mostrarAnalisisAvanzado} onCheckedChange={setMostrarAnalisisAvanzado} />
              </div>

              {mostrarAnalisisAvanzado ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Análisis de Rentabilidad
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-4 w-4 text-muted-foreground cursor-help ml-1" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Este gráfico muestra el desglose de costos, la comisión y la ganancia final
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </CardTitle>
                    <CardDescription>Desglose detallado de costos y ganancias</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            {
                              name: "Costo de Impresión",
                              value: calcularCostoTotalImpresion(),
                            },
                            {
                              name: "Costo Adicionales",
                              value: calcularCostoTotalAdicionales(),
                            },
                            {
                              name: "Precio Venta Impresión",
                              value: calcularPrecioVentaTotalImpresion(),
                            },
                            {
                              name: "Precio Venta Adicionales",
                              value: calcularPrecioVentaTotalAdicionales(),
                            },
                            {
                              name: "Comisión",
                              value: calcularComision(),
                            },
                            {
                              name: "Ganancia",
                              value: calcularGananciaPostComision(),
                            },
                          ]}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis tickFormatter={(value) => `${formatearPrecioDOP(value)}`} />
                          <RechartsTooltip formatter={(value: number) => formatearPrecioDOP(value)} />
                          <Bar dataKey="value" fill="#8884d8">
                            {({ payload }) =>
                              payload.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={
                                    entry.name === "Ganancia"
                                      ? "#22c55e" // Verde más brillante para la ganancia
                                      : entry.name === "Comisión"
                                        ? "#ef4444" // Rojo para la comisión
                                        : entry.name === "Costo de Impresión" || entry.name === "Costo Adicionales"
                                          ? "#3b82f6"
                                          : entry.name === "Precio Venta Impresión" ||
                                              entry.name === "Precio Venta Adicionales"
                                            ? "#8b5cf6"
                                            : "#93c5fd"
                                  }
                                />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="space-y-4">
                      <BarChart4 className="h-16 w-16 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">Análisis Avanzado</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Active el análisis avanzado para ver análisis de rentabilidad y recomendaciones personalizadas.
                      </p>
                      <Button onClick={() => setMostrarAnalisisAvanzado(true)}>Activar Análisis Avanzado</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="escenarios" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Crear Escenario
                  </CardTitle>
                  <CardDescription>
                    Guarde la configuración actual como un escenario para comparar alternativas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreEscenario">Nombre del Escenario</Label>
                      <Input
                        id="nombreEscenario"
                        placeholder="Ej: Escenario Base"
                        value={nombreEscenario}
                        onChange={(e) => setNombreEscenario(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="descripcionEscenario">Descripción</Label>
                      <Input
                        id="descripcionEscenario"
                        placeholder="Descripción breve"
                        value={descripcionEscenario}
                        onChange={(e) => setDescripcionEscenario(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-between mt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        // Generar escenarios automáticos
                        const nuevosEscenarios: Escenario[] = [
                          {
                            id: Date.now().toString() + "-1",
                            nombre: "Escenario Optimista",
                            descripcion: "Precios de venta aumentados en 10%",
                            itemsImpresion: itemsImpresion.map((item) => ({
                              ...item,
                              precioVentaPorPie: item.precioVentaPorPie * 1.1,
                            })),
                            itemsAdicionales: itemsAdicionales,
                            porcentajeComision: porcentajeComision,
                            fechaCreacion: new Date().toISOString(),
                          },
                          {
                            id: Date.now().toString() + "-2",
                            nombre: "Escenario Pesimista",
                            descripcion: "Costos aumentados en 10%",
                            itemsImpresion: itemsImpresion.map((item) => ({
                              ...item,
                              costoPorPie: item.costoPorPie * 1.1,
                            })),
                            itemsAdicionales: itemsAdicionales.map((item) => ({
                              ...item,
                              costo: item.costo * 1.1,
                            })),
                            porcentajeComision: porcentajeComision,
                            fechaCreacion: new Date().toISOString(),
                          },
                          {
                            id: Date.now().toString() + "-3",
                            nombre: "Sin Comisión",
                            descripcion: "Escenario sin comisión",
                            itemsImpresion: itemsImpresion,
                            itemsAdicionales: itemsAdicionales,
                            porcentajeComision: 0,
                            fechaCreacion: new Date().toISOString(),
                          },
                        ]
                        setEscenarios([...escenarios, ...nuevosEscenarios])
                      }}
                    >
                      <Zap className="mr-2 h-4 w-4" /> Generar Escenarios Automáticos
                    </Button>
                    <Button
                      onClick={() => {
                        if (nombreEscenario) {
                          const nuevoEscenario: Escenario = {
                            id: Date.now().toString(),
                            nombre: nombreEscenario,
                            descripcion: descripcionEscenario,
                            itemsImpresion: itemsImpresion,
                            itemsAdicionales: itemsAdicionales,
                            porcentajeComision: porcentajeComision,
                            fechaCreacion: new Date().toISOString(),
                          }
                          setEscenarios([...escenarios, nuevoEscenario])
                          setNombreEscenario("")
                          setDescripcionEscenario("")
                        }
                      }}
                      disabled={!nombreEscenario}
                    >
                      <Save className="mr-2 h-4 w-4" /> Guardar Escenario Actual
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {escenarios.length > 0 ? (
                <VisualizadorEscenarios
                  escenarios={escenarios}
                  onAplicarEscenario={aplicarEscenario}
                  onEliminarEscenario={(id) => {
                    setEscenarios(escenarios.filter((e) => e.id !== id))
                    if (escenarioSeleccionado === id) {
                      setEscenarioSeleccionado(null)
                    }
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="py-10 text-center">
                    <div className="space-y-4">
                      <Coins className="h-16 w-16 mx-auto text-muted-foreground" />
                      <h3 className="text-lg font-medium">No hay escenarios</h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        Cree escenarios para comparar diferentes configuraciones de precios, márgenes y comisiones.
                      </p>
                      <Button onClick={() => setActiveTab("escenarios")}>Crear Primer Escenario</Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="proyecto" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Información del Proyecto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <Label htmlFor="nombreProyecto">Nombre del Proyecto</Label>
                      <Input
                        id="nombreProyecto"
                        value={nombreProyecto}
                        onChange={(e) => setNombreProyecto(e.target.value)}
                        placeholder="Ingrese el nombre del proyecto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="clienteNombre">Cliente</Label>
                      <Input
                        id="clienteNombre"
                        value={clienteNombre}
                        onChange={(e) => setClienteNombre(e.target.value)}
                        placeholder="Nombre del cliente"
                      />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <Label htmlFor="nota">Nota</Label>
                      <Textarea
                        id="nota"
                        value={nota}
                        onChange={(e) => setNota(e.target.value)}
                        placeholder="Ingrese una nota para el proyecto"
                        rows={4}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Template className="h-5 w-5" />
                    Templates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="templateNombre">Nombre del Template</Label>
                        <Input
                          id="templateNombre"
                          value={templateNombre}
                          onChange={(e) => setTemplateNombre(e.target.value)}
                          placeholder="Ingrese el nombre del template"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button onClick={guardarTemplate} className="w-full">
                          <Save className="mr-2 h-4 w-4" /> Guardar Template
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="templateSelect">Templates Guardados</Label>
                      <Select onValueChange={cargarTemplate}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccione un template" />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.length === 0 ? (
                            <div className="p-2 text-center text-muted-foreground">No hay templates guardados</div>
                          ) : (
                            templates.map((template, index) => (
                              <SelectItem key={index} value={template.nombre}>
                                {template.nombre}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Formato de Exportación</Label>
                      <RadioGroup
                        defaultValue="pdf"
                        value={formatoExportacion}
                        onValueChange={(value: "pdf" | "json") => setFormatoExportacion(value)}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="pdf" id="formatoPdf" />
                          <Label htmlFor="formatoPdf">PDF</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="json" id="formatoJson" />
                          <Label htmlFor="formatoJson">JSON</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={limpiarTodo}>
                    <RefreshCw className="mr-2 h-4 w-4" /> Limpiar Todo
                  </Button>
                  <Button onClick={guardarCotizacion}>
                    <Download className="mr-2 h-4 w-4" /> Guardar Cotización
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Info className="mr-2 h-5 w-5" />
                Resumen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ítems de Impresión:</span>
                    <span className="font-medium">{itemsImpresion.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ítems Adicionales:</span>
                    <span className="font-medium">{itemsAdicionales.filter((item) => !item.incluido).length}</span>
                  </div>
                  {itemsAdicionales.filter((item) => item.incluido).length > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Ítems Incluidos:</span>
                      <span className="font-medium text-amber-600">
                        {itemsAdicionales.filter((item) => item.incluido).length}
                      </span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Costo Total:</span>
                    <span className="font-medium">
                      {formatearPrecioDOP(calcularCostoTotalImpresion() + calcularCostoTotalAdicionales())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Precio de Venta:</span>
                    <span className="font-medium">
                      {formatearPrecioDOP(calcularPrecioVentaTotalImpresion() + calcularPrecioVentaTotalAdicionales())}
                    </span>
                  </div>
                  {calcularCostoItemsIncluidos() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Costo Ítems Incluidos:</span>
                      <span className="font-medium text-amber-600">
                        {formatearPrecioDOP(calcularCostoItemsIncluidos())}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ganancia:</span>
                    <span className="font-medium">{formatearPrecioDOP(calcularGananciaPostComision())}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button onClick={guardarCotizacion} className="w-full">
                    <Download className="mr-2 h-4 w-4" /> Guardar Cotización
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center">
                <Percent className="mr-2 h-5 w-5" />
                Márgenes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      Margen de Impresión
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">(Precio Venta - Costo Impresión) / Precio Venta × 100</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <Badge
                      variant={
                        calcularMargenGananciaPromedio() > 30
                          ? "success"
                          : calcularMargenGananciaPromedio() > 15
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {calcularMargenGananciaPromedio().toFixed(2)}%
                    </Badge>
                  </div>
                  <Progress value={calcularMargenGananciaPromedio()} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      Margen Final
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">(Precio Venta - Costo Total) / Precio Venta × 100</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <Badge
                      variant={
                        calcularMargenGananciaFinal() > 30
                          ? "success"
                          : calcularMargenGananciaFinal() > 15
                            ? "warning"
                            : "destructive"
                      }
                    >
                      {calcularMargenGananciaFinal().toFixed(2)}%
                    </Badge>
                  </div>
                  <Progress value={calcularMargenGananciaFinal()} className="h-2" />
                </div>
              </CardContent>
            </Card>

          {(itemsImpresion.length > 0 || itemsAdicionales.length > 0) && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <Calculator className="mr-2 h-5 w-5" />
                  Detalles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {itemsImpresion.map((item) => (
                      <div key={item.id} className="border rounded-md p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Dimensiones:</span>
                          <span>{`${item.ancho} x ${item.alto} ${item.unidadMedida}`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Área:</span>
                          <span>{`${item.areaPiesCuadrados.toFixed(2)} pies²`}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Cantidad:</span>
                          <span>{item.cantidad}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal:</span>
                          <span className="font-medium">
                            {formatearPrecioDOP(item.precioVentaPorPie * item.areaPiesCuadrados * item.cantidad)}
                          </span>
                        </div>
                      </div>
                    ))}

                    {itemsAdicionales.map((item) => (
                      <div key={item.id} className="border rounded-md p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Descripción:</span>
                          <span>{item.descripcion}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tipo:</span>
                          <span>
                            {item.tipo === "acabado"
                              ? "Acabado"
                              : item.tipo === "material"
                                ? "Material"
                                : item.tipo === "servicio"
                                  ? "Servicio"
                                  : "Otro"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Costo:</span>
                          <span>{formatearPrecioDOP(item.costo)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Precio de venta:</span>
                          <span className="font-medium">
                            {formatearPrecioDOP(item.precioVenta || item.costo)}
                            {item.modoPrecio === "margen" && item.margen && (
                              <span className="text-xs ml-1">({item.margen}%)</span>
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Estado:</span>
                          <Badge
                            variant={item.incluido ? "outline" : "default"}
                            className={item.incluido ? "text-green-600" : ""}
                          >
                            {item.incluido ? "Incluido en precio base" : "Suma al precio final"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      {/* Diálogo de Análisis Detallado */}
      <Dialog open={showAnalisisDetallado} onOpenChange={setShowAnalisisDetallado}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gapap-2">
              <BarChart4 className="h-5 w-5" />
              Análisis Detallado de Costos y Márgenes
            </DialogTitle>
            <DialogDescription>Desglose completo de todos los costos, precios y márgenes de ganancia</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Desglose de Costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Concepto</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                      <TableHead className="text-right">%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Costo de Impresión</TableCell>
                      <TableCell className="text-right">{formatearPrecioDOP(calcularCostoTotalImpresion())}</TableCell>
                      <TableCell className="text-right">
                        {(
                          (calcularCostoTotalImpresion() /
                            (calcularCostoTotalImpresion() + calcularCostoTotalAdicionales())) *
                          100
                        ).toFixed(1)}
                        %
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Costo de Adicionales (no incluidos)</TableCell>
                      <TableCell className="text-right">
                        {formatearPrecioDOP(calcularCostoTotalAdicionales() - calcularCostoItemsIncluidos())}
                      </TableCell>
                      <TableCell className="text-right">
                        {(
                          ((calcularCostoTotalAdicionales() - calcularCostoItemsIncluidos()) /
                            (calcularCostoTotalImpresion() + calcularCostoTotalAdicionales())) *
                          100
                        ).toFixed(1)}
                        %
                      </TableCell>
                    </TableRow>
                    {calcularCostoItemsIncluidos() > 0 && (
                      <TableRow>
                        <TableCell>Costo de Ítems Incluidos</TableCell>
                        <TableCell className="text-right text-amber-600">
                          {formatearPrecioDOP(calcularCostoItemsIncluidos())}
                        </TableCell>
                        <TableCell className="text-right text-amber-600">
                          {(
                            (calcularCostoItemsIncluidos() /
                              (calcularCostoTotalImpresion() + calcularCostoTotalAdicionales())) *
                            100
                          ).toFixed(1)}
                          %
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow>
                      <TableCell className="font-bold">Total</TableCell>
                      <TableCell className="text-right font-bold">
                        {formatearPrecioDOP(calcularCostoTotalImpresion() + calcularCostoTotalAdicionales())}
                      </TableCell>
                      <TableCell className="text-right font-bold">100%</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Análisis de Rentabilidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Costo Total
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Suma de todos los costos de los ítems (incluidos y no incluidos)</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-medium">
                      {formatearPrecioDOP(calcularCostoTotalImpresion() + calcularCostoTotalAdicionales())}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Precio de Venta
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">
                              Precio total de venta (sin incluir ítems marcados como incluidos)
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-medium">
                      {formatearPrecioDOP(calcularPrecioVentaTotalImpresion() + calcularPrecioVentaTotalAdicionales())}
                    </span>
                  </div>
                  {calcularCostoItemsIncluidos() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        Costo de Ítems Incluidos
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Costo de ítems que no se cobran pero reducen la ganancia</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-medium text-amber-600">
                      {formatearPrecioDOP(calcularCostoItemsIncluidos())}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Ganancia Bruta
                    </span>
                    <span className="font-medium">
                      {formatearPrecioDOP(
                        calcularPrecioVentaTotalImpresion() +
                          calcularPrecioVentaTotalAdicionales() -
                          calcularCostoTotalImpresion() -
                          calcularCostoTotalAdicionales(),
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Comisión ({porcentajeComision}%)
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Calculada como el {porcentajeComision}% del Precio de Venta</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-medium">{formatearPrecioDOP(calcularComision())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Ganancia Neta
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">Ganancia Bruta - Comisión</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-medium">{formatearPrecioDOP(calcularGananciaPostComision())}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1">
                      Margen de Ganancia
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="max-w-xs">(Precio de Venta - Costo Total) / Precio de Venta × 100</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </span>
                    <span className="font-medium">{calcularMargenGananciaFinal().toFixed(2)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cerrar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
  </Dialog>
      <EditarItemDialog
        isOpen=
  {!!itemEditando}
  onClose = { handleCloseDialog }
  item = { itemEditando }
  onSave={handleSaveItem}
      />
  </MobileOptimizedContainer>
  )
}
