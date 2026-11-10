import React from 'react';

export interface ToggleOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
  hint?: string;
}

interface SlidingSegmentedToggleProps<T extends string> {
  options: [ToggleOption<T>, ToggleOption<T>];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
  activeColor?: string;
  className?: string;
}

export function SlidingSegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
  activeColor = 'bg-primary-600 text-white',
  className = '',
}: SlidingSegmentedToggleProps<T>) {
  const isSecond = value === options[1].value;

  const sizeClasses = {
    sm: {
      container: 'p-0.5 text-[11px]',
      button: 'px-2.5 py-1',
    },
    md: {
      container: 'p-1 text-xs',
      button: 'px-3 py-1.5',
    },
  }[size];

  return (
    <div
      className={`relative inline-flex items-center rounded-xl bg-muted/80 border border-border select-none ${sizeClasses.container} ${className}`}
    >
      {/* Sliding Active Pill Indicator */}
      <div
        className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-lg shadow-sm transition-transform duration-300 ease-out pointer-events-none ${
          isSecond ? 'translate-x-[calc(100%+8px)]' : 'translate-x-0'
        } ${activeColor}`}
      />

      {/* Option 1 Button */}
      <button
        type="button"
        onClick={() => onChange(options[0].value)}
        className={`relative z-10 flex-1 flex items-center justify-center space-x-1.5 font-semibold transition-colors duration-200 rounded-lg ${
          sizeClasses.button
        } ${
          !isSecond
            ? 'text-white'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title={options[0].hint}
      >
        {options[0].icon && <span className="shrink-0">{options[0].icon}</span>}
        <span>{options[0].label}</span>
      </button>

      {/* Option 2 Button */}
      <button
        type="button"
        onClick={() => onChange(options[1].value)}
        className={`relative z-10 flex-1 flex items-center justify-center space-x-1.5 font-semibold transition-colors duration-200 rounded-lg ${
          sizeClasses.button
        } ${
          isSecond
            ? 'text-white'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title={options[1].hint}
      >
        {options[1].icon && <span className="shrink-0">{options[1].icon}</span>}
        <span>{options[1].label}</span>
      </button>
    </div>
  );
}

