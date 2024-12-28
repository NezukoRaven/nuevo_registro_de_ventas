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
import apiConfig from '../../apiConfig';

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
    sale_date: string;
    //created_at: string;
    items: SaleItem[];
    total_sale: number;
}

interface ListadeVentasProps {
    onBack: () => void;
}

const SalesTable = ({ sales, title, onExport }: {
    sales: { [date: string]: Sale[] },
    title: string,
    onExport: () => void
}) => (
    <Card className="w-full">
        <CardHeader className="bg-white p-4 border-b shadow-sm">
            <div className="flex justify-between items-center">
                <CardTitle className="text-sm sm:text-base">{title}</CardTitle>
                <Button onClick={onExport} className="h-8 px-2 sm:h-10 sm:px-4">
                    <FileSpreadsheet className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">Exportar</span>
                </Button>
            </div>
        </CardHeader>
        <CardContent className="overflow-y-auto max-h-[70vh] p-2 sm:p-4">
            {Object.entries(sales).map(([date, salesForDate]) => (
                <div key={date} className="mb-4 sm:mb-6">
                    <h3 className="text-sm sm:text-lg font-semibold mb-2 sm:mb-4">Ventas del {date}</h3>
                    <div className="overflow-x-auto">
                        <Table className="text-xs sm:text-sm">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap p-1 sm:p-2">ID</TableHead>
                                    <TableHead className="whitespace-nowrap p-1 sm:p-2">Producto</TableHead>
                                    <TableHead className="whitespace-nowrap p-1 sm:p-2">Cant</TableHead>
                                    <TableHead className="whitespace-nowrap p-1 sm:p-2">Precio</TableHead>
                                    <TableHead className="whitespace-nowrap p-1 sm:p-2">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {salesForDate.map(sale => (
                                    <React.Fragment key={sale.id}>
                                        {sale.items.map((item, index) => (
                                            <TableRow key={index} className="text-xs sm:text-sm">
                                                {index === 0 && (
                                                    <TableCell className="whitespace-nowrap p-1 sm:p-2" rowSpan={sale.items.length}>
                                                        {sale.id}
                                                    </TableCell>
                                                )}
                                                <TableCell className="whitespace-nowrap p-1 sm:p-2 truncate max-w-[100px]">{item.product_name}</TableCell>
                                                <TableCell className="whitespace-nowrap p-1 sm:p-2">{item.quantity}</TableCell>
                                                <TableCell className="whitespace-nowrap p-1 sm:p-2">${item.price}</TableCell>
                                                <TableCell className="whitespace-nowrap p-1 sm:p-2">${item.total}</TableCell>
                                            </TableRow>
                                        ))}
                                        {sale.items.length > 0 && (
                                            <TableRow>
                                                <TableCell colSpan={4} className="font-bold text-right p-1 sm:p-2 text-xs sm:text-sm">
                                                    Total Venta:
                                                </TableCell>
                                                <TableCell className="font-bold whitespace-nowrap p-1 sm:p-2 text-xs sm:text-sm">
                                                    ${sale.total_sale}
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </React.Fragment>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>
);

const ListaDeVentas: React.FC<ListadeVentasProps> = ({ onBack }) => {
    const [regularSales, setRegularSales] = useState<Sale[]>([]);
    const [mamaSales, setMamaSales] = useState<Sale[]>([]);
    const [groupedRegularSales, setGroupedRegularSales] = useState<{ [date: string]: Sale[] }>({});
    const [groupedMamaSales, setGroupedMamaSales] = useState<{ [date: string]: Sale[] }>({});

    const groupSalesByDate = (sales: Sale[]) => {
        const grouped: { [date: string]: Sale[] } = {};
        sales.forEach(sale => {
            const date = new Date(sale.sale_date).toString();
            if (!grouped[date]) {
                grouped[date] = [];
            }
            grouped[date].push(sale);
        });
        return grouped;
    };

    useEffect(() => {
        const fetchSales = async () => {
            try {
                // Obtener la URL base correcta
                const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.form1);

                // Fetch regular sales
                const regularResponse = await axios.get(`${baseUrl}${apiConfig.endpoints.form1}`);
                setRegularSales(regularResponse.data);

                // Fetch mama sales
                const mamaResponse = await axios.get(`${baseUrl}${apiConfig.endpoints.form2}`);
                setMamaSales(mamaResponse.data);

            } catch (error) {
                console.error('Error al obtener las ventas:', error);
                alert('Error al obtener las ventas');
            }
        };

        fetchSales();
    }, []);

    useEffect(() => {
        setGroupedRegularSales(groupSalesByDate(regularSales));
    }, [regularSales]);

    useEffect(() => {
        setGroupedMamaSales(groupSalesByDate(mamaSales));
    }, [mamaSales]);

    const formatSheetName = (date: string) => {
        return `Ventas ${date.replace(/[/\\?*[\]]/g, '-')}`;
    };

    const exportToExcel = (sales: { [date: string]: Sale[] }, prefix: string) => {
        try {
            const workbook = XLSX.utils.book_new();

            const headerStyle = {
                fill: { fgColor: { rgb: "E2E8F0" } },
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

            Object.entries(sales).forEach(([date, salesForDate]) => {
                const data: any[][] = [];
                data.push([`Ventas del ${date}`]);
                data.push([]);
                data.push(['ID Venta', 'Producto', 'Cantidad', 'Precio Unitario', 'Total']);

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
                    data.push(['', '', '', 'Total Venta:', `${parseInt(sale.total_sale.toString())}`]);
                    data.push([]);
                });

                const worksheet = XLSX.utils.aoa_to_sheet(data);
                const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

                for (let R = range.s.r; R <= range.e.r; R++) {
                    for (let C = range.s.c; C <= range.e.c; C++) {
                        const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
                        worksheet[cellRef] = worksheet[cellRef] || { v: '' };
                        worksheet[cellRef].s = cellStyle;

                        if (R === 2) {
                            worksheet[cellRef].s = headerStyle;
                        }

                        if (worksheet[cellRef].v && worksheet[cellRef].v.toString().includes('Total Venta')) {
                            worksheet[cellRef].s = totalRowStyle;
                        }
                    }
                }

                const colWidths = [
                    { wch: 10 },
                    { wch: 30 },
                    { wch: 10 },
                    { wch: 15 },
                    { wch: 15 }
                ];
                worksheet['!cols'] = colWidths;

                const sheetName = formatSheetName(date).substring(0, 31);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            XLSX.writeFile(workbook, `${prefix}_ventas.xlsx`);
        } catch (error) {
            console.error('Error al exportar a Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    return (
        <body className='bg-blue-100 min-h-screen flex flex-col items-center w-full absolute inset-0 overflow-x-hidden'>
            <div className="bg-blue-100 container mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-6">
                    <Button variant="outline" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <CardTitle>Todas las Ventas</CardTitle>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <SalesTable
                        sales={groupedRegularSales}
                        title="Lista Ventas Silvia"
                        onExport={() => exportToExcel(groupedRegularSales, 'silvia')}
                    />

                    <SalesTable
                        sales={groupedMamaSales}
                        title="Lista Ventas Mama"
                        onExport={() => exportToExcel(groupedMamaSales, 'mama')}
                    />
                </div>
            </div>
        </body>
    );
};

export default ListaDeVentas;