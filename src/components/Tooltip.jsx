

const Tooltip = ({ message, position = 'top', children }) => {
  const pos = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }[position] || 'bottom-full left-1/2 -translate-x-1/2 mb-2';

  return (
    <div className="relative inline-flex group">
      {children}
      <span
        className={`pointer-events-none absolute whitespace-nowrap bg-gray-800 text-white text-xs z-10 rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${pos}`}
      >
        {message}
      </span>
    </div>
  );
};

export default Tooltip;