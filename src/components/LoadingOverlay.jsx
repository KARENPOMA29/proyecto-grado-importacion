import { CircularProgress, Box, Fade } from "@mui/material";

const LoadingOverlay = ({ open }) => {
  return (
    <Fade in={open} unmountOnExit>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          backgroundColor: "rgba(0,0,0,0.35)",
          backdropFilter: "blur(2px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CircularProgress
          size={70}
          thickness={4}
          sx={{ color: "#592B2B" }}
        />
      </Box>
    </Fade>
  );
};

export default LoadingOverlay;
