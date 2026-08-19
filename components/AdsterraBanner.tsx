import React, { useState, useEffect, useRef } from 'react';
import { Settings, Info, ExternalLink, X } from 'lucide-react';

interface AdsterraBannerProps {
  className?: string;
}

const AdsterraBanner: React.FC<AdsterraBannerProps> = ({ className }) => {
  const [adKey, setAdKey] = useState<string>(() => {
    return localStorage.getItem('adsterra_key') || 'd6a7ef6cb3d4b96791e2b4f9be99cf70';
  });
  const [appId, setAppId] = useState<string>(() => {
    return localStorage.getItem('adsterra_app_id') || '';
  });
  const [showSettings, setShowSettings] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate the sandboxed iframe content containing the Adsterra integration code
  const getIframeSourceDoc = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            html, body {
              margin: 0;
              padding: 0;
              width: 100%;
              height: 100%;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: center;
              background-color: transparent;
              font-family: 'Cairo', -apple-system, sans-serif;
              direction: rtl;
            }
            .placeholder {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              background: linear-gradient(135deg, #1e3a8a, #3b82f6);
              color: white;
              font-size: 11px;
              font-weight: bold;
              border-radius: 4px;
              box-shadow: inset 0 0 10px rgba(0,0,0,0.2);
              cursor: pointer;
              transition: opacity 0.2s;
              text-align: center;
              padding: 0 8px;
            }
            .placeholder:hover {
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div id="ad-container" style="width:100%; height:100%; display:flex; justify-content:center; align-items:center;">
            <!-- Adsterra Code will be injected here -->
            <script type="text/javascript">
              try {
                window.atOptions = {
                  'key' : '${adKey}',
                  'format' : 'iframe',
                  'height' : 50,
                  'width' : 320,
                  'params' : {
                    'appId': '${appId}'
                  }
                };
                
                var script = document.createElement('script');
                script.type = 'text/javascript';
                script.src = '//www.highperformanceformat.com/' + '${adKey}' + '/invoke.js';
                script.onerror = function() {
                  document.getElementById('ad-container').innerHTML = '<div class="placeholder">إعلان ممول من Adsterra (انقر للتكوين)</div>';
                };
                document.getElementById('ad-container').appendChild(script);
              } catch(e) {
                document.getElementById('ad-container').innerHTML = '<div class="placeholder">خطأ في تحميل إعلانات Adsterra</div>';
              }
            </script>
          </div>
        </body>
      </html>
    `;
  };

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('adsterra_key', adKey);
    localStorage.setItem('adsterra_app_id', appId);
    setShowSettings(false);
    // Force iframe reload
    if (iframeRef.current) {
      iframeRef.current.srcdoc = getIframeSourceDoc();
    }
  };

  return (
    <div className={`relative flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md overflow-hidden ${className}`}>
      {/* Title/Label */}
      <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5 z-10 bg-slate-200/90 dark:bg-slate-900/90 px-1.5 py-0.5 rounded text-[9px] font-semibold text-slate-500 dark:text-slate-400 backdrop-blur-sm">
        <span>Adsterra</span>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="hover:text-primary-600 transition-colors"
          title="تكوين إعلان Adsterra"
        >
          <Settings className="w-3 h-3" />
        </button>
      </div>

      {/* Sandboxed Ad Frame */}
      <iframe
        ref={iframeRef}
        title="Adsterra Ad"
        srcDoc={getIframeSourceDoc()}
        sandbox="allow-scripts allow-same-origin allow-popups"
        scrolling="no"
        className="w-[320px] h-[50px] border-none bg-transparent"
      />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/65 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary-500" />
                تكوين إعلانات Adsterra
              </h4>
              <button onClick={() => setShowSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={handleSaveKey} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  مفتاح الإعلان (Adsterra Banner Hash/Key)
                </label>
                <input
                  type="text"
                  value={adKey}
                  onChange={(e) => setAdKey(e.target.value)}
                  placeholder="أدخل مفتاح Adsterra الخاص بك..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  معرف التطبيق (App ID)
                </label>
                <input
                  type="text"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="أدخل معرف التطبيق (App ID) الاختياري..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-md bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-xs text-blue-700 dark:text-blue-300 flex gap-2">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  يمكنك الحصول على المفتاح من لوحة تحكم الناشرين في Adsterra (حجم الإعلان الموصى به هو 320x50 ليناسب شريط الأدوات بشكل رائع).
                </p>
              </div>

              <div className="flex justify-end gap-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md shadow-sm"
                >
                  حفظ وتحديث
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdsterraBanner;
