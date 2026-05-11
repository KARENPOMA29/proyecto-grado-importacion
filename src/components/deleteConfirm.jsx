import { createPortal } from 'react-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import {
  Close,
  Delete,
  Warning,
  CheckCircle
} from '@mui/icons-material';
import { useState } from 'react';

const DeleteConfirm = ({ 
  title = "¿Estás seguro?", 
  message = "Esta acción no se puede deshacer.", 
  onConfirm, 
  onCancel,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  loadingText = "Eliminando..."
}) => {
  const [status, setStatus] = useState(null); // 'loading', 'success', 'error'
  const [errorMessage, setErrorMessage] = useState('');

  const handleConfirm = async () => {
    setStatus('loading');
    setErrorMessage('');
    
    try {
      await onConfirm?.();
      
      // Éxito
      setStatus('success');
      setTimeout(() => {
        setStatus(null);
        onCancel?.();
      }, 1500);
      
    } catch (error) {
      console.error('Error en eliminación:', error);
      
      let errorMsg = "Ocurrió un error al intentar eliminar";
      
      if (error?.response?.data) {
        const apiError = error.response.data;
        errorMsg = apiError.detail || apiError.message || apiError.error || errorMsg;
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setStatus('error');
      setErrorMessage(errorMsg);
    }
  };

  const handleClose = () => {
    if (status === 'loading') return;
    setStatus(null);
    setErrorMessage('');
    onCancel?.();
  };

  return createPortal(
    <Dialog 
      open={true} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          overflow: "hidden",
          boxShadow: "0 16px 40px rgba(0,0,0,0.22)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 3,
          py: 2.3,
          background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6" component="span" fontWeight={600}>
          {status === 'success' ? 'Éxito' : 
           status === 'error' ? 'Error' : 
           status === 'loading' ? loadingText : title}
        </Typography>
        {status !== 'loading' && (
          <IconButton 
            sx={{ color: "#fff" }}
            onClick={handleClose}
            size="small"
            disabled={status === 'loading'}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <DialogContent sx={{ 
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center'
      }}>
        {/* Estado: Loading */}
        {status === 'loading' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={48} />
            <Typography variant="body1" color="text.secondary">
              Procesando su solicitud...
            </Typography>
          </Box>
        )}

        {/* Estado: Success */}
        {status === 'success' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            <Typography variant="h6" fontWeight={600}>
              ¡Eliminado correctamente!
            </Typography>
            <Typography variant="body2" color="text.secondary">
              El registro ha sido eliminado con éxito.
            </Typography>
          </Box>
        )}

        {/* Estado: Error */}
        {status === 'error' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <Warning sx={{ fontSize: 48, color: 'warning.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Error al eliminar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {errorMessage}
            </Typography>
          </Box>
        )}

        {/* Estado: Confirmación inicial */}
        {!status && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <Box sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'error.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Delete sx={{ fontSize: 40, color: 'error.main' }} />
            </Box>
            
            <Typography variant="h6" fontWeight={600} textAlign="center">
              {title}
            </Typography>
            
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {message}
            </Typography>
          </Box>
        )}
      </DialogContent>

      {/* Actions - Solo mostrar en estados específicos */}
      <DialogActions sx={{ 
        px: 3, 
        pb: 3,
        gap: 1,
        justifyContent: status === 'error' ? 'center' : 'flex-end'
      }}>
        {/* Estado: Error - Solo botón de entendido */}
        {status === 'error' && (
          <Button 
            variant="contained" 
            onClick={handleClose}
            sx={{ minWidth: 120 }}
          >
            Entendido
          </Button>
        )}

        {/* Estado: Confirmación - Botones Eliminar/Cancelar */}
        {!status && (
          <>
            <Button
              onClick={handleClose}
              variant="outlined"
              sx={{
                minWidth: 120,
                borderRadius: 999,
                textTransform: "none",
                borderColor: "#592B2B",
                color: "#592B2B",
                fontWeight: 600,
              }}
            >
              {cancelText}
            </Button>
           <Button
              onClick={handleConfirm}
              variant="contained"
              sx={{
                minWidth: 120,
                borderRadius: 999,
                textTransform: "none",
                fontWeight: 700,
                background: "linear-gradient(135deg, #592B2B 0%, #3A1A1A 100%)",
                boxShadow: "0 5px 14px rgba(89,43,43,0.35)",
                "&:hover": {
                  background: "linear-gradient(135deg, #3A1A1A 0%, #592B2B 100%)",
                },
              }}
              autoFocus
            >
              {confirmText}
            </Button>
          </>
        )}

        {/* Estados loading y success no muestran botones */}
      </DialogActions>
    </Dialog>,
    document.body
  );
};

export default DeleteConfirm;