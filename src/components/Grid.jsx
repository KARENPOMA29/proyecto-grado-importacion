import {
  useEffect,
  useState,
  useContext,
  forwardRef,
  useImperativeHandle,
  useRef,
} from "react";
import DataTable from "react-data-table-component";
import "@/context/dataTableTheme";
import { ThemeProviderContext } from "@/context/theme-context";
import { customStylesLight, customStylesDark } from "./gridStyles";
import { TextField, InputAdornment, Box, Typography } from "@mui/material";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import BarcodeListener from "./BarcodeListener"; // 💡 integración del lector

const GridGenerico = forwardRef(
  (
    {
      service,
      columns = [],
      renderActions,
      title = "Listado",
      pageSize: initialPageSize = 10,
      enableSearch = true,
    },
    ref
  ) => {
    const [allData, setAllData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const searchInputRef = useRef(null); // 💡 ref del buscador

    const { theme } = useContext(ThemeProviderContext);
    const isDarkMode =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
    const activeStyles = isDarkMode ? customStylesDark : customStylesLight;

    // 🔹 Obtener datos desde el servicio
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await service.getAll();
        const items = Array.isArray(result) ? result : result.items || [];
        setAllData(items);
        setFilteredData(items);
      } catch (e) {
        console.error("Error al obtener datos:", e);
        setAllData([]);
        setFilteredData([]);
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({ refetch: fetchData }));

    useEffect(() => {
      fetchData();
    }, []);

    // 🔹 Filtro dinámico por texto o código escaneado
    useEffect(() => {
      if (!search) {
        setFilteredData(allData);
        return;
      }
      const q = search.toLowerCase();
      const filtered = allData.filter((row) => {
        for (const key in row) {
          const v = row[key];
          if (
            v !== null &&
            v !== undefined &&
            String(v).toLowerCase().includes(q)
          ) {
            return true;
          }
        }
        return false;
      });
      setFilteredData(filtered);
    }, [search, allData]);

    // 🔹 Manejo de escaneo desde lector
    const handleBarcodeScan = (code) => {
      setSearch(code);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
        searchInputRef.current.select?.();
      }
    };

    // 🔹 Columnas con acciones
    const columnsWithActions = [
      ...columns.map((c) => ({
        ...c,
        sortable: false,
        minWidth: c.minWidth || "120px",
        grow: c.grow ?? 1,
      })),
      ...(renderActions
        ? [
            {
              name: "Acciones",
              id: "acciones",
              cell: (row) => (
                <div className="flex flex-nowrap items-center justify-end gap-2 whitespace-nowrap">
                  {renderActions(row)}
                </div>
              ),
              ignoreRowClick: true,
              sortable: false,
              minWidth: "180px",
              right: true,
            },
          ]
        : []),
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* 💡 Escucha el lector de códigos (activo incluso sin foco) */}
        <BarcodeListener
          onScan={handleBarcodeScan}
          targetRef={searchInputRef}
          enabled={enableSearch}
          autoLength={13}
          debug={false}
        />

        {/* 🔍 HEADER CON BUSCADOR */}
        {enableSearch && (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              borderBottom: "1px solid",
              borderColor: isDarkMode ? "grey.700" : "grey.300",
              py: 2,
              px: 3,
              gap: 1,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: "600",
                color: isDarkMode ? "grey.100" : "grey.800",
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <TextField
              inputRef={searchInputRef} // 💡 conectamos el ref
              variant="outlined"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{
                width: "50%",
                minWidth: 280,
                "& .MuiOutlinedInput-root": {
                  borderRadius: "20px",
                  backgroundColor: isDarkMode ? "#1E1E1E" : "#fafafa",
                },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: isDarkMode ? "#555" : "#ccc",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#592B2B",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "#592B2B",
                },
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ color: "#592B2B" }} />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        )}

        {/* TABLA */}
        <div className="p-0">
          <DataTable
            columns={columnsWithActions}
            data={filteredData}
            progressPending={loading}
            progressComponent={
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#592B2B]" />
                <span className="ml-3 text-gray-600 dark:text-gray-300">
                  Cargando datos…
                </span>
              </div>
            }
            pagination
            paginationServer={false}
            paginationPerPage={initialPageSize}
            paginationRowsPerPageOptions={[5, 10, 15, 20, 30, 50]}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                <div className="text-lg font-medium">
                  No hay datos disponibles
                </div>
              </div>
            }
            theme={isDarkMode ? "customDark" : "light"}
            customStyles={activeStyles}
            paginationComponentOptions={{
              rowsPerPageText: "Registros por página:",
              rangeSeparatorText: "de",
            }}
            striped
            persistTableHead
          />
        </div>
      </div>
    );
  }
);

export default GridGenerico;
