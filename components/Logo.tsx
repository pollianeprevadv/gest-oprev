import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export const Logo: React.FC<LogoProps> = ({ className = '', variant = 'dark' }) => {
  // In a real scenario, you would import the image file. 
  // For this generated code, we use a placeholder that represents the user's uploaded image.
  // The user should replace the src below with their actual image path if hosted, or keep using this component structure.
  
  // NOTE: I am constructing a CSS-based logo that resembles the user's "SS" description if the image fails, 
  // but ideally, we use an img tag.
  
  const textColor = variant === 'light' ? 'text-white' : 'text-navy-900';
  const subTextColor = variant === 'light' ? 'text-gold-400' : 'text-gold-600';

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
        {/* Placeholder for the actual Image file provided by user */}
        <div className="relative mb-2 w-20 h-20 flex items-center justify-center">
             {/* Simulating the Intertwined S logo with text for the demo code since I cannot host the user's image file */}
             <div className="relative font-serif text-5xl font-bold tracking-tighter" style={{ fontFamily: '"Playfair Display", serif' }}>
                <span className={`absolute left-0 top-0 ${variant === 'light' ? 'text-navy-800' : 'text-navy-900'} z-10`} style={{ transform: 'translateX(-10px)' }}>S</span>
                <span className={`absolute left-0 top-0 ${variant === 'light' ? 'text-gold-400' : 'text-gold-500'} z-0`} style={{ transform: 'translateX(6px) translateY(4px)' }}>S</span>
             </div>
        </div>
      <h1 className={`font-serif text-xl tracking-widest uppercase ${textColor}`}>Seabra & Sousa</h1>
      <span className={`text-xs tracking-[0.2em] uppercase font-sans ${subTextColor}`}>Advogados</span>
    </div>
  );
};