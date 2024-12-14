import React from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const Home: React.FC<{
    onNavigateToSalesForm?: () => void;
    onNavigateToSalesForm2?: () => void;
}> = ({
    onNavigateToSalesForm = () => { },
    onNavigateToSalesForm2 = () => { }
}) => {
        return (
            <div className="justify-center items-center min-h-screen bg-gray-100 w-full absolute inset-0">
                <Card className="w-full max-w-auto place-items-center">
                    <CardHeader>
                        <CardTitle className="text-center">Selecciona un Formulario de Ventas</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button
                            onClick={onNavigateToSalesForm}
                            variant="default"
                            className="w-full"
                        >
                            Ir a Formulario de Ventas Silvia
                        </Button>
                        <Button
                            onClick={onNavigateToSalesForm2}
                            variant="secondary"
                            className="w-full"
                        >
                            Ir a Formulario de Ventas Mamá
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    };

export default Home;