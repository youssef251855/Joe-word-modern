import React from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { SearchIcon, XIcon, ChevronRightIcon } from 'lucide-react';

interface Heading {
  text: string;
  level: number;
  id: string;
}

interface NavigationPaneProps {
  headings: Heading[];
}

const NavigationPane: React.FC<NavigationPaneProps> = ({ headings }) => {
  const [search, setSearch] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'headings' | 'pages' | 'results'>('headings');

  const filteredHeadings = headings.filter(h => 
    h.text.toLowerCase().includes(search.toLowerCase())
  );

  const scrollToHeading = (text: string) => {
    const editor = document.querySelector('.ql-editor');
    if (!editor) return;

    // Find all headings and match by text
    const elements = Array.from(editor.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const target = elements.find(el => el.textContent?.trim() === text.trim());
    
    if (target) {
      // Scroll the main container
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        const topPos = (target as HTMLElement).offsetTop;
        mainContainer.scrollTo({
          top: topPos + 64, // Add some offset for the header/ribbon
          behavior: 'smooth'
        });
      } else {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <Card className="w-64 h-full rounded-none border-y-0 border-l-0 flex flex-col bg-slate-50">
      <div className="p-3 border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-slate-700 uppercase tracking-tight">Navigation</h2>
          <XIcon className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600" />
        </div>
        <div className="relative">
          <SearchIcon className="absolute left-2 top-2 w-3.5 h-3.5 text-slate-400" />
          <Input 
            placeholder="Search document" 
            className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 focus-visible:ring-primary-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex border-b border-slate-200 bg-white">
        <button 
          onClick={() => setActiveTab('headings')}
          className={`flex-1 py-2 text-[11px] font-medium transition-all ${activeTab === 'headings' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          العناوين
        </button>
        <button 
          onClick={() => setActiveTab('pages')}
          className={`flex-1 py-2 text-[11px] font-medium transition-all ${activeTab === 'pages' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          الصفحات
        </button>
        <button 
          onClick={() => setActiveTab('results')}
          className={`flex-1 py-2 text-[11px] font-medium transition-all ${activeTab === 'results' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-slate-500 hover:text-slate-700'}`}
        >
          النتائج
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {activeTab === 'headings' && (
          <div className="space-y-1">
            {filteredHeadings.length > 0 ? (
              filteredHeadings.map((heading) => (
                <div 
                  key={heading.id} 
                  className="flex items-center gap-1 p-1 rounded hover:bg-slate-200 cursor-pointer group"
                  style={{ paddingLeft: `${(heading.level - 1) * 12 + 4}px` }}
                  onClick={() => scrollToHeading(heading.text)}
                >
                  <ChevronRightIcon className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
                  <span className={`text-xs ${heading.level === 1 ? 'text-slate-700 font-medium' : 'text-slate-600'}`}>
                    {heading.text}
                  </span>
                </div>
              ))
            ) : (
              <div className="mt-8 p-4 text-center">
                <p className="text-[10px] text-slate-400 italic">
                  {search ? 'لم يتم العثور على نتائج.' : 'قم بإنشاء عناوين لتظهر هنا.'}
                </p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'pages' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <span className="text-2xl">📄</span>
            <p className="text-[10px] italic">معاينة الصفحات غير متوفرة حالياً.</p>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
            <SearchIcon className="w-6 h-6 opacity-20" />
            <p className="text-[10px] italic">نتائج البحث ستظهر هنا.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NavigationPane;
