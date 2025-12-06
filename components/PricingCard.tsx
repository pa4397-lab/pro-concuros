
import React from 'react';

interface PricingCardProps {
    plan: string;
    price: string;
    period: string;
    description: string;
    features: string[];
    isFeatured?: boolean;
    onSelect: () => void;
    economy?: string;
}

const PricingCard: React.FC<PricingCardProps> = ({ plan, price, period, description, features, isFeatured = false, onSelect, economy }) => {
    return (
        <div className={`relative rounded-2xl p-8 flex flex-col h-full transition-all duration-300 ${isFeatured ? 'bg-slate-900/50 border border-brand-500/50 shadow-2xl shadow-brand-900/20 scale-105 z-10' : 'bg-slate-900/30 border border-white/5 hover:border-white/10'}`}>
            {isFeatured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-brand-500 to-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-brand-500/30 uppercase tracking-wide">
                        Mais Escolhido
                    </span>
                </div>
            )}
            
            <div className="mb-6">
                <h3 className={`text-lg font-semibold ${isFeatured ? 'text-brand-300' : 'text-slate-300'}`}>{plan}</h3>
                <div className="flex items-baseline mt-2">
                    <span className="text-4xl font-extrabold text-white tracking-tight">{price}</span>
                    <span className="ml-2 text-slate-500 text-sm">/{period}</span>
                </div>
                {economy && (
                     <div className="mt-2 inline-block bg-green-500/10 border border-green-500/20 rounded px-2 py-0.5">
                        <span className="text-xs font-bold text-green-400">{economy}</span>
                     </div>
                )}
                <p className="mt-4 text-slate-400 text-sm leading-relaxed">{description}</p>
            </div>

            <div className="w-full h-px bg-white/5 mb-6"></div>

            <ul className="space-y-4 mb-8 flex-grow">
                {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isFeatured ? 'bg-brand-500/20 text-brand-400' : 'bg-slate-800 text-slate-400'}`}>
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <span className="ml-3 text-slate-300 text-sm">{feature}</span>
                    </li>
                ))}
            </ul>

            <button 
                onClick={onSelect}
                className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all duration-300 shadow-lg ${
                    isFeatured 
                    ? 'bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-500 hover:to-blue-500 text-white shadow-brand-500/25' 
                    : 'bg-white text-slate-950 hover:bg-slate-200'
                }`}
            >
                {isFeatured ? 'Quero Garantir Minha Vaga' : 'Começar Agora'}
            </button>
        </div>
    );
};

export default PricingCard;
