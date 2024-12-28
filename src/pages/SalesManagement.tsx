import { useState, useEffect } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../components/ui/alert-dialog';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Trash2, Edit2, ArrowLeft } from 'lucide-react';
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
    created_at: string;
    items: SaleItem[];
    total_sale: number;
}

interface SalesFormProps {
    onBack: () => void;
}

const SalesManagement: React.FC<SalesFormProps> = ({ onBack }) => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [mamaSales, setMamaSales] = useState<Sale[]>([]);
    const [error, setError] = useState<string>('');
    const [success, setSuccess] = useState<string>('');

    const fetchSales = async () => {
        try {
            const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
            const [salesResponse, mamaSalesResponse] = await Promise.all([
                fetch(`${baseUrl}${apiConfig.endpoints.form1}`),
                fetch(`${baseUrl}${apiConfig.endpoints.form2}`)
            ]);

            if (salesResponse.ok && mamaSalesResponse.ok) {
                const salesData = await salesResponse.json();
                const mamaSalesData = await mamaSalesResponse.json();
                setSales(salesData);
                setMamaSales(mamaSalesData);
            }
        } catch (error) {
            setError('Error al cargar las ventas');
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

    const handleDelete = async (id: number, isMamaSale: boolean) => {
        try {
            const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
            const endpoint = isMamaSale ? `${baseUrl}${apiConfig.endpoints.form2}/${id}` : `${baseUrl}${apiConfig.endpoints.form1}/${id}`;
            alert(endpoint);
            const response = await fetch(endpoint, {
                method: 'DELETE',
            });

            if (response.ok) {
                setSuccess(`Venta ${isMamaSale ? 'Mama ' : ''}eliminada correctamente`);
                fetchSales();
            } else {
                setError('Error al eliminar la venta');
            }
        } catch (error) {
            setError('Error al eliminar la venta');
        }
    };

    const handleUpdate = async (sale: Sale, isMamaSale: boolean) => {
        try {
            const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
            const endpoint = isMamaSale ? `${baseUrl}${apiConfig.endpoints.form2}/${sale.id}` : `${baseUrl}${apiConfig.endpoints.form1}/${sale.id}`;
            alert(endpoint);
            const response = await fetch(endpoint, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    date: sale.sale_date,
                    items: sale.items,
                }),
            });

            if (response.ok) {
                setSuccess(`Venta ${isMamaSale ? 'Mama ' : ''}actualizada correctamente`);
                fetchSales();
            } else {
                setError('Error al actualizar la venta');
            }
        } catch (error) {
            setError('Error al actualizar la venta');
        }
    };

    const SalesList = ({ sales, isMamaSale }: { sales: Sale[], isMamaSale: boolean }) => (
        <div className="space-y-4">
            {sales.map((sale) => (
                <Card key={sale.id} className="w-full bg-white shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-lg font-medium">
                            Venta #{sale.id} - {new Date(sale.sale_date).toLocaleDateString()}
                        </CardTitle>
                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdate(sale, isMamaSale)}
                                className="hover:bg-gray-100"
                            >
                                <Edit2 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Se eliminará permanentemente la venta
                                            y todos sus items asociados.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction
                                            onClick={() => handleDelete(sale.id, isMamaSale)}
                                        >
                                            Eliminar
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {sale.items.map((item) => (
                                <div key={item.id} className="flex justify-between text-sm py-1 hover:bg-gray-50 rounded-md px-2">
                                    <span>{item.product_name} x{item.quantity}</span>
                                    <span className="font-medium">${item.total}</span>
                                </div>
                            ))}
                            <div className="pt-3 border-t mt-2">
                                <div className="flex justify-between font-semibold text-lg">
                                    <span>Total</span>
                                    <span>${sale.total_sale}</span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen items-center w-full absolute inset-0">
            <div className="bg-white border-b">
                <div className="container mx-auto px-4 py-4 flex items-center space-x-4">
                    <Button variant="outline" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-2xl font-bold">Todas las Ventas</h1>
                </div>
            </div>

            <div className="container mx-auto px-4 mt-6">
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="mb-6">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}

                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Ventas Silvia</h2>
                        <SalesList sales={sales} isMamaSale={false} />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Ventas Mamá</h2>
                        <SalesList sales={mamaSales} isMamaSale={true} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SalesManagement;