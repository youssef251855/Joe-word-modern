import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';

interface ImagePropertiesPanelProps {
  image: HTMLImageElement;
  onClose: () => void;
}

const ImagePropertiesPanel: React.FC<ImagePropertiesPanelProps> = ({ image, onClose }) => {
  const [width, setWidth] = useState(image.width);
  const [height, setHeight] = useState(image.height);

  useEffect(() => {
    setWidth(image.width);
    setHeight(image.height);
  }, [image]);

  const handleApply = () => {
    image.style.width = `${width}px`;
    image.style.height = `${height}px`;
  };

  return (
    <div className="w-64 bg-white border-l border-slate-200 p-4 h-full">
      <h3 className="font-bold mb-4">خصائص الصورة</h3>
      <div className="mb-4">
        <label className="block text-sm mb-1">العرض (px)</label>
        <input 
          type="number" 
          value={width} 
          onChange={(e) => setWidth(parseInt(e.target.value))}
          className="w-full border rounded p-1"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm mb-1">الارتفاع (px)</label>
        <input 
          type="number" 
          value={height} 
          onChange={(e) => setHeight(parseInt(e.target.value))}
          className="w-full border rounded p-1"
        />
      </div>
      <Button onClick={handleApply} className="w-full">تطبيق</Button>
      <Button onClick={onClose} variant="ghost" className="w-full mt-2">إغلاق</Button>
    </div>
  );
};

export default ImagePropertiesPanel;
