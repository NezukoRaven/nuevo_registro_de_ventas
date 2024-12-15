import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, ArrowLeft } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';

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

const SalesForm: React.FC<SalesFormProps> = ({ onBack }) => {
    const productList: Product[] = [
        { id: 1, name: 'Papel Couche', price: 400, promotion: { quantity: 3, price: 1000 } },
        { id: 2, name: 'Papel Normal', price: 300, promotion: { quantity: 4, price: 1000 } },
        { id: 3, name: 'Aro', price: 9000 },
        { id: 4, name: 'Pilas', price: 200, promotion: { quantity: 4, price: 500 } },
        { id: 5, name: 'Sobre Pequeño', price: 300, promotion: { quantity: 4, price: 1000 } },
        { id: 6, name: 'Sobre Mediano', price: 500 },
        { id: 7, name: 'Sobre Grande', price: 1000 },
        { id: 8, name: 'Scotch', price: 200, promotion: { quantity: 6, price: 1000 } },
        { id: 9, name: 'Cinta Chica', price: 200, promotion: { quantity: 3, price: 500 } },
        { id: 10, name: 'Cinta Grande', price: 300, promotion: { quantity: 4, price: 1000 } },
        { id: 11, name: 'Nieves', price: 600, promotion: { quantity: 2, price: 1000 } },
        { id: 12, name: 'Rosas', price: 200, promotion: { quantity: 8, price: 1000 } },
        { id: 13, name: 'Dino Grande', price: 9000 },
        { id: 14, name: 'Dino Chico', price: 6000 },
        { id: 15, name: 'Tarjetas', price: 200 },
    ];

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState<SelectedProduct[]>(() => {
        const saved = localStorage.getItem('selectedProducts');
        return saved ? JSON.parse(saved) : [];
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState<string>('');

    useEffect(() => {
        localStorage.setItem('selectedProducts', JSON.stringify(selectedProducts));
    }, [selectedProducts]);

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
                items: selectedProducts.map(product => ({
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    quantity: product.quantity,
                    total: product.total
                }))
            };

            // Enviar solicitud al endpoint de ventas
            //const response = await axios.post('http://localhost:3001/api/sales', saleData);
            const responsenet = await axios.post('http://34.136.163.22:3001/api/sales', saleData);

            // Mostrar mensaje de éxito
            alert(`Venta guardada con ID: ${responsenet.data.id}`);

            // Limpiar los productos seleccionados
            clearSales();
        } catch (error) {
            try {
                // Preparar los datos para enviar al backend
                const saleData = {
                    items: selectedProducts.map(product => ({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        quantity: product.quantity,
                        total: product.total
                    }))
                };

                // Enviar solicitud al endpoint de ventas
                const response = await axios.post('http://localhost:3001/api/sales', saleData);

                // Mostrar mensaje de éxito
                alert(`Venta guardada con ID: ${response.data.id}`);
            } catch (error) {
                console.error('Error al guardar la venta:', error);
                alert('Error al guardar la venta');
                alert(error);
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
                                <Button onClick={exportToExcel}>
                                    Exportar a Excel
                                </Button>
                                <Button
                                    variant="default"
                                    onClick={handleSaveSale}
                                >
                                    Guardar Venta
                                </Button>
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </body>
    );
};

export default SalesForm;