
import React from 'react';

interface PricingCardProps {
    plan: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isFeatured?: boolean;
    onSelect: () => void;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, period, description, features, isFeatured = false, onSelect }) => {
    const cardClasses = isFeatured
        ? 'border-blue-500 border-2 relative'
        : 'border-slate-300 dark:border-slate-700 border';

    const buttonClasses = isFeatured
        ? 'bg-blue-600 hover:bg-blue-700 text-white'
        : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200';

    return (
        <div className={`bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg flex flex-col ${cardClasses} transform hover:scale-105 transition-transform duration-300`}>
            {isFeatured && (
                <div className="absolute top-0 right-8 -mt-4 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase">Mais Popular</div>
            )}
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{plan}</h3>
            <div className="my-4">
                <span className="text-5xl font-extrabold text-slate-900 dark:text-white">{price}</span>
                <span className="text-slate-500 dark:text-slate-400">/{period}</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 mb-6">{description}</p>
            <ul className="space-y-3 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                        <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <button 
                onClick={onSelect}
                className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors duration-300 ${buttonClasses}`}
            >
                Escolher Plano
            </button>
        </div>
    );
};

export default PricingCard;
