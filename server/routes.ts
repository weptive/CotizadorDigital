import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { storage } from "./storage";

const apiPrefix = "/api";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generic error handling middleware
  const handleApiError = (res: any, error: any) => {
    console.error("API Error:", error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: "Datos inválidos", details: error.errors });
    }
    return res.status(500).json({ error: error.message || "Error del servidor" });
  };

  // Cliente endpoints
  app.get(`${apiPrefix}/clientes`, async (req, res) => {
    try {
      const clientes = await storage.getClientes();
      res.json(clientes);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get(`${apiPrefix}/clientes/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const cliente = await storage.getClienteById(id);
      if (!cliente) {
        return res.status(404).json({ error: "Cliente no encontrado" });
      }
      res.json(cliente);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post(`${apiPrefix}/clientes`, async (req, res) => {
    try {
      const cliente = await storage.insertCliente(req.body);
      res.status(201).json(cliente);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Cotizador General endpoints
  app.get(`${apiPrefix}/cotizador-general/escenarios`, async (req, res) => {
    try {
      const escenarios = await storage.getCotizacionesGeneral();
      res.json(escenarios);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get(`${apiPrefix}/cotizador-general/escenarios/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const escenario = await storage.getCotizacionGeneralById(id);
      if (!escenario) {
        return res.status(404).json({ error: "Escenario no encontrado" });
      }
      res.json(escenario);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post(`${apiPrefix}/cotizador-general/escenarios`, async (req, res) => {
    try {
      const escenario = await storage.insertCotizacionGeneral(req.body);
      res.status(201).json(escenario);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.put(`${apiPrefix}/cotizador-general/escenarios/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const escenario = await storage.updateCotizacionGeneral(id, req.body);
      if (!escenario) {
        return res.status(404).json({ error: "Escenario no encontrado" });
      }
      res.json(escenario);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.delete(`${apiPrefix}/cotizador-general/escenarios/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCotizacionGeneral(id);
      res.status(204).end();
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Plantillas General endpoints
  app.get(`${apiPrefix}/cotizador-general/templates`, async (req, res) => {
    try {
      const templates = await storage.getPlantillasGeneral();
      res.json(templates);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get(`${apiPrefix}/cotizador-general/templates/:nombre`, async (req, res) => {
    try {
      const nombre = req.params.nombre;
      const template = await storage.getPlantillaGeneralByNombre(nombre);
      if (!template) {
        return res.status(404).json({ error: "Plantilla no encontrada" });
      }
      res.json(template);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post(`${apiPrefix}/cotizador-general/templates`, async (req, res) => {
    try {
      const template = await storage.insertPlantillaGeneral(req.body);
      res.status(201).json(template);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.delete(`${apiPrefix}/cotizador-general/templates/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlantillaGeneral(id);
      res.status(204).end();
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Cotizador Impresion endpoints
  app.get(`${apiPrefix}/cotizador-impresion/escenarios`, async (req, res) => {
    try {
      const escenarios = await storage.getCotizacionesImpresion();
      res.json(escenarios);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get(`${apiPrefix}/cotizador-impresion/escenarios/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const escenario = await storage.getCotizacionImpresionById(id);
      if (!escenario) {
        return res.status(404).json({ error: "Escenario no encontrado" });
      }
      res.json(escenario);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post(`${apiPrefix}/cotizador-impresion/escenarios`, async (req, res) => {
    try {
      const escenario = await storage.insertCotizacionImpresion(req.body);
      res.status(201).json(escenario);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.put(`${apiPrefix}/cotizador-impresion/escenarios/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const escenario = await storage.updateCotizacionImpresion(id, req.body);
      if (!escenario) {
        return res.status(404).json({ error: "Escenario no encontrado" });
      }
      res.json(escenario);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.delete(`${apiPrefix}/cotizador-impresion/escenarios/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCotizacionImpresion(id);
      res.status(204).end();
    } catch (error) {
      handleApiError(res, error);
    }
  });

  // Plantillas Impresion endpoints
  app.get(`${apiPrefix}/cotizador-impresion/templates`, async (req, res) => {
    try {
      const templates = await storage.getPlantillasImpresion();
      res.json(templates);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.get(`${apiPrefix}/cotizador-impresion/templates/:nombre`, async (req, res) => {
    try {
      const nombre = req.params.nombre;
      const template = await storage.getPlantillaImpresionByNombre(nombre);
      if (!template) {
        return res.status(404).json({ error: "Plantilla no encontrada" });
      }
      res.json(template);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.post(`${apiPrefix}/cotizador-impresion/templates`, async (req, res) => {
    try {
      const template = await storage.insertPlantillaImpresion(req.body);
      res.status(201).json(template);
    } catch (error) {
      handleApiError(res, error);
    }
  });

  app.delete(`${apiPrefix}/cotizador-impresion/templates/:id`, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deletePlantillaImpresion(id);
      res.status(204).end();
    } catch (error) {
      handleApiError(res, error);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
