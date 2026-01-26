import React from 'react';
import { Loader2 } from 'lucide-react';

export const PageLoader: React.FC = () => {
    return (
        <div className="flex items-center justify-center w-full h-full min-h-[400px]">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
    );
};
