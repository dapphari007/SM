import React from "react";
import "../../styles/ratingControl.css"

interface RatingControlProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

const RatingControl: React.FC<RatingControlProps> = ({
  value = 0,
  onChange,
  disabled = false,
}) => {
  const handleClick = () => {
    if (disabled) return;
    const nextValue = value >= 4 ? 0 : value + 1;
    onChange(nextValue);
  };

  const getStateClass = (currentValue: number) => {
    switch (currentValue) {
      case 1:
        return "rating-1";
      case 2:
        return "rating-2";
      case 3:
        return "rating-3";
      case 4:
        return "rating-4";
      default:
        return "rating-empty";
    }
  };

  const getSymbol = (currentValue: number) => {
    let symbol;
    switch (currentValue) {
      case 1:
        symbol = "★";
        break;
      case 2:
        symbol = "★★";
        break;
      case 3:
        symbol = "★★★";
        break;
      case 4:
        symbol = "★★★★";
        break;
      default:
        symbol = "-";
    }
    // return currentValue === 0 ? "—" : currentValue;
    return symbol;
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={`
        cycle-control ${getStateClass(value)}
        w-11 h-11 border-2 rounded-full
        flex items-center justify-center
        text-lg font-medium transition-all duration-200
        cursor-pointer select-none
        hover:scale-110 active:scale-95
        disabled:cursor-not-allowed disabled:opacity-50
      `}
      style={{
        boxShadow: value > 0 ? "0 2px 8px rgba(0, 0, 0, 0.15)" : "none",
      }}
    >
      {getSymbol(value)}
    </button>
  );
};

export default RatingControl;
