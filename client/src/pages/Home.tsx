import { Link, useLocation } from "wouter";
import { Calculator, Printer, LineChart, ChevronRight, Clock, CheckCircle2, Lightbulb, Zap, FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import { formatearPrecioDOP } from "@/lib/utils";

// Definimos interfaces para los tipos de datos que necesitamos
interface PrecioConFormula {
  valor: number | null;
  formula?: string;
}

interface Escenario {
  id: string;
  nombre: string;
  descripcion: string;
  margenGanancia: number;
  porcentajeComision: number;
  precioFinal: PrecioConFormula;
  fechaCreacion: string;
}

interface EscenarioImpresion {
  id: string;
  nombre: string;
  descripcion: string;
  porcentajeComision: number;
  precioFinal?: number;
  fechaCreacion: string;
}

// Definimos un tipo para las cotizaciones procesadas
interface CotizacionProcesada {
  id: string;
  nombre: string;
  descripcion: string;
  tipo: 'general' | 'impresion';
  precioFinalNum: number;
  fechaCreacion: Date;
  [key: string]: any; // Para otros campos
}

export default function Home() {
  const [_, setLocation] = useLocation();
  
  // Obtener cotizaciones generales
  const { data: cotizacionesGeneralData } = useQuery<Escenario[]>({
    queryKey: ["/api/cotizador-general/escenarios"],
    // Usar el queryFn predeterminado que está configurado en queryClient
  });

  // Obtener cotizaciones de impresión
  const { data: cotizacionesImpresionData } = useQuery<EscenarioImpresion[]>({
    queryKey: ["/api/cotizador-impresion/escenarios"],
    // Usar el queryFn predeterminado que está configurado en queryClient
  });

  // Procesar cotizaciones generales
  const cotizacionesGeneralProcesadas: CotizacionProcesada[] = 
    Array.isArray(cotizacionesGeneralData) 
      ? cotizacionesGeneralData.map(c => ({
          ...c,
          tipo: 'general' as const,
          precioFinalNum: c.precioFinal?.valor || 0,
          fechaCreacion: new Date(c.fechaCreacion)
        }))
      : [];

  // Procesar cotizaciones de impresión
  const cotizacionesImpresionProcesadas: CotizacionProcesada[] = 
    Array.isArray(cotizacionesImpresionData) 
      ? cotizacionesImpresionData.map(c => ({
          ...c,
          tipo: 'impresion' as const,
          precioFinalNum: c.precioFinal || 0,
          fechaCreacion: new Date(c.fechaCreacion)
        }))
      : [];

  // Combinar ambos tipos de cotizaciones y ordenar por fecha más reciente
  const todasLasCotizaciones: CotizacionProcesada[] = [
    ...cotizacionesGeneralProcesadas,
    ...cotizacionesImpresionProcesadas
  ].sort((a, b) => b.fechaCreacion.getTime() - a.fechaCreacion.getTime());

  // Función para abrir una cotización
  const abrirCotizacion = (id: string, tipo: string) => {
    if (tipo === 'general') {
      setLocation(`/cotizador-general?escenario=${id}`);
    } else {
      setLocation(`/cotizador-impresion?escenario=${id}`);
    }
  };

  // Formatear fecha para mostrar
  const formatearFecha = (fecha: Date) => {
    const ahora = new Date();
    const diff = ahora.getTime() - fecha.getTime();
    const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (dias === 0) return "Hoy";
    if (dias === 1) return "Ayer";
    if (dias < 7) return `Hace ${dias} días`;
    return fecha.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Header con gradiente azul */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-12">
        <div className="bg-gradient-to-r from-primary to-blue-400 text-white rounded-2xl overflow-hidden shadow-lg border border-gray-100">
          <div className="px-8 py-12 sm:px-12 sm:py-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Cotizador 2025
            </h1>
            <p className="mt-3 text-lg sm:text-xl opacity-90 max-w-2xl">
              Plataforma avanzada para crear cotizaciones profesionales de manera
              rápida y eficiente
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Badge className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 text-sm">
                <Zap className="h-4 w-4 mr-1" />
                Cálculos automáticos
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 text-sm">
                <LineChart className="h-4 w-4 mr-1" />
                Análisis de rentabilidad
              </Badge>
              <Badge className="bg-white/20 hover:bg-white/30 text-white px-4 py-1.5 text-sm">
                <Lightbulb className="h-4 w-4 mr-1" />
                Personalizable
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mt-12 mb-8 text-center">
          Nuestras Herramientas
        </h2>
        
        {/* Tarjetas de cotizadores */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 mb-16">
          {/* Cotizador de Impresión Card */}
          <Card className="overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-0 pt-6">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-blue-100 text-primary rounded-lg">
                  <Printer className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Cotizador de Impresión</CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                Crea cotizaciones para trabajos de impresión con cálculos
                de área y precios por pie cuadrado.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-0">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Cálculo automático de áreas</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Precios por pie cuadrado</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Ideal para banners, vinilos y lonas</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 pb-6">
              <Link href="/cotizador-impresion">
                <Button className="bg-primary hover:bg-primary/90">
                  Abrir Cotizador de Impresión
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>

          {/* Cotizador General Card */}
          <Card className="overflow-hidden shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200">
            <CardHeader className="pb-0 pt-6">
              <div className="flex items-center mb-3">
                <div className="p-3 bg-green-100 text-secondary rounded-lg">
                  <Calculator className="h-6 w-6" />
                </div>
              </div>
              <CardTitle className="text-xl font-bold">Cotizador General</CardTitle>
              <CardDescription className="mt-2 text-gray-600">
                Crea cotizaciones para fabricaciones, letreros y trabajos
                en general con opciones flexibles.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-4 pb-0">
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Fabricaciones y letreros</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Cálculo de márgenes y comisiones</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                  <span>Exportación en múltiples formatos</span>
                </li>
              </ul>
            </CardContent>
            <CardFooter className="flex justify-end pt-4 pb-6">
              <Link href="/cotizador-general">
                <Button className="bg-secondary hover:bg-secondary/90 text-white">
                  Abrir Cotizador General
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        </div>

        {/* Tabla de Cotizaciones Guardadas */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Cotizaciones Guardadas</h2>
          </div>
          <Card>
            <CardContent className="p-0 overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Precio</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {todasLasCotizaciones.length > 0 ? (
                    todasLasCotizaciones.map((cotizacion) => (
                      <TableRow key={`${cotizacion.tipo}-${cotizacion.id}`}>
                        <TableCell className="font-medium">{cotizacion.nombre}</TableCell>
                        <TableCell className="max-w-xs truncate">{cotizacion.descripcion}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={cotizacion.tipo === 'general' ? 
                              "bg-green-50 text-secondary border-secondary/20" : 
                              "bg-blue-50 text-primary border-primary/20"}>
                            {cotizacion.tipo === 'general' ? 'General' : 'Impresión'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>{formatearFecha(cotizacion.fechaCreacion)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatearPrecioDOP(cotizacion.precioFinalNum)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => abrirCotizacion(cotizacion.id, cotizacion.tipo)}>
                            <FileText className="h-4 w-4 mr-1" />
                            Abrir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay cotizaciones guardadas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
