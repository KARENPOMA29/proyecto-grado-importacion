import { Dialog, Box, Typography, Fade } from "@mui/material";
import { CheckCircle } from "lucide-react";

const SuccessDialog = ({ open, message }) => {
  return (
    <Dialog
      open={open}
      PaperProps={{
        sx: {
          borderRadius: 4,
          padding: 3,
          textAlign: "center",
        },
      }}
    >
      <Fade in={open}>
        <Box sx={{ p: 2 }}>
          <CheckCircle size={70} color="#14AE5C" />
          <Typography variant="h6" fontWeight={700} mt={2}>
            ¡Éxito!
          </Typography>
          <Typography variant="body1" sx={{ mt: 1, mb: 2 }}>
            {message}
          </Typography>
        </Box>
      </Fade>
    </Dialog>
  );
};

export default SuccessDialog;
