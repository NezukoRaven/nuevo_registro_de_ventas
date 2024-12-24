export interface Products {
    id: number;
    name: string;
    price: number;
    promotion?: {
        quantity: number;
        price: number;
    };
    listNumber: number;
}

export interface SalesItem {
    id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total: number;
}

export interface Sales {
    date: string;
    items: SalesItem[];
}

export interface SalesMamaItem {
    id: number;
    product_id: number;
    product_name: string;
    price: number;
    quantity: number;
    total: number;
}

export interface SalesMama {
    date: string;
    items: SalesMamaItem[];
}