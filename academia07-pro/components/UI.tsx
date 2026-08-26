import React from 'react';

interface GlassCardProps {
  children?: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "",
  hoverEffect = false
}) => (
  <div className={`
    glass-card rounded-2xl p-6 relative overflow-hidden transition-all duration-300
    ${hoverEffect ? 'hover:translate-y-[-4px] hover:shadow-[0_10px_40px_-10px_rgba(59,130,246,0.2)] hover:border-blue-500/30' : 'shadow-xl'}
    ${className}
  `}>
    {/* Subtle gradient overlay for depth */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    <div className="relative z-10">{children}</div>
  </div>
);

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: (e?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: "primary" | "secondary" | "danger" | "outline" | "ghost" | "glow";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  onClick, 
  variant = "primary", 
  className = "",
  disabled = false,
  type = "button",
  icon
}) => {
  const baseStyle = "px-5 py-2.5 rounded-xl font-medium font-display tracking-wide transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-95";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] border border-blue-400/20",
    secondary: "bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_20px_rgba(147,51,234,0.3)] border border-purple-400/20",
    danger: "bg-red-500/20 hover:bg-red-500/30 text-red-200 border border-red-500/30",
    outline: "border border-white/20 hover:border-white/40 hover:bg-white/5 text-gray-300 hover:text-white",
    ghost: "text-gray-400 hover:text-white hover:bg-white/5",
    glow: "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] border-t border-white/20"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant]} ${className}`}
    >
      {icon && <span className="opacity-90">{icon}</span>}
      {children}
    </button>
  );
};

interface InputProps {
  label?: string; 
  value: string | number; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; 
  type?: string; 
  placeholder?: string;
  min?: number;
  max?: number;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder = "",
  min,
  max,
  onKeyDown
}) => (
  <div className="mb-4 group">
    {label && <label className="block text-xs uppercase tracking-wider font-semibold text-gray-400 mb-2 group-focus-within:text-blue-400 transition-colors">{label}</label>}
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        min={min}
        max={max}
        className="w-full bg-[#0F1623] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
      />
      {/* Decorative corner glow */}
      <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-white/10 rounded-tr-sm opacity-50" />
      <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-white/10 rounded-bl-sm opacity-50" />
    </div>
  </div>
);