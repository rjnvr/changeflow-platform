import type { ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

export interface DataTableColumn<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  rows,
  emptyMessage = "No records found.",
  getRowKey
}: DataTableProps<T>) {
  return (
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: { xs: 4, md: 5 },
        overflow: "hidden",
        background: "rgba(255,255,255,0.84)",
        backdropFilter: "blur(12px)"
      }}
    >
      <Table sx={{ minWidth: 720 }}>
        <TableHead>
          <TableRow sx={{ backgroundColor: "rgba(15, 23, 42, 0.04)" }}>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                align={column.align ?? "left"}
                sx={{
                  fontWeight: 800,
                  color: "text.secondary",
                  textTransform: "uppercase",
                  letterSpacing: 0.9,
                  fontSize: "0.72rem",
                  borderBottomColor: "rgba(15, 23, 42, 0.08)"
                }}
              >
                {column.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, index) => (
              <TableRow
                key={getRowKey ? getRowKey(row, index) : index}
                hover
                sx={{
                  "&:last-of-type td": {
                    borderBottom: "none"
                  },
                  "& td": {
                    borderBottomColor: "rgba(15, 23, 42, 0.08)",
                    py: 2
                  }
                }}
              >
                {columns.map((column) => (
                  <TableCell key={column.key} align={column.align ?? "left"}>
                    {column.render(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} sx={{ py: 4 }}>
                <Typography color="text.secondary">{emptyMessage}</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

