import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { PDFGenerationParams, Item, ItemImpresion, ItemAdicional, UnidadMedida } from "@shared/types";

const formatearPrecioDOP = (precio: number) => {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(precio);
};

const convertirAPiesCuadrados = (ancho: number, alto: number, unidad: UnidadMedida): number => {
  const factorConversion = {
    pulgadas: 1 / 144,
    pies: 1,
    centimetros: 1 / 929.0304,
    metros: 10.7639,
  };
  return ancho * alto * factorConversion[unidad];
};

export const generatePDF = (params: PDFGenerationParams) => {
  const {
    title,
    cliente,
    items,
    itemsAdicionales,
    resumen,
    notas
  } = params;

  const doc = new jsPDF();
  
  // Add header with logo (we'll use text since we can't import images)
  doc.setFontSize(20);
  doc.setTextColor(59, 130, 246); // Primary color
  doc.text("Sistema de Cotizaciones", 105, 15, { align: "center" });
  
  // Add title
  doc.setFontSize(18);
  doc.setTextColor(23, 23, 23);
  doc.text(title, 105, 25, { align: "center" });
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  const today = new Date().toLocaleDateString("es-DO");
  doc.text(`Fecha: ${today}`, 20, 35);
  
  // Client information
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Información del Cliente", 20, 45);
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(`Cliente: ${cliente.nombre || "No especificado"}`, 20, 53);
  doc.text(`Correo: ${cliente.correo || "No especificado"}`, 20, 59);
  doc.text(`Teléfono: ${cliente.telefono || "No especificado"}`, 20, 65);
  doc.text(`Proyecto: ${cliente.proyecto || "No especificado"}`, 20, 71);
  
  // Items table
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Detalles de la Cotización", 20, 83);
  
  const isGeneralQuotation = 'precioUnitario' in (items[0] as Item || {});
  
  if (isGeneralQuotation) {
    // General quotation items table
    const generalItems = items as Item[];
    const generalTableData = generalItems.map((item) => [
      item.descripcion,
      item.cantidad.toString(),
      formatearPrecioDOP(item.precioUnitario.valor || 0),
      formatearPrecioDOP((item.precioUnitario.valor || 0) * item.cantidad)
    ]);
    
    autoTable(doc, {
      startY: 88,
      head: [["Descripción", "Cantidad", "Precio Unitario", "Total"]],
      body: generalTableData,
      theme: "grid",
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      columnStyles: {
        0: { cellWidth: 85 },
        3: { halign: "right" }
      }
    });
  } else {
    // Printing quotation items table
    const printingItems = items as ItemImpresion[];
    const printingTableData = printingItems.map((item) => {
      const dimensions = `${item.ancho} x ${item.alto} (${item.unidadMedida})`;
      return [
        dimensions,
        item.areaPiesCuadrados.toFixed(2),
        item.cantidad.toString(),
        formatearPrecioDOP(item.precioVentaPorPie),
        formatearPrecioDOP(item.areaPiesCuadrados * item.cantidad * item.precioVentaPorPie)
      ];
    });
    
    autoTable(doc, {
      startY: 88,
      head: [["Dimensiones", "Pie² Unitario", "Cantidad", "Precio por Pie²", "Total"]],
      body: printingTableData,
      theme: "grid",
      headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
      columnStyles: {
        4: { halign: "right" }
      }
    });
    
    if (itemsAdicionales && itemsAdicionales.length > 0) {
      // Add additional items table
      const lastPosition = (doc as any).lastAutoTable.finalY || 150;
      doc.setFontSize(12);
      doc.text("Ítems Adicionales", 20, lastPosition + 15);
      
      const additionalTableData = itemsAdicionales.map((item) => [
        item.descripcion,
        item.tipo || "N/A",
        formatearPrecioDOP(item.costo),
        item.incluido ? "Incluido" : "No incluido",
        formatearPrecioDOP(item.precioVenta || item.costo)
      ]);
      
      autoTable(doc, {
        startY: lastPosition + 20,
        head: [["Descripción", "Tipo", "Costo", "Estado", "Precio Venta"]],
        body: additionalTableData,
        theme: "grid",
        headStyles: { fillColor: [249, 115, 22], textColor: [255, 255, 255] },
        columnStyles: {
          4: { halign: "right" }
        }
      });
    }
  }
  
  // Summary information
  const lastPosition = (doc as any).lastAutoTable.finalY || 150;
  
  doc.setFontSize(12);
  doc.setTextColor(23, 23, 23);
  doc.text("Resumen", 140, lastPosition + 15);
  
  doc.setFontSize(10);
  doc.text("Subtotal:", 140, lastPosition + 25);
  doc.text(formatearPrecioDOP(resumen.subtotal), 190, lastPosition + 25, { align: "right" });
  
  let currentY = lastPosition + 25;
  
  if (resumen.margenGanancia !== undefined) {
    currentY += 6;
    doc.text(`Margen (${resumen.margenGanancia}%):`, 140, currentY);
    const margenValue = resumen.subtotal * (resumen.margenGanancia / 100);
    doc.text(formatearPrecioDOP(margenValue), 190, currentY, { align: "right" });
  }
  
  if (resumen.porcentajeComision !== undefined) {
    currentY += 6;
    doc.text(`Comisión (${resumen.porcentajeComision}%):`, 140, currentY);
    
    let baseForComision = resumen.subtotal;
    if (resumen.margenGanancia !== undefined) {
      baseForComision = baseForComision * (1 + resumen.margenGanancia / 100);
    }
    
    const comisionValue = baseForComision * (resumen.porcentajeComision / 100);
    doc.text(formatearPrecioDOP(comisionValue), 190, currentY, { align: "right" });
  }
  
  if (resumen.itbis > 0) {
    currentY += 6;
    doc.text(`ITBIS (${resumen.itbis * 100}%):`, 140, currentY);
    doc.text(formatearPrecioDOP(resumen.total * resumen.itbis / (1 + resumen.itbis)), 190, currentY, { align: "right" });
  }
  
  currentY += 6;
  doc.setFontSize(12);
  doc.setTextColor(59, 130, 246);
  doc.text("Total:", 140, currentY);
  doc.text(formatearPrecioDOP(resumen.total), 190, currentY, { align: "right" });
  
  // Notes
  if (notas) {
    currentY += 15;
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text("Notas:", 20, currentY);
    doc.text(notas, 20, currentY + 6);
  }
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(`Página ${i} de ${pageCount}`, 20, doc.internal.pageSize.height - 10);
    doc.text("Sistema de Cotizaciones © " + new Date().getFullYear(), 
      doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, 
      { align: "center" });
  }
  
  // Save PDF
  doc.save(`${title.replace(/\s+/g, '_')}_${today.replace(/\//g, '-')}.pdf`);
};
