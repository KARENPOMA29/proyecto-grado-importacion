import { Dialog, Box, Typography, Fade } from "@mui/material";
import { CheckCircle } from "lucide-react";

const SuccessDialog = ({ open, message }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: 5,
          px: 4,
          py: 3,
          textAlign: "center",
          minWidth: 340,
          overflow: "hidden",
          position: "relative",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={{ py: 1 }}>
          <Box
            sx={{
              width: 92,
              height: 92,
              borderRadius: "50%",
              bgcolor: "#14AE5C15",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <CheckCircle size={58} color="#14AE5C" />
          </Box>

          <Typography
            variant="h5"
            fontWeight={900}
            sx={{
              color: "#1F2937",
              mb: 1,
            }}
          >
            ¡Registrado!
          </Typography>

          <Typography
            variant="body1"
            sx={{
              color: "#6B7280",
              fontSize: 15,
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