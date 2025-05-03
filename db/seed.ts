import { db } from "./index";
import * as schema from "@shared/schema";
import { Item, ItemImpresion, ItemAdicional } from "@shared/types";

async function seed() {
  try {
    // Seed clients
    const existingClients = await db.query.clientes.findMany();
    
    if (existingClients.length === 0) {
      console.log("Seeding clients...");
      await db.insert(schema.clientes).values([
        {
          nombre: "Empresa ABC, S.R.L.",
          correo: "contacto@empresaabc.com",
          telefono: "+1 (809) 555-1234",
          proyecto: "Rediseño de Identidad Corporativa"
        },
        {
          nombre: "Restaurante El Sabor",
          correo: "info@elsabor.com",
          telefono: "+1 (809) 555-5678",
          proyecto: "Materiales Promocionales"
        },
        {
          nombre: "Juan Pérez",
          correo: "juan.perez@email.com",
          telefono: "+1 (829) 555-9876",
          proyecto: "Banner para Evento"
        }
      ]);
    }

    // Seed templates for Cotizador General
    const existingGeneralTemplates = await db.query.plantillasGeneral.findMany();
    
    if (existingGeneralTemplates.length === 0) {
      console.log("Seeding general quotation templates...");
      
      // Sample items for general template
      const generalTemplateItems: Item[] = [
        {
          id: "1",
          descripcion: "Banner promocional",
          cantidad: 2,
          precioUnitario: { valor: 3500 },
          mostrarExtendido: true,
          esImpresion: true,
          categoria: "impresion",
          extendido: {
            ancho: 48,
            alto: 36,
            unidadMedida: "pulgadas",
            costoPorPie: 150
          },
          areaPiesCuadrados: 12
        },
        {
          id: "2",
          descripcion: "Materiales de instalación",
          cantidad: 1,
          precioUnitario: { valor: 1200 },
          mostrarExtendido: false,
          esImpresion: false,
          categoria: "materiales"
        },
        {
          id: "3",
          descripcion: "Servicio de instalación",
          cantidad: 1,
          precioUnitario: { valor: 2800 },
          mostrarExtendido: false,
          esImpresion: false,
          categoria: "servicios"
        }
      ];
      
      await db.insert(schema.plantillasGeneral).values([
        {
          nombre: "Proyecto Banner Promocional",
          items: generalTemplateItems
        },
        {
          nombre: "Diseño Web Básico",
          items: [
            {
              id: "1",
              descripcion: "Diseño de página principal",
              cantidad: 1,
              precioUnitario: { valor: 15000 },
              mostrarExtendido: false,
              esImpresion: false,
              categoria: "servicios"
            },
            {
              id: "2",
              descripcion: "Páginas interiores (hasta 5)",
              cantidad: 5,
              precioUnitario: { valor: 5000 },
              mostrarExtendido: false,
              esImpresion: false,
              categoria: "servicios"
            },
            {
              id: "3",
              descripcion: "Optimización SEO",
              cantidad: 1,
              precioUnitario: { valor: 8000 },
              mostrarExtendido: false,
              esImpresion: false,
              categoria: "servicios"
            }
          ]
        }
      ]);
    }

    // Seed templates for Cotizador Impresion
    const existingImpresionTemplates = await db.query.plantillasImpresion.findMany();
    
    if (existingImpresionTemplates.length === 0) {
      console.log("Seeding printing quotation templates...");
      
      // Sample items for printing template
      const impresionTemplateItems: ItemImpresion[] = [
        {
          id: "1",
          ancho: 48,
          alto: 36,
          unidadMedida: "pulgadas",
          cantidad: 2,
          costoPorPie: 150,
          precioVentaPorPie: 300,
          areaPiesCuadrados: 12
        },
        {
          id: "2",
          ancho: 24,
          alto: 36,
          unidadMedida: "pulgadas",
          cantidad: 4,
          costoPorPie: 150,
          precioVentaPorPie: 300,
          areaPiesCuadrados: 6
        }
      ];
      
      const impresionTemplateAdicionales: ItemAdicional[] = [
        {
          id: "1",
          descripcion: "Laminado mate",
          costo: 1200,
          tipo: "acabado",
          incluido: true,
          precioVenta: 1200,
          modoPrecio: "directo"
        },
        {
          id: "2",
          descripcion: "Ojales metálicos",
          costo: 800,
          tipo: "material",
          incluido: true,
          precioVenta: 800,
          modoPrecio: "directo"
        },
        {
          id: "3",
          descripcion: "Instalación en sitio",
          costo: 2500,
          tipo: "instalacion",
          incluido: false,
          precioVenta: 3500,
          modoPrecio: "margen",
          margen: 40
        }
      ];
      
      await db.insert(schema.plantillasImpresion).values([
        {
          nombre: "Banners Promocionales",
          itemsImpresion: impresionTemplateItems,
          itemsAdicionales: impresionTemplateAdicionales
        },
        {
          nombre: "Vallas Publicitarias",
          itemsImpresion: [
            {
              id: "1",
              ancho: 120,
              alto: 80,
              unidadMedida: "pulgadas",
              cantidad: 1,
              costoPorPie: 200,
              precioVentaPorPie: 400,
              areaPiesCuadrados: 55.56
            }
          ],
          itemsAdicionales: [
            {
              id: "1",
              descripcion: "Material resistente a exteriores",
              costo: 3000,
              tipo: "material",
              incluido: true,
              precioVenta: 3000,
              modoPrecio: "directo"
            },
            {
              id: "2",
              descripcion: "Montaje en estructura",
              costo: 5000,
              tipo: "instalacion",
              incluido: false,
              precioVenta: 7500,
              modoPrecio: "margen",
              margen: 50
            }
          ]
        }
      ]);
    }

    // Seed scenarios for Cotizador General
    const existingGeneralScenarios = await db.query.cotizacionesGeneral.findMany();
    
    if (existingGeneralScenarios.length === 0) {
      console.log("Seeding general quotation scenarios...");
      
      // Get client IDs for reference
      const clients = await db.query.clientes.findMany();
      const clientIds = clients.map(client => client.id);
      
      if (clientIds.length > 0) {
        await db.insert(schema.cotizacionesGeneral).values([
          {
            nombre: "Cotización General #1254",
            descripcion: "Proyecto de diseño web",
            items: [
              {
                id: "1",
                descripcion: "Diseño de página principal",
                cantidad: 1,
                precioUnitario: { valor: 15000 },
                mostrarExtendido: false,
                esImpresion: false,
                categoria: "servicios"
              },
              {
                id: "2",
                descripcion: "Páginas interiores (hasta 5)",
                cantidad: 5,
                precioUnitario: { valor: 5000 },
                mostrarExtendido: false,
                esImpresion: false,
                categoria: "servicios"
              }
            ],
            margenGanancia: 25,
            porcentajeComision: 10,
            precioFinal: { valor: 46125 },
            fechaCreacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            clienteId: clientIds[0]
          }
        ]);
      }
    }

    // Seed scenarios for Cotizador Impresion
    const existingImpresionScenarios = await db.query.cotizacionesImpresion.findMany();
    
    if (existingImpresionScenarios.length === 0) {
      console.log("Seeding printing quotation scenarios...");
      
      // Get client IDs for reference
      const clients = await db.query.clientes.findMany();
      const clientIds = clients.map(client => client.id);
      
      if (clientIds.length > 0) {
        await db.insert(schema.cotizacionesImpresion).values([
          {
            nombre: "Cotización Impresión #0982",
            descripcion: "Banner promocional 4x2m",
            itemsImpresion: [
              {
                id: "1",
                ancho: 157,
                alto: 79,
                unidadMedida: "pulgadas",
                cantidad: 1,
                costoPorPie: 150,
                precioVentaPorPie: 300,
                areaPiesCuadrados: 60.15
              }
            ],
            itemsAdicionales: [
              {
                id: "1",
                descripcion: "Laminado brillante",
                costo: 1800,
                tipo: "acabado",
                incluido: true,
                precioVenta: 1800,
                modoPrecio: "directo"
              },
              {
                id: "2",
                descripcion: "Transporte",
                costo: 1200,
                tipo: "transporte",
                incluido: false,
                precioVenta: 1500,
                modoPrecio: "directo"
              }
            ],
            porcentajeComision: 10,
            precioFinal: 23482,
            fechaCreacion: new Date(), // Today
            clienteId: clientIds[2]
          }
        ]);
      }
    }

    console.log("Seed completed successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
