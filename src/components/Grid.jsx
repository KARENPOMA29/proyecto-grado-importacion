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
import BarcodeListener from "./BarcodeListener";

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
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [totalRows, setTotalRows] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const searchInputRef = useRef(null);

    const { theme } = useContext(ThemeProviderContext);

    const isDarkMode =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);

    const activeStyles = isDarkMode
      ? customStylesDark
      : customStylesLight;

    const fetchData = async (
      customPage = page,
      customPageSize = pageSize,
      customSearch = search
    ) => {
      try {
        setLoading(true);

        const result = await service.getAll({
          search: customSearch,
          page: customPage,
          pageSize: customPageSize,
        });

        const items = Array.isArray(result)
          ? result
          : result.items || [];

        setData(items);
        setTotalRows(result.total ?? items.length);
      } catch (e) {
        console.error("Error al obtener datos:", e);
        setData([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({
      refetch: () => fetchData(page, pageSize, debouncedSearch),
    }));

    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
      const timer = setTimeout(() => {
        setDebouncedSearch(search);
        setPage(1);
      }, 400);

      return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
      fetchData(page, pageSize, debouncedSearch);
    }, [page, pageSize, debouncedSearch]);

    const handleBarcodeScan = (code) => {
      if (code === search) return;

      setSearch(code);

      if (searchInputRef.current) {
        searchInputRef.current.focus();

        if (searchInputRef.current.select) {
          searchInputRef.current.select();
        }
      }
    };

    const columnsWithActions = [
      ...columns.map((c) => ({
        ...c,
        sortable: c.sortable ?? false,
        wrap: true,
      })),

      ...(renderActions
        ? [
            {
              name: "Acciones",
              id: "acciones",
              cell: (row) => (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    width: "100%",
                    whiteSpace: "nowrap",
                  }}
                >
                  {renderActions(row)}
                </div>
              ),
              ignoreRowClick: true,
              sortable: false,
              width: "220px",
            },
          ]
        : []),
    ];

    return (
      <div
        className="
          bg-white
          dark:bg-gray-800
          rounded-2xl
          shadow-lg
          border
          border-gray-200
          dark:border-gray-700
        "
      >
        <BarcodeListener
          onScan={handleBarcodeScan}
          targetRef={searchInputRef}
          enabled={enableSearch}
          autoLength={13}
          debug={false}
        />

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
                fontWeight: 600,
                color: isDarkMode ? "grey.100" : "grey.800",
                mb: 1,
              }}
            >
              {title}
            </Typography>

            <Box
              sx={{
                width: "50%",
                minWidth: "280px",
              }}
            >
              <TextField
                fullWidth
                inputRef={searchInputRef}
                variant="outlined"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "20px",
                    backgroundColor: isDarkMode
                      ? "#1E1E1E"
                      : "#fafafa",
                  },

                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: isDarkMode ? "#555" : "#ccc",
                  },

                  "&:hover .MuiOutlinedInput-notchedOutline": {
                    borderColor: "#592B2B",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon
                        sx={{ color: "#592B2B" }}
                      />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>
        )}

        <DataTable
          columns={columnsWithActions}
          data={data}
          progressPending={loading}
          pagination
          paginationServer
          paginationTotalRows={totalRows}
          paginationPerPage={pageSize}
          paginationRowsPerPageOptions={[5, 10, 15, 20, 30, 50]}
          onChangePage={(newPage) => setPage(newPage)}
          onChangeRowsPerPage={(newPageSize, newPage) => {
            setPageSize(newPageSize);
            setPage(newPage);
          }}
          highlightOnHover
          responsive
          theme={isDarkMode ? "customDark" : "light"}
          customStyles={activeStyles}
          paginationComponentOptions={{
            rowsPerPageText: "Registros por página:",
            rangeSeparatorText: "de",
          }}
          noDataComponent={
            <div
              className="
                flex
                flex-col
                items-center
                justify-center
                p-8
                text-gray-500
                dark:text-gray-400
              "
            >
              <div className="text-lg font-medium">
                No hay datos disponibles
              </div>
            </div>
          }
          striped
          persistTableHead
        />
      </div>
    );
  }
);

export default GridGenerico;