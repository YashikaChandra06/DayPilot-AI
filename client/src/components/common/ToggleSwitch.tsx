import React from 'react';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  activeColor?: string;
  label?: string;
  ariaLabel?: string;
}

export const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = 'md',
  activeColor = 'bg-gradient-to-r from-primary-600 to-indigo-600',
  label,
  ariaLabel,
}) => {
  const sizeClasses = {
    sm: {
      track: 'w-8 h-4.5 p-0.5',
      thumb: 'w-3.5 h-3.5',
      translate: 'translate-x-3.5',
    },
    md: {
      track: 'w-11 h-6 p-0.5',
      thumb: 'w-5 h-5',
      translate: 'translate-x-5',
    },
    lg: {
      track: 'w-14 h-7.5 p-1',
      thumb: 'w-6 h-6',
      translate: 'translate-x-6',
    },
  }[size];

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel || label}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex shrink-0 cursor-pointer rounded-full transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/50 disabled:opacity-50 disabled:cursor-not-allowed ${
        sizeClasses.track
      } ${
        checked
          ? activeColor
          : 'bg-zinc-300 dark:bg-zinc-700/80 hover:bg-zinc-400 dark:hover:bg-zinc-600'
      }`}
    >
      <span
        className={`pointer-events-none inline-block rounded-full bg-white shadow-md transform ring-0 transition-transform duration-300 ease-out active:scale-95 ${
          sizeClasses.thumb
        } ${checked ? sizeClasses.translate : 'translate-x-0'}`}
      />
    </button>
  );
};
