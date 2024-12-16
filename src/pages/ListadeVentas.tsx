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

const SalesTable = ({ sales, title, onExport }: { 
    sales: { [date: string]: Sale[] }, 
    title: string,
    onExport: () => void 
}) => (
    <div className="h-screen flex flex-col">
        <div className="bg-white p-4 border-b shadow-sm">
            <div className="container mx-auto flex justify-between items-center">
                <CardTitle>{title}</CardTitle>
                <Button onClick={onExport}>
                    <FileSpreadsheet className="mr-2 h-4 w-4" />
                    Exportar a Excel
                </Button>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            <div className="container mx-auto">
                {Object.entries(sales).map(([date, salesForDate]) => (
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

const ListaDeVentas: React.FC<ListadeVentasProps> = ({ onBack }) => {
    const [regularSales, setRegularSales] = useState<Sale[]>([]);
    const [mamaSales, setMamaSales] = useState<Sale[]>([]);
    const [groupedRegularSales, setGroupedRegularSales] = useState<{ [date: string]: Sale[] }>({});
    const [groupedMamaSales, setGroupedMamaSales] = useState<{ [date: string]: Sale[] }>({});

    const groupSalesByDate = (sales: Sale[]) => {
        const grouped: { [date: string]: Sale[] } = {};
        sales.forEach(sale => {
            const date = new Date(sale.created_at).toLocaleDateString();
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
                // Fetch regular sales
                const regularResponse = await axios.get('http://34.136.163.22:3001/api/sales')
                    .catch(() => axios.get('http://localhost:3001/api/sales'));
                setRegularSales(regularResponse.data);
                
                // Fetch mama sales
                const mamaResponse = await axios.get('http://34.136.163.22:3001/api/sales_mama')
                    .catch(() => axios.get('http://localhost:3001/api/sales_mama'));
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
        <div className="space-y-8">
            <div className="container mx-auto flex justify-between items-center p-4">
                <Button variant="outline" size="icon" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle>Todas las Ventas</CardTitle>
            </div>

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
    );
};

export default ListaDeVentas;