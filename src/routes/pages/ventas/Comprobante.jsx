// src/routes/pages/ventas/Comprobante.jsx
import { useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
} from "@mui/material";
import { X, ReceiptText, Printer, Download } from "lucide-react";

export default function Comprobante({ open, onClose, ventaResumen }) {
  const comprobanteRef = useRef(null);
  const venta = ventaResumen || {};

  const cliente = venta.cliente || {};
  const sucursal = venta.sucursal || {};
  const empleado = venta.empleado || {};
  const detalles = Array.isArray(venta.detalles) ? venta.detalles : [];

  const formatMoney = (value) => Number(value || 0).toFixed(2);

  const empleadoNombre =
    empleado.nombreCompleto ||
    [empleado.nombre, empleado.apellido, empleado.segundoApellido]
      .filter(Boolean)
      .join(" ") ||
    venta.empleadoNombre ||
    (venta.empleadoId ? `Empleado #${venta.empleadoId}` : "—");

  const clienteNombre =
    cliente.razonSocial ||
    cliente.nombreCompleto ||
    cliente.nombre ||
    venta.clienteNombre ||
    (venta.clienteId ? `Cliente #${venta.clienteId}` : "—");

  const sucursalNombre =
    sucursal.nombre ||
    venta.sucursalNombre ||
    (venta.sucursalId ? `Sucursal #${venta.sucursalId}` : "—");

  const fechaTexto = venta.fechaRegistro
    ? new Date(venta.fechaRegistro).toLocaleString("es-BO")
    : "—";

  const printStyles = `
    <style>
      @page {
        size: 8.5in 5.5in;
        margin: 0.25in;
      }

      * {
        box-sizing: border-box;
      }

      body {
        font-family: Arial, sans-serif;
        margin: 0;
        color: #111;
        background: white;
      }

      .receipt {
        width: 8in;
        min-height: 5in;
        margin: 0 auto;
        padding: 10px 14px;
        font-size: 11px;
      }

      .company {
        text-align: center;
        border-bottom: 2px solid #592B2B;
        padding-bottom: 6px;
        margin-bottom: 8px;
      }

      .company h1 {
        margin: 0;
        font-size: 24px;
        color: #592B2B;
        letter-spacing: 1px;
      }

      .company p {
        margin: 2px 0 0;
        font-size: 11px;
        color: #555;
      }

      .sale-box {
        display: flex;
        justify-content: space-between;
        background: #f6f1f1;
        border-radius: 6px;
        padding: 8px 10px;
        margin-bottom: 8px;
      }

      .sale-box h2 {
        margin: 0;
        font-size: 16px;
        color: #2b1111;
      }

      .sale-box p {
        margin: 2px 0 0;
        font-size: 11px;
      }

      .info-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-bottom: 8px;
      }

      .info-card {
        border: 1px solid #ddd;
        border-radius: 6px;
        padding: 7px 9px;
      }

      .info-card h3 {
        margin: 0 0 4px;
        font-size: 12px;
        color: #2b1111;
      }

      .info-card p {
        margin: 2px 0;
        font-size: 10.5px;
      }

      table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 5px;
        font-size: 10px;
      }

      th {
        background: #f6f1f1;
        color: #2b1111;
      }

      th, td {
        border: 1px solid #d8d8d8;
        padding: 5px;
      }

      .right {
        text-align: right;
      }

      .total {
        margin-top: 8px;
        border-top: 2px solid #592B2B;
        padding-top: 6px;
        text-align: right;
        font-size: 16px;
        font-weight: bold;
      }

      .footer {
        text-align: center;
        margin-top: 8px;
        font-size: 10px;
        color: #555;
      }

      @media print {
        body {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
      }
    </style>
  `;

  const openPrintWindow = () => {
    if (!comprobanteRef.current) return null;

    const ventana = window.open("", "PRINT", "width=900,height=650");
    if (!ventana) return null;

    ventana.document.write(`
      <html>
        <head>
          <title>Comprobante de venta - Comercial Poma</title>
          ${printStyles}
        </head>
        <body>${comprobanteRef.current.innerHTML}</body>
      </html>
    `);

    ventana.document.close();
    ventana.focus();

    return ventana;
  };

  const handlePrint = () => {
    const ventana = openPrintWindow();
    if (!ventana) return;

    setTimeout(() => {
      ventana.print();
      ventana.close();
    }, 250);
  };

  const handleDownload = () => {
    openPrintWindow();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          width: { xs: "96%", sm: "90%", md: "850px" },
          m: { xs: 1, sm: 2 },
        },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: "#592B2B",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          py: 1.8,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptText size={22} />
          Comprobante de venta
        </Box>

        <IconButton onClick={onClose} sx={{ color: "white" }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ bgcolor: "#fafafa", p: 3 }}>
        <Box
          ref={comprobanteRef}
          sx={{
            bgcolor: "white",
            borderRadius: 2,
            p: 2,
            border: "1px solid #e5e5e5",
          }}
        >
          <Box className="receipt">
            <Box className="company">
              <Typography
                component="h1"
                sx={{
                  m: 0,
                  fontSize: 28,
                  color: "#592B2B",
                  fontWeight: 900,
                  letterSpacing: 1,
                  textAlign: "center",
                }}
              >
                COMERCIAL POMA
              </Typography>

              <Typography sx={{ textAlign: "center", color: "#666" }}>
                “Calidad y confianza en cada producto”
              </Typography>
            </Box>

            <Box
              className="sale-box"
              sx={{
                display: "flex",
                justifyContent: "space-between",
                bgcolor: "#f6f1f1",
                borderRadius: 2,
                p: 1.5,
                my: 1.5,
                gap: 2,
                flexWrap: "wrap",
              }}
            >
              <Box>
                <Typography component="h2" fontWeight={900} fontSize={20}>
                  Venta #: {venta.codigoVenta || venta.id || "—"}
                </Typography>
                <Typography fontSize={13}>Fecha: {fechaTexto}</Typography>
              </Box>

              <Typography fontWeight={800} color="#592B2B">
                Comprobante
              </Typography>
            </Box>

            <Box
              className="info-grid"
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
                gap: 1.5,
                mb: 1.5,
              }}
            >
              <InfoCard
                title="Datos del cliente"
                lines={[
                  `Nombre/Razón social: ${clienteNombre}`,
                  `NIT: ${cliente.nit || "—"}`,
                  `Teléfono: ${cliente.telefono || cliente.celular || "—"}`,
                  `Correo: ${cliente.correo || "—"}`,
                ]}
              />

              <InfoCard
                title="Sucursal y empleado"
                lines={[
                  `Sucursal: ${sucursalNombre}`,
                  `Ciudad: ${sucursal.ciudad || sucursal.ciudadNombre || "—"}`,
                  `Dirección: ${sucursal.direccion || "—"}`,
                  `Teléfono: ${sucursal.telefono || "—"}`,
                  `Atendido por: ${empleadoNombre}`,
                ]}
              />
            </Box>

            <Typography fontWeight={900} color="#2b1111" mb={1}>
              Detalles de la venta
            </Typography>
            <Box sx={{ width: "100%", overflowX: "auto" }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: "#f6f1f1" }}>
                    <TableCell>
                      <b>Producto</b>
                    </TableCell>
                    <TableCell>
                      <b>Marca / Modelo</b>
                    </TableCell>
                    <TableCell>
                      <b>N° Serie</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Precio (Bs)</b>
                    </TableCell>
                    <TableCell align="right">
                      <b>Subtotal (Bs)</b>
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {detalles.length > 0 ? (
                    detalles.map((detalle, index) => {
                      const prod = detalle.producto || {};
                      const modelo = prod.modelo || {};
                      const marca = modelo.marca || {};

                      const marcaModelo =
                        [
                          marca.nombre || prod.marcaNombre,
                          modelo.nombreModelo || prod.modeloNombre,
                          modelo.color || prod.color,
                        ]
                          .filter(Boolean)
                          .join(" - ") || "—";

                      const precioUnitario = Number(
                        detalle.precioUnitario || prod.precio || detalle.subtotal || 0
                      ).toFixed(2);

                      return (
                        <TableRow key={detalle.id || index}>
                          <TableCell>
                            {prod.descripcion || detalle.descripcion || "Producto"}
                          </TableCell>

                          <TableCell>{marcaModelo}</TableCell>

                          <TableCell>
                            {prod.numeroSerie || detalle.numeroSerie || "—"}
                          </TableCell>

                          <TableCell align="right">
                            {precioUnitario}
                          </TableCell>

                          <TableCell align="right">
                            {formatMoney(detalle.subtotal)}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        No hay productos registrados
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Box>
            <Box
              className="total"
              sx={{
                mt: 2,
                pt: 1.5,
                borderTop: "2px solid #592B2B",
                textAlign: "right",
                fontSize: 22,
                fontWeight: 900,
              }}
            >
              TOTAL: Bs {formatMoney(venta.total)}
            </Box>

            <Box className="footer" sx={{ textAlign: "center", mt: 2 }}>
              <Typography fontSize={13}>¡Gracias por su compra!</Typography>
              <Typography fontSize={12} color="text.secondary">
                Comercial Poma - Su tienda de confianza
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2, flexWrap: "wrap", gap: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Cerrar
        </Button>

        <Button
          onClick={handleDownload}
          variant="outlined"
          startIcon={<Download size={17} />}
          sx={{
            borderColor: "#592B2B",
            color: "#592B2B",
            "&:hover": {
              borderColor: "#3A1A1A",
              bgcolor: "#592B2B10",
            },
          }}
        >
          Descargar
        </Button>

        <Button
          onClick={handlePrint}
          variant="contained"
          startIcon={<Printer size={17} />}
          sx={{
            bgcolor: "#592B2B",
            "&:hover": { bgcolor: "#3A1A1A" },
          }}
        >
          Imprimir
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoCard({ title, lines }) {
  return (
    <Box
      className="info-card"
      sx={{
        border: "1px solid #ddd",
        borderRadius: 2,
        p: 1.5,
        bgcolor: "#fff",
      }}
    >
      <Typography component="h3" fontWeight={900} color="#2b1111" mb={0.7}>
        {title}
      </Typography>

      {(Array.isArray(lines) ? lines : []).map((line, index) => (
        <Typography key={index} fontSize={13} color="#333">
          {line}
        </Typography>
      ))}
    </Box>
  );
}