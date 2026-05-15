import { Dialog, Box, Typography, Fade, Grow } from "@mui/material";
import { CheckCircle } from "lucide-react";

const SuccessDialog = ({
  open,
  message = "Operación realizada correctamente",
  title = "¡Éxito!",
}) => {
  return (
    <Dialog
      open={open}
      maxWidth="xs"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 5,
            px: 4,
            py: 3.5,
            textAlign: "center",
            overflow: "hidden",
            position: "relative",
            bgcolor: "#FFFFFF",
            boxShadow: "0 24px 70px rgba(20, 174, 92, 0.22)",
          },
        },
      }}
    >
      <Fade in={open} timeout={220}>
        <Box sx={{ py: 1.5, position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              top: -70,
              right: -65,
              width: 150,
              height: 150,
              borderRadius: "50%",
              bgcolor: "#14AE5C10",
            }}
          />

          <Grow in={open} timeout={280}>
            <Box
              sx={{
                width: 96,
                height: 96,
                borderRadius: "50%",
                bgcolor: "#14AE5C15",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2.2,
                border: "1px solid #14AE5C25",
                boxShadow: "0 12px 30px rgba(20, 174, 92, 0.18)",
              }}
            >
              <CheckCircle size={60} color="#14AE5C" strokeWidth={2.4} />
            </Box>
          </Grow>

          <Typography
            variant="h5"
            sx={{
              color: "#1F2937",
              mb: 1,
              fontWeight: 900,
              letterSpacing: "-0.02em",
            }}
          >
            {title}
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#6B7280",
              fontSize: 15,
              lineHeight: 1.6,
              maxWidth: 320,
              mx: "auto",
            }}
          >
            {message}
          </Typography>
        </Box>
      </Fade>
    </Dialog>
  );
};

export default SuccessDialog;