import { useEffect, useState, useContext, forwardRef, useImperativeHandle } from "react";
import DataTable from "react-data-table-component";
import "@/context/dataTableTheme";
import { Link } from "react-router-dom";
import { ThemeProviderContext } from "@/context/theme-context";
import { customStylesLight, customStylesDark } from "./gridStyles";

const GridGenerico = forwardRef(
  (
    {
      service,
      columns = [],
      renderActions,
      title = "Listado",
      pageSize: initialPageSize = 10,
      defaultSortField = "fecha_registro",
      defaultSortAsc = false,
    },
    ref
  ) => {
    const [data, setData] = useState([]);
    const [totalRows, setTotalRows] = useState(0);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    const { theme } = useContext(ThemeProviderContext);
    const isDarkMode =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    const activeStyles = isDarkMode ? customStylesDark : customStylesLight;

    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await service.getAll({
          page: currentPage,
          pageSize,
        });

        const items = result.items || [];
        const total = result.total ?? items.length;
        setData(items);
        setTotalRows(total);
      } catch (e) {
        console.error("Error al obtener datos:", e);
        setData([]);
        setTotalRows(0);
      } finally {
        setLoading(false);
      }
    };

    useImperativeHandle(ref, () => ({ refetch: fetchData }));

    useEffect(() => {
      fetchData();
    }, [currentPage, pageSize]);

    const handlePageChange = (page) => setCurrentPage(page);
    const handleRowsPerPageChange = (n) => {
      setPageSize(n);
      setCurrentPage(1);
    };

    // 🔹 Desactivar ordenamiento
    const columnsWithActions = [
      ...columns.map((c) => ({
        ...c,
        sortable: false, // ❌ Quita las flechitas
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
              minWidth: "200px",
              grow: 0,
              right: true,
              compact: true,
            },
          ]
        : []),
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
        {/* TABLA SIN BUSCADOR */}
        <div className="p-0">
          <DataTable
            columns={columnsWithActions}
            data={data}
            progressPending={loading}
            progressComponent={
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#592B2B]" />
                <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando datos…</span>
              </div>
            }
            pagination
            paginationServer
            paginationTotalRows={totalRows}
            paginationPerPage={pageSize}
            paginationRowsPerPageOptions={[5, 10, 15, 20, 30, 50]}
            onChangePage={handlePageChange}
            onChangeRowsPerPage={handleRowsPerPageChange}
            highlightOnHover
            responsive
            noDataComponent={
              <div className="flex flex-col items-center justify-center p-8 text-gray-500 dark:text-gray-400">
                <div className="text-lg font-medium">No hay datos disponibles</div>
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
