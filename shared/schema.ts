import { pgTable, text, serial, integer, boolean, json, decimal, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table (already exists)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Clients table
export const clientes = pgTable("clientes", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  correo: text("correo"),
  telefono: text("telefono"),
  proyecto: text("proyecto"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// General Quotation tables
export const cotizacionesGeneral = pgTable("cotizaciones_general", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  items: json("items").notNull().$type<any[]>(),
  margenGanancia: decimal("margen_ganancia", { precision: 10, scale: 2 }).notNull(),
  porcentajeComision: decimal("porcentaje_comision", { precision: 10, scale: 2 }).notNull(),
  precioFinal: json("precio_final").notNull().$type<{ valor: number | null; formula?: string }>(),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id)
});

export const plantillasGeneral = pgTable("plantillas_general", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  items: json("items").notNull().$type<any[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Printing Quotation tables
export const cotizacionesImpresion = pgTable("cotizaciones_impresion", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  itemsImpresion: json("items_impresion").notNull().$type<any[]>(),
  itemsAdicionales: json("items_adicionales").notNull().$type<any[]>(),
  porcentajeComision: decimal("porcentaje_comision", { precision: 10, scale: 2 }).notNull(),
  precioFinal: decimal("precio_final", { precision: 10, scale: 2 }),
  fechaCreacion: timestamp("fecha_creacion").defaultNow().notNull(),
  clienteId: integer("cliente_id").references(() => clientes.id)
});

export const plantillasImpresion = pgTable("plantillas_impresion", {
  id: serial("id").primaryKey(),
  nombre: text("nombre").notNull().unique(),
  itemsImpresion: json("items_impresion").notNull().$type<any[]>(),
  itemsAdicionales: json("items_adicionales").notNull().$type<any[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Relations
export const clientesRelations = relations(clientes, ({ many }) => ({
  cotizacionesGeneral: many(cotizacionesGeneral),
  cotizacionesImpresion: many(cotizacionesImpresion),
}));

export const cotizacionesGeneralRelations = relations(cotizacionesGeneral, ({ one }) => ({
  cliente: one(clientes, {
    fields: [cotizacionesGeneral.clienteId],
    references: [clientes.id],
  }),
}));

export const cotizacionesImpresionRelations = relations(cotizacionesImpresion, ({ one }) => ({
  cliente: one(clientes, {
    fields: [cotizacionesImpresion.clienteId],
    references: [clientes.id],
  }),
}));

// Schemas for validation
export const clienteInsertSchema = createInsertSchema(clientes);
export type ClienteInsert = z.infer<typeof clienteInsertSchema>;
export const clienteSelectSchema = createSelectSchema(clientes);
export type Cliente = z.infer<typeof clienteSelectSchema>;

export const cotizacionGeneralInsertSchema = createInsertSchema(cotizacionesGeneral);
export type CotizacionGeneralInsert = z.infer<typeof cotizacionGeneralInsertSchema>;
export const cotizacionGeneralSelectSchema = createSelectSchema(cotizacionesGeneral);
export type CotizacionGeneral = z.infer<typeof cotizacionGeneralSelectSchema>;

export const plantillaGeneralInsertSchema = createInsertSchema(plantillasGeneral);
export type PlantillaGeneralInsert = z.infer<typeof plantillaGeneralInsertSchema>;
export const plantillaGeneralSelectSchema = createSelectSchema(plantillasGeneral);
export type PlantillaGeneral = z.infer<typeof plantillaGeneralSelectSchema>;

export const cotizacionImpresionInsertSchema = createInsertSchema(cotizacionesImpresion);
export type CotizacionImpresionInsert = z.infer<typeof cotizacionImpresionInsertSchema>;
export const cotizacionImpresionSelectSchema = createSelectSchema(cotizacionesImpresion);
export type CotizacionImpresion = z.infer<typeof cotizacionImpresionSelectSchema>;

export const plantillaImpresionInsertSchema = createInsertSchema(plantillasImpresion);
export type PlantillaImpresionInsert = z.infer<typeof plantillaImpresionInsertSchema>;
export const plantillaImpresionSelectSchema = createSelectSchema(plantillasImpresion);
export type PlantillaImpresion = z.infer<typeof plantillaImpresionSelectSchema>;
