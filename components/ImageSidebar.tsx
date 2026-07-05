import React, { useState, useEffect } from 'react';

interface ImageSidebarProps {
  image: HTMLImageElement;
  onClose: () => void;
  onUpdate: () => void;
}

const ImageSidebar: React.FC<ImageSidebarProps> = ({ image, onClose, onUpdate }) => {
  const [width, setWidth] = useState<number | string>(0);
  const [height, setHeight] = useState<number | string>(0);

  useEffect(() => {
    setWidth(image.width || image.clientWidth);
    setHeight(image.height || image.clientHeight);
  }, [image]);

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setWidth('');
      return;
    }
    const val = parseInt(valStr, 10);
    setWidth(val);
    if (!isNaN(val) && val > 0) {
      image.style.width = `${val}px`;
      image.width = val;
      onUpdate();
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valStr = e.target.value;
    if (valStr === '') {
      setHeight('');
      return;
    }
    const val = parseInt(valStr, 10);
    setHeight(val);
    if (!isNaN(val) && val > 0) {
      image.style.height = `${val}px`;
      image.height = val;
      onUpdate();
    }
  };

  return (
    <div className="w-64 bg-white dark:bg-slate-800 border-r dark:border-slate-700 p-4 shadow-sm fixed right-0 top-[64px] bottom-0 overflow-y-auto z-30 transition-transform">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-bold text-slate-800 dark:text-white">تعديل الصورة</h3>
        <button onClick={onClose} className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xl leading-none">&times;</button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">العرض (بكسل)</label>
          <input 
            type="number" 
            value={typeof width === 'number' && isNaN(width) ? '' : width} 
            onChange={handleWidthChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">الارتفاع (بكسل)</label>
          <input 
            type="number" 
            value={typeof height === 'number' && isNaN(height) ? '' : height} 
            onChange={handleHeightChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default ImageSidebar;
