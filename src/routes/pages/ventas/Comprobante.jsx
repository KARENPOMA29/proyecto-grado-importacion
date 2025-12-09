// src/routes/pages/ventas/Comprobante.jsx
import { useRef } from "react";
import {
  Modal,
  Paper,
  Box,
  Typography,
  Divider,
  Button,
  Grid,
  IconButton,
} from "@mui/material";
import { Download, Printer, X } from "lucide-react";

const Comprobante = ({ open, onClose, ventaResumen }) => {
  const resumenRef = useRef(null);

  const handlePrintResumen = () => {
    if (!resumenRef.current) return;
    const contenido = resumenRef.current.innerHTML;
    const ventana = window.open("", "PRINT", "height=600,width=800");
    ventana.document.write(`
      <html>
        <head>
          <title>Detalle de venta - Comercial Poma</title>
          <style>
            body { 
              font-family: 'Arial', sans-serif; 
              padding: 20px; 
              max-width: 800px;
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              border-bottom: 2px solid #333;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .empresa { 
              font-size: 24px; 
              font-weight: bold; 
              color: #333;
            }
            .slogan {
              font-size: 14px;
              color: #666;
            }
            .codigo-venta {
              background: #f5f5f5;
              padding: 10px;
              text-align: center;
              font-weight: bold;
              margin: 15px 0;
              border-radius: 5px;
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin: 15px 0;
              font-size: 12px;
            }
            th, td { 
              border: 1px solid #ddd; 
              padding: 8px; 
              text-align: left;
            }
            th { 
              background: #f8f9fa; 
              font-weight: bold;
            }
            .total { 
              text-align: right; 
              font-weight: bold; 
              font-size: 16px;
              margin-top: 15px;
              padding-top: 15px;
              border-top: 2px solid #333;
            }
            .footer {
              text-align: center;
              margin-top: 30px;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
    ventana.focus();
    ventana.print();
    ventana.close();
  };

  const handleDownloadResumen = () => {
    if (!resumenRef.current) return;

    const contenido = resumenRef.current.innerHTML;
    const estilo = `
      <style>
        body { 
          font-family: 'Arial', sans-serif; 
          padding: 20px; 
          max-width: 800px;
          margin: 0 auto;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
          margin-bottom: 20px;
        }
        .empresa { 
          font-size: 24px; 
          font-weight: bold; 
          color: #333;
        }
        .slogan {
          font-size: 14px;
          color: #666;
        }
        .codigo-venta {
          background: #f5f5f5;
          padding: 10px;
          text-align: center;
          font-weight: bold;
          margin: 15px 0;
          border-radius: 5px;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 15px 0;
          font-size: 12px;
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 8px; 
          text-align: left;
        }
        th { 
          background: #f8f9fa; 
          font-weight: bold;
        }
        .total { 
          text-align: right; 
          font-weight: bold; 
          font-size: 16px;
          margin-top: 15px;
          padding-top: 15px;
          border-top: 2px solid #333;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          font-size: 12px;
          color: #666;
        }
      </style>
    `;

    const ventana = window.open();
    ventana.document.write(`
      <html>
        <head>
          <title>Detalle de venta - Comercial Poma</title>
          ${estilo}
        </head>
        <body>${contenido}</body>
      </html>
    `);
    ventana.document.close();
  };

  // ===== Helpers de empleado =====
  const empleado = ventaResumen?.empleado || {};
  const empleadoNombre =
    empleado.nombreCompleto ||
    [empleado.nombre, empleado.apellido, empleado.segundoApellido]
      .filter(Boolean)
      .join(" ") ||
    "N/A";

  const empleadoCi = empleado.ci || "N/A";

  // ===== Fecha =====
  const fechaTexto =
    ventaResumen?.fecha ||
    (ventaResumen?.fechaRegistro
      ? new Date(ventaResumen.fechaRegistro).toLocaleString()
      : "N/A");

  // ===== Total seguro =====
  const totalBs = Number(ventaResumen?.total || 0).toFixed(2);

  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        sx={{
          width: "90%",
          maxWidth: 800,
          maxHeight: "90vh",
          overflow: "auto",
          p: 3,
        }}
      >
        {/* HEADER MODAL */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold">
            Comprobante de Venta
          </Typography>
          <IconButton onClick={onClose}>
            <X size={20} />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        {/* CONTENIDO DEL RESUMEN (LO QUE SE IMPRIME / DESCARGA) */}
        <Box ref={resumenRef}>
          {/* ENCABEZADO EMPRESA */}
          <Box sx={{ textAlign: "center", mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" color="primary">
              COMERCIAL POMA
            </Typography>
            <Typography variant="body2" color="text.secondary">
              "Calidad y confianza en cada producto"
            </Typography>
          </Box>

          {/* CÓDIGO DE VENTA + FECHA */}
          <Box
            sx={{
              backgroundColor: "grey.100",
              p: 2,
              borderRadius: 1,
              textAlign: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              Venta #: {ventaResumen?.codigoVenta || ventaResumen?.id || "N/A"}
            </Typography>
            <Typography variant="body2">Fecha: {fechaTexto}</Typography>
          </Box>

          {/* DATOS DE SUCURSAL Y EMPLEADO */}
          <Box
            sx={{
              backgroundColor: "grey.50",
              p: 2,
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Datos de la Sucursal y Empleado
            </Typography>
            <Grid container spacing={1}>
              {/* Sucursal */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Sucursal:</strong>{" "}
                  {ventaResumen?.sucursal?.nombre || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Ciudad:</strong>{" "}
                  {
                    ventaResumen?.sucursal?.ciudad ||
                    ventaResumen?.sucursal?.ciudadNombre ||
                    "N/A"
                  }
                </Typography>
                <Typography variant="body2">
                  <strong>Teléfono:</strong>{" "}
                  {ventaResumen?.sucursal?.telefono || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Dirección:</strong>{" "}
                  {ventaResumen?.sucursal?.direccion || "N/A"}
                </Typography>
              </Grid>

              {/* Empleado */}
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Atendido por:</strong> {empleadoNombre}
                </Typography>
                
              </Grid>
            </Grid>
          </Box>

          {/* INFORMACIÓN DEL CLIENTE */}
          <Box
            sx={{
              backgroundColor: "grey.50",
              p: 2,
              borderRadius: 1,
              mb: 2,
            }}
          >
            <Typography variant="subtitle1" fontWeight="bold" mb={1}>
              Datos del Cliente
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Nombre / Razón social:</strong>{" "}
                  {ventaResumen?.cliente?.razonSocial ||
                    ventaResumen?.cliente?.nombre ||
                    "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>NIT:</strong>{" "}
                  {ventaResumen?.cliente?.nit || "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Teléfono:</strong>{" "}
                  {ventaResumen?.cliente?.telefono ||
                    ventaResumen?.cliente?.celular ||
                    "N/A"}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2">
                  <strong>Correo:</strong>{" "}
                  {ventaResumen?.cliente?.correo || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Box>

          {/* DETALLES DE PRODUCTOS (TABLA DETALLADA) */}
          <Typography variant="subtitle1" fontWeight="bold" mb={1}>
            Detalles de la Venta
          </Typography>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "20px",
              fontSize: "12px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Producto
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  Marca / Modelo
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "left",
                  }}
                >
                  N° Serie
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "right",
                  }}
                >
                  Precio unit. (Bs)
                </th>
                <th
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                    textAlign: "right",
                  }}
                >
                  Subtotal (Bs)
                </th>
              </tr>
            </thead>
            <tbody>
              {ventaResumen?.detalles?.map((detalle, index) => {
                const prod = detalle.producto || {};
                const modelo = prod.modelo || {};
                const marca = modelo.marca || {};

                const precioUnit = Number(prod.precio || 0).toFixed(2);
                const subtotal = Number(detalle.subtotal || 0).toFixed(2);

                const marcaModelo = [
                  marca.nombre,
                  modelo.nombreModelo,
                  modelo.color,
                ]
                  .filter(Boolean)
                  .join(" - ");

                return (
                  <tr key={index}>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                      }}
                    >
                      {prod.descripcion || "Producto"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                      }}
                    >
                      {marcaModelo || "N/A"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                      }}
                    >
                      {prod.numeroSerie || "N/A"}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "right",
                      }}
                    >
                      {precioUnit}
                    </td>
                    <td
                      style={{
                        border: "1px solid #ddd",
                        padding: "8px",
                        textAlign: "right",
                      }}
                    >
                      {subtotal}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TOTAL */}
          <Box
            sx={{
              textAlign: "right",
              borderTop: "2px solid #333",
              paddingTop: 2,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              TOTAL: Bs {totalBs}
            </Typography>
          </Box>

          {/* PIE DE PÁGINA */}
          <Box
            sx={{
              textAlign: "center",
              mt: 4,
              color: "text.secondary",
            }}
          >
            <Typography variant="body2">
              ¡Gracias por su compra!
            </Typography>
            <Typography variant="caption">
              Comercial Poma - Su tienda de confianza
            </Typography>
          </Box>
        </Box>

        {/* BOTONES DE ACCIÓN */}
        <Box
          sx={{
            display: "flex",
            gap: 2,
            justifyContent: "center",
            mt: 3,
          }}
        >
          <Button
            variant="outlined"
            startIcon={<Download size={16} />}
            onClick={handleDownloadResumen}
          >
            Descargar
          </Button>
          <Button
            variant="contained"
            startIcon={<Printer size={16} />}
            onClick={handlePrintResumen}
          >
            Imprimir
          </Button>
          <Button variant="contained" onClick={onClose}>
            Cerrar
          </Button>
        </Box>
      </Paper>
    </Modal>
  );
};

export default Comprobante;
