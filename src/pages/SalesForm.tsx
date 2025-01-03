import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger
} from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Search, ArrowLeft, CalendarIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import axios from 'axios';
import apiConfig from '../../apiConfig';

interface Promotion {
    quantity: number;
    price: number;
}

interface Product {
    id: number;
    name: string;
    price: number;
    promotion?: Promotion;
}

interface SelectedProduct extends Product {
    quantity: number;
    total: number;
}

interface SalesFormProps {
    onBack: () => void;
}

const formatDateSpanish = (date: Date) => {
    const days = [
        'domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'
    ];
    const months = [
        'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const dayName = days[date.getDay()];
    const dayNumber = date.getDate();
    const monthName = months[date.getMonth()];
    const year = date.getFullYear();

    return `${dayName} ${dayNumber} de ${monthName} de ${year}`;
};

const SalesForm: React.FC<SalesFormProps> = ({ onBack }) => {


    const [productList, setProductList] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(() => {
        const saved = localStorage.getItem('selectedProducts');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<string>('');
    const [saleDate, setSaleDate] = useState<Date>(() => {
        const savedDate = localStorage.getItem('saleDate');
        return savedDate ? new Date(savedDate) : new Date();
    });

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
                const [response1, response2] = await Promise.all([
                    axios.get(`${baseUrl}${apiConfig.endpoints.products}/1`),
                    axios.get(`${baseUrl}${apiConfig.endpoints.products}/2`)
                ]);
                setProductList([...response1.data, ...response2.data]);
            } catch (error) {
                console.error('Error fetching products:', error);
                alert('Error al cargar productos');
            } finally {
                setIsLoading(false);
            }
        };

        fetchProducts();
    }, []);

    useEffect(() => {
        localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
        localStorage.setItem('saleDate', saleDate.toISOString());
    }, [selectedProducts, saleDate]);

    const filteredProducts = productList.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const calculateTotal = (quantityStr: string, product: Product): number => {
        const quantity = parseInt(quantityStr);
        if (isNaN(quantity) || quantity <= 0) return 0;

        if (product.promotion) {
            const { quantity: promoQty, price: promoPrice } = product.promotion;
            const sets = Math.floor(quantity / promoQty);
            const remainder = quantity % promoQty;
            return (sets * promoPrice) + (remainder * product.price);
        }
        return quantity * product.price;
    };

    const calculateSavings = (quantityStr: string, product: Product): number => {
        const quantity = parseInt(quantityStr);
        if (isNaN(quantity) || quantity <= 0 || !product.promotion) return 0;

        const normalTotal = quantity * product.price;
        const promoTotal = calculateTotal(quantityStr, product);
        return normalTotal - promoTotal;
    };

    const addProduct = () => {
        if (selectedProduct && quantity && parseInt(quantity) > 0) {
            const total = calculateTotal(quantity, selectedProduct);
            setSelectedProducts([
                ...selectedProducts,
                {
                    ...selectedProduct,
                    quantity: parseInt(quantity),
                    total
                }
            ]);
            setSelectedProduct(null);
            setQuantity('');
        }
    };

    const clearSales = () => {
        setSelectedProducts([]);
        localStorage.removeItem('selectedProducts');
    };

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        if (value === '' || parseInt(value) >= 0) {
            setQuantity(value);
        }
    };

    const totalVenta = selectedProducts.reduce((acc, product) => acc + product.total, 0);

    const getPromotionText = (product: Product) => {
        if (product.promotion) {
            return `${product.promotion.quantity}x$${product.promotion.price}`;
        }
        return null;
    };

    const exportToExcel = () => {
        const rows = selectedProducts.map(product => ({
            'Producto': product.name,
            'Cantidad': product.quantity,
            'Precio Unitario': product.price,
            'Total': product.total
        }));

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ventas');
        XLSX.writeFile(workbook, 'ventas.xlsx');
    };

    const handleSaveSale = async () => {
        if (selectedProducts.length === 0) {
            alert('No hay productos para guardar');
            return;
        }

        try {
            // Preparar los datos para enviar al backend
            const saleData = {
                date: saleDate.toISOString().split('T')[0], // Formatear fecha
                items: selectedProducts.map(product => ({
                    id: product.id,
                    product_name: product.name,
                    price: product.price,
                    quantity: product.quantity,
                    total: product.total
                }))
            };

            // Obtener baseUrl
            const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.form1);

            // Enviar solicitud al endpoint de ventas
            const response = await axios.post(`${baseUrl}${apiConfig.endpoints.form1}`, saleData);

            // Mostrar mensaje de éxito
            alert(`Venta guardada con ID: ${response.data.id}`);

            // Limpiar los productos seleccionados y el local storage
            setSelectedProducts([]);
            localStorage.removeItem('selectedProducts');
        } catch (error) {

            try {
                // Intentar con el localhost
                const saleData = {
                    date: saleDate.toISOString().split('T')[0], // Formatear fecha
                    items: selectedProducts.map(product => ({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: product.quantity,
                        total: product.total
                    }))
                };


                const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.form1);

                // Enviar solicitud al endpoint de ventas
                const response = await axios.post(`${baseUrl}${apiConfig.endpoints.form1}`, saleData);
                // Mostrar mensaje de éxito
                alert(`Venta guardada con ID: ${response.data.id}`);

                // Limpiar los productos seleccionados y el local storage
                setSelectedProducts([]);
                localStorage.removeItem('selectedProducts');
            } catch (error) {
                console.error('Error al guardar la venta:', error);
                alert('Error al guardar la venta');

                alert(error instanceof Error ? error.message : 'Unknown error');
            }
        }
    };

    return (
        <body className='min-h-screen items-center w-full absolute inset-0'>
            <div className="min-h-screen items-center w-full absolute inset-0">
                <Card className='w-full max-w-auto place-items-center'>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={onBack}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <CardTitle>Formulario de Ventas</CardTitle>
                        </div>
                        {selectedProducts.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={clearSales}
                            >
                                Limpiar Ventas
                            </Button>
                        )}
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="text-center py-4">Cargando productos...</div>
                        ) : (
                            <div>
                                {/* Nuevo Popover Calendar */}
                                <div className="flex items-center gap-2 mb-4">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant={"outline"}
                                                className={cn(
                                                    "w-full justify-start text-left font-normal bg-green-100",
                                                    !saleDate && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarIcon className="mr-2 h-4 w-4 bg-green-100" />
                                                {formatDateSpanish(saleDate)}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0">
                                            <Calendar
                                                mode="single"
                                                selected={saleDate}
                                                onSelect={(date) => date && setSaleDate(date)}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>

                                <div className="flex items-center gap-2 mb-4">
                                    <Search className="w-5 h-5 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Buscar producto..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="flex-1"
                                    />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4 max-h-[50vh] overflow-y-auto">
                                    {filteredProducts.map(product => (
                                        <div
                                            key={product.id}
                                            className={`p-2 border rounded cursor-pointer ${selectedProduct?.id === product.id ? 'bg-blue-100 border-blue-500' : ''}`}
                                            onClick={() => setSelectedProduct(product)}
                                        >
                                            <div>{product.name} - ${product.price}</div>
                                            {product.promotion && (
                                                <div className="text-xs sm:text-sm text-green-600">
                                                    Promoción: {getPromotionText(product)}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {selectedProduct && (
                                    <div className="flex flex-col gap-2 mb-4">
                                        <div className="flex gap-2">
                                            <Input
                                                type="number"
                                                min="0"
                                                value={quantity}
                                                onChange={handleQuantityChange}
                                                className="w-24"
                                                placeholder="Cantidad"
                                            />
                                            <Button
                                                onClick={addProduct}
                                                disabled={!quantity || parseInt(quantity) <= 0}
                                            >
                                                Agregar
                                            </Button>
                                        </div>
                                        {selectedProduct.promotion &&
                                            quantity &&
                                            parseInt(quantity) >= selectedProduct.promotion.quantity && (
                                                <div className="text-green-600">
                                                    ¡Promoción aplicada!
                                                    Ahorras: ${calculateSavings(quantity, selectedProduct)}
                                                </div>
                                            )}
                                    </div>
                                )}

                                {selectedProducts.length > 0 && (
                                    <>
                                        <table className="w-full mb-4 text-sm sm:text-base">
                                            <thead>
                                                <tr>
                                                    <th className="text-left">Producto</th>
                                                    <th className="text-right">Cantidad</th>
                                                    <th className="text-right">Precio</th>
                                                    <th className="text-right">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedProducts.map((product, index) => (
                                                    <tr key={index}>
                                                        <td>
                                                            {product.name}
                                                            {product.promotion && product.quantity >= product.promotion.quantity && (
                                                                <span className="text-sm text-green-600 ml-2">
                                                                    (Promo: {getPromotionText(product)})
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="text-right">{product.quantity}</td>
                                                        <td className="text-right">${product.price}</td>
                                                        <td className="text-right">${product.total}</td>
                                                    </tr>
                                                ))}
                                                <tr className="font-bold">
                                                    <td colSpan={3} className="text-right">Total Venta:</td>
                                                    <td className="text-right">${totalVenta}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className="flex space-x-2">
                                            <Button onClick={exportToExcel}>
                                                Exportar a Excel
                                            </Button>
                                            <Button
                                                variant="default"
                                                onClick={handleSaveSale}
                                            >
                                                Guardar Venta
                                            </Button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </body>
    );
};

export default SalesForm;