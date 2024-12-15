import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, FileSpreadsheet } from 'lucide-react';
import { Button } from '../components/ui/button';
import * as XLSX from 'xlsx';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle
} from '../components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    TableHead
} from '../components/ui/table';

interface SaleItem {
    id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total: number;
}

interface Sale {
    id: number;
    created_at: string;
    items: SaleItem[];
    total_sale: number;
}

interface ListadeVentasProps {
    onBack: () => void;
}

const ListaDeVentas: React.FC<ListadeVentasProps> = ({ onBack }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [groupedSales, setGroupedSales] = useState<{ [date: string]: Sale[] }>({});

    useEffect(() => {
        const fetchSales = async () => {
            try {
                const response = await axios.get('http://34.136.163.22:3001/api/sales');
                setSales(response.data);
            } catch (error) {
                try {
                    const response = await axios.get('http://localhost:3001/api/sales');
                    setSales(response.data);
                } catch (error) {
                    console.error('Error al obtener las ventas:', error);
                    alert('Error al obtener las ventas');
                }

            }
        };

        fetchSales();
    }, []);

    useEffect(() => {
        const groupSalesByDate = () => {
            const grouped: { [date: string]: Sale[] } = {};
            sales.forEach(sale => {
                const date = new Date(sale.created_at).toLocaleDateString();
                if (!grouped[date]) {
                    grouped[date] = [];
                }
                grouped[date].push(sale);
            });
            setGroupedSales(grouped);
        };

        groupSalesByDate();
    }, [sales]);

    const formatSheetName = (date: string) => {
        return `Ventas ${date.replace(/[/\\?*[\]]/g, '-')}`;
    };

    const exportToExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();

            // Estilos comunes
            const headerStyle = {
                fill: { fgColor: { rgb: "E2E8F0" } }, // Color gris claro para encabezados
                font: { bold: true },
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                },
                alignment: { horizontal: 'center' }
            };

            const cellStyle = {
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };

            const totalRowStyle = {
                font: { bold: true },
                border: {
                    top: { style: 'thin' },
                    bottom: { style: 'thin' },
                    left: { style: 'thin' },
                    right: { style: 'thin' }
                }
            };

            Object.entries(groupedSales).forEach(([date, salesForDate]) => {
                // Crear el arreglo de datos para la hoja
                const data: any[][] = [];

                // Agregar título
                data.push([`Ventas del ${date}`]);
                data.push([]); // Línea en blanco

                // Agregar encabezados
                data.push(['ID Venta', 'Producto', 'Cantidad', 'Precio Unitario', 'Total']);

                // Agregar datos de ventas
                salesForDate.forEach(sale => {
                    sale.items.forEach((item, index) => {
                        const row = [
                            index === 0 ? sale.id : '',
                            item.product_name,
                            item.quantity,
                            `${parseInt(item.price.toFixed(2))}`,
                            `${parseInt(item.total.toFixed(2))}`
                        ];
                        data.push(row);
                    });
                    // Agregar fila de total
                    data.push(['', '', '', 'Total Venta:', `${parseInt(sale.total_sale.toString())}`]);
                    data.push([]); // Línea en blanco entre ventas
                });

                // Crear la hoja
                const worksheet = XLSX.utils.aoa_to_sheet(data);

                // Aplicar estilos
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

                // Estilos para todas las celdas
                for (let R = range.s.r; R <= range.e.r; R++) {
                    for (let C = range.s.c; C <= range.e.c; C++) {
                        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                        worksheet[cellRef] = worksheet[cellRef] || { v: '' };
                        worksheet[cellRef].s = cellStyle;

                        // Estilos para encabezados
                        if (R === 2) {
                            worksheet[cellRef].s = headerStyle;
                        }

                        // Estilos para filas de total
                        if (worksheet[cellRef].v && worksheet[cellRef].v.toString().includes('Total Venta')) {
                            worksheet[cellRef].s = totalRowStyle;
                        }
                    }
                }

                // Ajustar ancho de columnas
                const colWidths = [
                    { wch: 10 }, // ID Venta
                    { wch: 30 }, // Producto
                    { wch: 10 }, // Cantidad
                    { wch: 15 }, // Precio Unitario
                    { wch: 15 }  // Total
                ];
                worksheet['!cols'] = colWidths;

                // Usar el nombre formateado para la hoja
                const sheetName = formatSheetName(date).substring(0, 31);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            XLSX.writeFile(workbook, 'ventas.xlsx');
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('Error al exportar a Excel');
            alert(error);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Header fijo */}
            <div className="bg-white p-4 border-b shadow-sm">
                <div className="container mx-auto flex justify-between items-center">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onBack}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <Button onClick={exportToExcel}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        Exportar a Excel
                    </Button>
                </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="container mx-auto">
                    {Object.entries(groupedSales).map(([date, salesForDate]) => (
                        <Card key={date} className="mb-6">
                            <CardHeader>
                                <CardTitle>Ventas del {date}</CardTitle>
                            </CardHeader>
                            <CardContent className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="whitespace-nowrap">ID Venta</TableHead>
                                            <TableHead className="whitespace-nowrap">Producto</TableHead>
                                            <TableHead className="whitespace-nowrap">Cantidad</TableHead>
                                            <TableHead className="whitespace-nowrap">Precio Unitario</TableHead>
                                            <TableHead className="whitespace-nowrap">Total</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {salesForDate.map(sale => (
                                            <React.Fragment key={sale.id}>
                                                {sale.items.map((item, index) => (
                                                    <TableRow key={index}>
                                                        {index === 0 && (
                                                            <TableCell className="whitespace-nowrap" rowSpan={sale.items.length}>
                                                                {sale.id}
                                                            </TableCell>
                                                        )}
                                                        <TableCell className="whitespace-nowrap">{item.product_name}</TableCell>
                                                        <TableCell className="whitespace-nowrap">{item.quantity}</TableCell>
                                                        <TableCell className="whitespace-nowrap">${item.price}</TableCell>
                                                        <TableCell className="whitespace-nowrap">${item.total}</TableCell>
                                                    </TableRow>
                                                ))}
                                                {sale.items.length > 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="font-bold text-right">
                                                            Total Venta:
                                                        </TableCell>
                                                        <TableCell className="font-bold whitespace-nowrap">
                                                            ${sale.total_sale}
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ListaDeVentas;