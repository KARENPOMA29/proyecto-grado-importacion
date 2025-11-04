import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { login as loginApi } from "@/services/auth.service";
import { recuperarPassword } from "@/services/auth.service";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Alert from "@mui/material/Alert";
import PersonIcon from "@mui/icons-material/Person";
import LockIcon from "@mui/icons-material/Lock";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import EmailIcon from "@mui/icons-material/Email";
import BadgeIcon from "@mui/icons-material/Badge";
import "./Login.css";

const rolePaths = {
  Administrador: "/admin",
  Ventas: "/ventas",
  Almacen: "/almacen",
  Pilotero: "/pilotero",
};

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [showRecover, setShowRecover] = useState(false);
  const [recoverEmail, setRecoverEmail] = useState("");
  const [recoverCi, setRecoverCi] = useState("");
  const [recoverMsg, setRecoverMsg] = useState("");
  const [recoverLoading, setRecoverLoading] = useState(false);

  const handleClickShowPassword = () => setShowPassword(!showPassword);

  const onSubmit = async (form) => {
    try {
      setError("");
      const data = await loginApi({
        usuario: form.usuario,
        contrasena: form.contrasena,
      });
      login(data);
      const dest = rolePaths[data.rol] || "/login";
      navigate(dest, { replace: true });
    } catch (err) {
      setError(typeof err === "string" ? err : "Error en el inicio de sesión");
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    setRecoverMsg("");
    setRecoverLoading(true);
    try {
      await recuperarPassword({ correo: recoverEmail, ci: recoverCi });
      setRecoverMsg("✅ Se envió su usuario y contraseña al correo registrado.");
      setRecoverEmail("");
      setRecoverCi("");
    } catch (err) {
      setRecoverMsg("❌ No se encontró un usuario con esos datos.");
    } finally {
      setRecoverLoading(false);
    }
  };

  return (
    <div className="login-container">
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          width: "100%",
          minHeight: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <Box className="login-box" sx={{ width: "100%" }}>
          <div className="login-header">
            <Typography component="h1" variant="h5">
              Sistema de Importación
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              Inicie sesión para continuar
            </Typography>
          </div>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="login-form">
            <TextField
              fullWidth
              variant="outlined"
              label="Usuario"
              {...register("usuario", { required: "El usuario es requerido" })}
              error={!!errors.usuario}
              helperText={errors.usuario?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <PersonIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              variant="outlined"
              label="Contraseña"
              type={showPassword ? "text" : "password"}
              {...register("contrasena", { required: "La contraseña es requerida" })}
              error={!!errors.contrasena}
              helperText={errors.contrasena?.message}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              className="submit-button"
              sx={{ mt: 2 }}
            >
              Iniciar Sesión
            </Button>
          </form>

          <Button
            fullWidth
            variant="text"
            size="small"
            sx={{ mt: 1 }}
            onClick={() => setShowRecover(!showRecover)}
          >
            ¿Olvidaste tu contraseña?
          </Button>

          {showRecover && (
            <Box
              sx={{
                mt: 2,
                p: 2,
                border: "1px solid #e0e0e0",
                borderRadius: 1,
                backgroundColor: "#fafafa",
              }}
            >
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Recuperar contraseña
              </Typography>
              <form onSubmit={handleRecover}>
                <TextField
                  fullWidth
                  type="email"
                  label="Correo registrado"
                  value={recoverEmail}
                  onChange={(e) => setRecoverEmail(e.target.value)}
                  sx={{ mb: 1 }}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  required
                />

                <TextField
                  fullWidth
                  label="Cédula de Identidad"
                  value={recoverCi}
                  onChange={(e) => setRecoverCi(e.target.value.replace(/\D/g, ""))}
                  size="small"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <BadgeIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                  inputProps={{ maxLength: 8 }}
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  size="small"
                  sx={{ mt: 2 }}
                  disabled={recoverLoading}
                >
                  {recoverLoading ? "Enviando..." : "Enviar correo"}
                </Button>
              </form>

              {recoverMsg && (
                <Alert
                  severity={recoverMsg.startsWith("✅") ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {recoverMsg}
                </Alert>
              )}
            </Box>
          )}
        </Box>
      </Container>
    </div>
  );
}
