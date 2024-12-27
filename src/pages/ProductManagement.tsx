import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
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
    listNumber: number;
}

interface NewProduct {
    name: string;
    price: string;
    promotion: {
        quantity: string;
        price: string;
    };
}

// API endpoints
const api = {
    getProducts: async (listNumber: number): Promise<Product[]> => {
        const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products); // Obtener URL base
        alert(baseUrl);
        const response = await fetch(`${baseUrl}${apiConfig.endpoints.products}/${listNumber}`);
        if (!response.ok) throw new Error('Error al obtener productos');
        return response.json();
    },

    createProduct: async (product: Omit<Product, 'id'>): Promise<Product> => {
        const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
        const response = await fetch(`${baseUrl}${apiConfig.endpoints.products}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error('Error al crear producto');
        return response.json();
    },

    updateProduct: async (id: number, product: Omit<Product, 'id'>): Promise<Product> => {
        const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
        const response = await fetch(`${baseUrl}${apiConfig.endpoints.products}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product),
        });
        if (!response.ok) throw new Error('Error al actualizar producto');
        return response.json();
    },

    deleteProduct: async (id: number): Promise<void> => {
        const baseUrl = await apiConfig.getApiUrl(apiConfig.endpoints.products);
        const response = await fetch(`${baseUrl}${apiConfig.endpoints.products}/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Error al eliminar producto');
    },
};


interface ProductManagementProps {
    onBack: () => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ onBack }) => {
    const [list1, setList1] = useState<Product[]>([]);
    const [list2, setList2] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [newProduct, setNewProduct] = useState<NewProduct>({
        name: '',
        price: '',
        promotion: {
            quantity: '',
            price: ''
        }
    });

    useEffect(() => {
        const loadProducts = async () => {
            try {
                setIsLoading(true);
                const [products1, products2] = await Promise.all([
                    api.getProducts(1),
                    api.getProducts(2)
                ]);
                setList1(products1);
                setList2(products2);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Error al cargar productos');
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
    };

    const handleSave = async (product: Product) => {
        try {
            const updatedProduct = await api.updateProduct(product.id, {
                name: product.name,
                price: product.price,
                promotion: product.promotion,
                listNumber: product.listNumber
            });

            const setList = product.listNumber === 1 ? setList1 : setList2;
            const currentList = product.listNumber === 1 ? list1 : list2;

            setList(currentList.map(p => p.id === updatedProduct.id ? updatedProduct : p));
            setEditingProduct(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al actualizar producto');
        }
    };

    const handleDelete = async (productId: number, listNumber: number) => {
        try {
            await api.deleteProduct(productId);

            const setList = listNumber === 1 ? setList1 : setList2;
            const currentList = listNumber === 1 ? list1 : list2;

            setList(currentList.filter(p => p.id !== productId));
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al eliminar producto');
        }
    };

    const handleCreate = async (listNumber: number) => {
        try {
            const productData = {
                name: newProduct.name,
                price: Number(newProduct.price),
                listNumber,
                ...(newProduct.promotion.quantity && newProduct.promotion.price ? {
                    promotion: {
                        quantity: Number(newProduct.promotion.quantity),
                        price: Number(newProduct.promotion.price)
                    }
                } : {})
            };

            const createdProduct = await api.createProduct(productData);

            const setList = listNumber === 1 ? setList1 : setList2;
            const currentList = listNumber === 1 ? list1 : list2;

            setList([...currentList, createdProduct]);
            setNewProduct({
                name: '',
                price: '',
                promotion: { quantity: '', price: '' }
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al crear producto');
        }
    };

    const renderProductList = (products: Product[], listNumber: number) => {
        if (isLoading) return <div>Cargando productos...</div>;
        if (error) return <div className="text-red-500">Error: {error}</div>;

        return (
            <div className="space-y-4">
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map(product => (
                        <Card key={product.id} className="shadow-sm">
                            <CardContent className="p-4">
                                {editingProduct?.id === product.id ? (
                                    <div className="space-y-2">
                                        <Input
                                            value={editingProduct.name}
                                            onChange={e => setEditingProduct({
                                                ...editingProduct,
                                                name: e.target.value
                                            })}
                                            placeholder="Nombre del producto"
                                        />
                                        <Input
                                            type="number"
                                            value={editingProduct.price}
                                            onChange={e => setEditingProduct({
                                                ...editingProduct,
                                                price: Number(e.target.value)
                                            })}
                                            placeholder="Precio"
                                        />
                                        <div className="space-y-2">
                                            <Input
                                                type="number"
                                                value={editingProduct.promotion?.quantity || ''}
                                                onChange={e => setEditingProduct({
                                                    ...editingProduct,
                                                    promotion: {
                                                        ...editingProduct.promotion || { price: 0 },
                                                        quantity: Number(e.target.value)
                                                    }
                                                })}
                                                placeholder="Cantidad promoción"
                                            />
                                            <Input
                                                type="number"
                                                value={editingProduct.promotion?.price || ''}
                                                onChange={e => setEditingProduct({
                                                    ...editingProduct,
                                                    promotion: {
                                                        ...editingProduct.promotion || { quantity: 0 },
                                                        price: Number(e.target.value)
                                                    }
                                                })}
                                                placeholder="Precio promoción"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={() => handleSave(editingProduct)}
                                            >
                                                <Save className="w-4 h-4 mr-1" />
                                                Guardar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setEditingProduct(null)}
                                            >
                                                <X className="w-4 h-4 mr-1" />
                                                Cancelar
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <h3 className="font-medium">{product.name}</h3>
                                        <p className="text-sm text-gray-600">Precio: ${product.price}</p>
                                        {product.promotion && (
                                            <p className="text-sm text-gray-600">
                                                Promoción: {product.promotion.quantity} x ${product.promotion.price}
                                            </p>
                                        )}
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleEdit(product)}
                                            >
                                                <Edit2 className="w-4 h-4 mr-1" />
                                                Editar
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                onClick={() => handleDelete(product.id, listNumber)}
                                            >
                                                <Trash2 className="w-4 h-4 mr-1" />
                                                Eliminar
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Agregar nuevo producto</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Input
                                value={newProduct.name}
                                onChange={e => setNewProduct({
                                    ...newProduct,
                                    name: e.target.value
                                })}
                                placeholder="Nombre del producto"
                            />
                            <Input
                                type="number"
                                value={newProduct.price}
                                onChange={e => setNewProduct({
                                    ...newProduct,
                                    price: e.target.value
                                })}
                                placeholder="Precio"
                            />
                            <Input
                                type="number"
                                value={newProduct.promotion.quantity}
                                onChange={e => setNewProduct({
                                    ...newProduct,
                                    promotion: {
                                        ...newProduct.promotion,
                                        quantity: e.target.value
                                    }
                                })}
                                placeholder="Cantidad promoción (opcional)"
                            />
                            <Input
                                type="number"
                                value={newProduct.promotion.price}
                                onChange={e => setNewProduct({
                                    ...newProduct,
                                    promotion: {
                                        ...newProduct.promotion,
                                        price: e.target.value
                                    }
                                })}
                                placeholder="Precio promoción (opcional)"
                            />
                            <Button
                                onClick={() => handleCreate(listNumber)}
                                disabled={!newProduct.name || !newProduct.price}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                Agregar producto
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    };

    return (
        <div className="justify-center items-center min-h-screen bg-gray-100 w-full absolute inset-0">
            <Tabs defaultValue="list1">
                <TabsList className="mb-4">
                    <TabsTrigger value="list1">Lista 1</TabsTrigger>
                    <TabsTrigger value="list2">Lista 2</TabsTrigger>
                </TabsList>

                <TabsContent value="list1">
                    {renderProductList(list1, 1)}
                </TabsContent>

                <TabsContent value="list2">
                    {renderProductList(list2, 2)}
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default ProductManagement;