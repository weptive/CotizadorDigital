import { db } from "@db";
import { eq, desc, asc } from "drizzle-orm";
import {
  clientes,
  cotizacionesGeneral,
  plantillasGeneral,
  cotizacionesImpresion,
  plantillasImpresion,
} from "@shared/schema";
import type {
  Cliente,
  Escenario,
  CotizadorTemplate,
  EscenarioImpresion,
  TemplateImpresion
} from "@shared/types";

// Cliente operations
export const storage = {
  // Cliente operations
  async getClientes() {
    return db.query.clientes.findMany({
      orderBy: [desc(clientes.createdAt)]
    });
  },

  async getClienteById(id: number) {
    return db.query.clientes.findFirst({
      where: eq(clientes.id, id)
    });
  },

  async insertCliente(cliente: Cliente) {
    const [created] = await db.insert(clientes).values({
      nombre: cliente.nombre,
      correo: cliente.correo,
      telefono: cliente.telefono,
      proyecto: cliente.proyecto
    }).returning();
    return created;
  },

  async updateCliente(id: number, cliente: Partial<Cliente>) {
    const [updated] = await db.update(clientes)
      .set(cliente)
      .where(eq(clientes.id, id))
      .returning();
    return updated;
  },

  // Cotizador General operations
  async getCotizacionesGeneral() {
    return db.query.cotizacionesGeneral.findMany({
      orderBy: [desc(cotizacionesGeneral.fechaCreacion)]
    });
  },

  async getCotizacionGeneralById(id: number) {
    return db.query.cotizacionesGeneral.findFirst({
      where: eq(cotizacionesGeneral.id, id),
      with: {
        cliente: true
      }
    });
  },

  async insertCotizacionGeneral(cotizacion: Escenario) {
    const { id, clienteId, ...cotizacionData } = cotizacion;
    const [created] = await db.insert(cotizacionesGeneral).values({
      nombre: cotizacionData.nombre,
      descripcion: cotizacionData.descripcion,
      items: cotizacionData.items,
      margenGanancia: cotizacionData.margenGanancia,
      porcentajeComision: cotizacionData.porcentajeComision,
      precioFinal: cotizacionData.precioFinal,
      fechaCreacion: new Date(cotizacionData.fechaCreacion),
      clienteId: clienteId ? clienteId : null
    }).returning();
    return created;
  },

  async updateCotizacionGeneral(id: number, cotizacion: Partial<Escenario>) {
    const [updated] = await db.update(cotizacionesGeneral)
      .set(cotizacion)
      .where(eq(cotizacionesGeneral.id, id))
      .returning();
    return updated;
  },

  async deleteCotizacionGeneral(id: number) {
    await db.delete(cotizacionesGeneral).where(eq(cotizacionesGeneral.id, id));
    return { success: true };
  },

  // Plantillas General operations
  async getPlantillasGeneral() {
    return db.query.plantillasGeneral.findMany({
      orderBy: [asc(plantillasGeneral.nombre)]
    });
  },

  async getPlantillaGeneralByNombre(nombre: string) {
    return db.query.plantillasGeneral.findFirst({
      where: eq(plantillasGeneral.nombre, nombre)
    });
  },

  async insertPlantillaGeneral(plantilla: CotizadorTemplate) {
    const { id, ...plantillaData } = plantilla;
    const [created] = await db.insert(plantillasGeneral).values({
      nombre: plantillaData.nombre,
      items: plantillaData.items
    }).returning();
    return created;
  },

  async deletePlantillaGeneral(id: number) {
    await db.delete(plantillasGeneral).where(eq(plantillasGeneral.id, id));
    return { success: true };
  },

  // Cotizador Impresion operations
  async getCotizacionesImpresion() {
    return db.query.cotizacionesImpresion.findMany({
      orderBy: [desc(cotizacionesImpresion.fechaCreacion)]
    });
  },

  async getCotizacionImpresionById(id: number) {
    return db.query.cotizacionesImpresion.findFirst({
      where: eq(cotizacionesImpresion.id, id),
      with: {
        cliente: true
      }
    });
  },

  async insertCotizacionImpresion(cotizacion: EscenarioImpresion) {
    const { id, clienteId, ...cotizacionData } = cotizacion;
    const [created] = await db.insert(cotizacionesImpresion).values({
      nombre: cotizacionData.nombre,
      descripcion: cotizacionData.descripcion,
      itemsImpresion: cotizacionData.itemsImpresion,
      itemsAdicionales: cotizacionData.itemsAdicionales,
      porcentajeComision: cotizacionData.porcentajeComision,
      precioFinal: cotizacionData.precioFinal,
      fechaCreacion: new Date(cotizacionData.fechaCreacion),
      clienteId: clienteId ? clienteId : null
    }).returning();
    return created;
  },

  async updateCotizacionImpresion(id: number, cotizacion: Partial<EscenarioImpresion>) {
    const [updated] = await db.update(cotizacionesImpresion)
      .set(cotizacion)
      .where(eq(cotizacionesImpresion.id, id))
      .returning();
    return updated;
  },

  async deleteCotizacionImpresion(id: number) {
    await db.delete(cotizacionesImpresion).where(eq(cotizacionesImpresion.id, id));
    return { success: true };
  },

  // Plantillas Impresion operations
  async getPlantillasImpresion() {
    return db.query.plantillasImpresion.findMany({
      orderBy: [asc(plantillasImpresion.nombre)]
    });
  },

  async getPlantillaImpresionByNombre(nombre: string) {
    return db.query.plantillasImpresion.findFirst({
      where: eq(plantillasImpresion.nombre, nombre)
    });
  },

  async insertPlantillaImpresion(plantilla: TemplateImpresion) {
    const { id, ...plantillaData } = plantilla;
    const [created] = await db.insert(plantillasImpresion).values({
      nombre: plantillaData.nombre,
      itemsImpresion: plantillaData.itemsImpresion,
      itemsAdicionales: plantillaData.itemsAdicionales
    }).returning();
    return created;
  },

  async deletePlantillaImpresion(id: number) {
    await db.delete(plantillasImpresion).where(eq(plantillasImpresion.id, id));
    return { success: true };
  }
};
