const fs = require('fs');
let code = fs.readFileSync('components/AIAssistant.tsx', 'utf8');

const oldHandleGenerateBook = `const handleGenerateBook = () => {
    if (!bookElements.trim()) {
      alert('يرجى إدخال محتوى أو عناصر الكتاب المراد توليده.');
      return;
    }
    
    const numPages = parseInt(bookPages) || 3;
    let actionPrompt = "";
    
    if (bookType === 'قصة/رواية') {
      actionPrompt = \`أريد تأليف قصة/رواية متكاملة بعنوان "\${bookName || 'بدون عنوان'}" بناءً على الأفكار أو العناصر التالية:\\n\${bookElements}\\n\\nالفئة العمرية/المستوى: \${bookLevel}\\nالنوع (خيال، مغامرة، دراما...): \${bookSubject}\\nأسلوب السرد: \${bookStyle}\${bookNotes.trim() ? \\\`\\nملاحظات إضافية: \${bookNotes}\\\` : ''}\\n\\nعدد الصفحات المطلوب: \${numPages} صفحات.\\n\\nالرجاء كتابة محتوى القصة بالكامل بحيث يشمل:\\n- مقدمة أو بداية مشوقة.\\n- فصول وأحداث القصة متسلسلة بشكل واضح.\\n- حوارات الشخصيات إن وجدت.\\n- الخاتمة.\\n\\nاستخدم تنسيق HTML مهيكل بشكل جيد (h1, h2, p, etc) بحيث يكون جاهزاً للمستند.\\n\\nهام جداً: يمنع منعاً باتاً كتابة أو عرض الرد بأقواس أو علامات برمجية. أرجع فقط نصوصاً منسقة بـ HTML نظيف.\\n\\nيجب عليك تقسيم محتوى القصة بالتساوي ليتوزع على \${numPages} صفحات تماماً. لإنشاء صفحة جديدة، استخدم العلامة <hr class="page-break" contenteditable="false"> بالضبط كفاصل صفحات. يجب أن يحتوي الملف النهائي على \${numPages - 1} من فواصل الصفحات.\`;
    } else {
      actionPrompt = \`أريد تأليف كتاب تعليمي متكامل بعنوان "\${bookName || 'بدون عنوان'}" بناءً على العناصر التالية:\\n\${bookElements}\\n\\nالمرحلة الدراسية/المستوى: \${bookLevel}\\nالموضوع/المجال: \${bookSubject}\\nأسلوب الشرح: \${bookStyle}\${bookNotes.trim() ? \\\`\\nملاحظات إضافية: \${bookNotes}\\\` : ''}\\n\\nعدد الصفحات المطلوب: \${numPages} صفحات.\\n\\nالرجاء كتابة محتوى الكتاب بالكامل بحيث يشمل:\\n- مقدمة شاملة.\\n- فصول الكتاب مع شرح أصلي وافٍ لكل عنصر.\\n- ملخص لكل فصل.\\n- تمارين واختبارات مع إجاباتها في نهاية الكتاب.\\n\\nاستخدم أنواعًا مختلفة حسب طبيعة المحتوى باستخدام تنسيق HTML مناسب (مثل الصناديق أو الأيقونات النصية):\\n📘 تعريف → للمصطلحات والتعريفات.\\n💡 ملحوظة → للمعلومات الإضافية المهمة.\\n⚠️ تنبيه → للأخطاء الشائعة أو الأشياء التي يجب الانتباه إليها.\\n⭐ معلومة مهمة → للمعلومات التي يجب حفظها.\\n🧠 تذكر → للنقاط التي يحتاج الطالب إلى حفظها.\\n❓ فكر → لسؤال يحفز الطالب على التفكير.\\n📝 مثال → للأمثلة التطبيقية.\\n\\nالتفاعل بين النص والرسومات (باستخدام وصف للرسوم كعنصر نائب إذا لزم الأمر):\\n- حدد أفضل مكان بحيث يأتي الرسم بعد الفكرة التي يشرحها مباشرة ولا يقطع تسلسل الشرح.\\n- ضع تعليق أسفل الرسم، مثل: «شكل (1): ...».\\n- مهم جدًا: لا تنشئ رسمًا لمجرد وجود مساحة. اسأل نفسك: هل سيساعد الطالب على الفهم؟ إذا كانت الإجابة نعم، أنشئه.\\n\\nقواعد التصميم والتنسيق:\\n- استخدم تنسيق HTML مهيكل بشكل جيد (h1, h2, p, ul, table, blockquote, div مع أنماط CSS مضمنة بسيطة للصناديق).\\n- تسلسل بصري واضح، مسافات مناسبة، صناديق معلومات منظمة، وجداول عند الحاجة لدعم اللغة العربية واتجاه RTL.\\n\\nهام جداً: يمنع منعاً باتاً كتابة أو عرض أو تغليف الرد بأقواس أو علامات برمجية مثل علامات الاقتباس الخلفية (\\\`\\\`\\\`). أرجع فقط نصوصاً منسقة بـ HTML نظيف وصالح مباشرة.\\n\\nيجب عليك تقسيم محتوى الكتاب بالتساوي ليتوزع على \${numPages} صفحات تماماً. لإنشاء صفحة جديدة، استخدم العلامة <hr class="page-break" contenteditable="false"> بالضبط كفاصل صفحات. يجب أن يحتوي الملف النهائي على \${numPages - 1} من فواصل الصفحات.\`;
    }
    
    handleGenerate(actionPrompt, \`أنت مؤلف خبير. اكتب محتوى غنياً ومنظماً جداً. أرجع HTML نظيف وصالح مباشرة للرد. يمنع منعاً باتاً إضافة أي كود برمجي أو علامات اقتباس خلفية (\\\`\\\`\\\`). يجب عليك تقسيم المحتوى إلى \${numPages} صفحات تماماً وإدراج العلامة <hr class="page-break" contenteditable="false"> لإنشاء فواصل صفحات واضحة ومستقلة بين الصفحات (بإجمالي \${numPages - 1} فواصل صفحات).\`, 'document');
  };`;

const newHandleGenerateBook = `const handleGenerateBook = async () => {
    if (!bookElements.trim()) {
      alert('يرجى إدخال محتوى أو عناصر الكتاب المراد توليده.');
      return;
    }
    
    const numPages = parseInt(bookPages) || 3;
    let actionPrompt = "";
    
    setIsLoading(true);
    let coverHtml = "";
    try {
        const bookTitle = bookName || 'بدون عنوان';
        const coverPromptText = \`تصميم غلاف \${bookType === 'قصة/رواية' ? 'قصة' : 'كتاب'} بعنوان "\${bookTitle}". الموضوع: \${bookSubject}. الفئة/المستوى: \${bookLevel}. عناصر أساسية: \${bookElements.substring(0, 100)}. ركز على تصميم غلاف فني واحترافي خالي تماما من أي نص أو كلمات.\`;
        
        const response = await fetch('/api/gemini/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            prompt: coverPromptText,
            aspectRatio: "3:4"
          })
        });

        const data = await response.json();
        if (response.ok && !data.error) {
           coverHtml = \`<div style="text-align: center;"><img src="\${data.imageUrl}" alt="غلاف الكتاب" style="max-width: 100%; max-height: 800px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); margin-bottom: 24px;" /></div><hr class="page-break" contenteditable="false">\`;
        }
    } catch (e) {
        console.warn("Cover generation failed:", e);
    }
    
    if (bookType === 'قصة/رواية') {
      actionPrompt = \`أريد تأليف قصة/رواية متكاملة بعنوان "\${bookName || 'بدون عنوان'}" بناءً على الأفكار أو العناصر التالية:\\n\${bookElements}\\n\\nالفئة العمرية/المستوى: \${bookLevel}\\nالنوع (خيال، مغامرة، دراما...): \${bookSubject}\\nأسلوب السرد: \${bookStyle}\${bookNotes.trim() ? \\\`\\nملاحظات إضافية: \${bookNotes}\\\` : ''}\\n\\nعدد الصفحات المطلوب: \${numPages} صفحات.\\n\\nالرجاء كتابة محتوى القصة بالكامل بحيث يشمل:\\n- مقدمة أو بداية مشوقة.\\n- فصول وأحداث القصة متسلسلة بشكل واضح.\\n- حوارات الشخصيات إن وجدت.\\n- الخاتمة.\\n\\nاستخدم تنسيق HTML مهيكل بشكل جيد (h1, h2, p, etc) بحيث يكون جاهزاً للمستند.\\n\\nهام جداً: يمنع منعاً باتاً كتابة أو عرض الرد بأقواس أو علامات برمجية. أرجع فقط نصوصاً منسقة بـ HTML نظيف.\\n\\nهام جداً: التزم التزاماً دقيقاً بعدد الصفحات المطلوب (\${numPages} صفحات). يجب عليك تقسيم محتوى القصة بالتساوي ليتوزع على \${numPages} صفحات تماماً. لإنشاء صفحة جديدة، استخدم العلامة <hr class="page-break" contenteditable="false"> بالضبط كفاصل صفحات. يجب أن يحتوي الملف النهائي على \${numPages - 1} من فواصل الصفحات بالضبط.\`;
    } else {
      actionPrompt = \`أريد تأليف كتاب تعليمي متكامل بعنوان "\${bookName || 'بدون عنوان'}" بناءً على العناصر التالية:\\n\${bookElements}\\n\\nالمرحلة الدراسية/المستوى: \${bookLevel}\\nالموضوع/المجال: \${bookSubject}\\nأسلوب الشرح: \${bookStyle}\${bookNotes.trim() ? \\\`\\nملاحظات إضافية: \${bookNotes}\\\` : ''}\\n\\nعدد الصفحات المطلوب: \${numPages} صفحات.\\n\\nالرجاء كتابة محتوى الكتاب بالكامل بحيث يشمل:\\n- مقدمة شاملة.\\n- فصول الكتاب مع شرح أصلي وافٍ لكل عنصر.\\n- ملخص لكل فصل.\\n- تمارين واختبارات مع إجاباتها في نهاية الكتاب.\\n\\nاستخدم أنواعًا مختلفة حسب طبيعة المحتوى باستخدام تنسيق HTML مناسب (مثل الصناديق أو الأيقونات النصية):\\n📘 تعريف → للمصطلحات والتعريفات.\\n💡 ملحوظة → للمعلومات الإضافية المهمة.\\n⚠️ تنبيه → للأخطاء الشائعة أو الأشياء التي يجب الانتباه إليها.\\n⭐ معلومة مهمة → للمعلومات التي يجب حفظها.\\n🧠 تذكر → للنقاط التي يحتاج الطالب إلى حفظها.\\n❓ فكر → لسؤال يحفز الطالب على التفكير.\\n📝 مثال → للأمثلة التطبيقية.\\n\\nالتفاعل بين النص والرسومات (باستخدام وصف للرسوم كعنصر نائب إذا لزم الأمر):\\n- حدد أفضل مكان بحيث يأتي الرسم بعد الفكرة التي يشرحها مباشرة ولا يقطع تسلسل الشرح.\\n- ضع تعليق أسفل الرسم، مثل: «شكل (1): ...».\\n- مهم جدًا: لا تنشئ رسمًا لمجرد وجود مساحة. اسأل نفسك: هل سيساعد الطالب على الفهم؟ إذا كانت الإجابة نعم، أنشئه.\\n\\nقواعد التصميم والتنسيق:\\n- استخدم تنسيق HTML مهيكل بشكل جيد (h1, h2, p, ul, table, blockquote, div مع أنماط CSS مضمنة بسيطة للصناديق).\\n- تسلسل بصري واضح، مسافات مناسبة، صناديق معلومات منظمة، وجداول عند الحاجة لدعم اللغة العربية واتجاه RTL.\\n\\nهام جداً: يمنع منعاً باتاً كتابة أو عرض أو تغليف الرد بأقواس أو علامات برمجية مثل علامات الاقتباس الخلفية (\\\`\\\`\\\`). أرجع فقط نصوصاً منسقة بـ HTML نظيف وصالح مباشرة.\\n\\nهام جداً: التزم التزاماً دقيقاً بعدد الصفحات المطلوب (\${numPages} صفحات). يجب عليك تقسيم محتوى الكتاب بالتساوي ليتوزع على \${numPages} صفحات تماماً. لإنشاء صفحة جديدة، استخدم العلامة <hr class="page-break" contenteditable="false"> بالضبط كفاصل صفحات. يجب أن يحتوي الملف النهائي على \${numPages - 1} من فواصل الصفحات بالضبط.\`;
    }
    
    // We pass coverHtml as the 4th argument to handleGenerate, which prepend it to the document
    handleGenerate(actionPrompt, \`أنت مؤلف خبير. اكتب محتوى غنياً ومنظماً جداً. أرجع HTML نظيف وصالح مباشرة للرد. يمنع منعاً باتاً إضافة أي كود برمجي أو علامات اقتباس خلفية (\\\`\\\`\\\`). هام جداً: التزم التزاماً صارماً بتقسيم المحتوى إلى \${numPages} صفحات تماماً عن طريق إدراج العلامة <hr class="page-break" contenteditable="false"> كفاصل بين الصفحات (يجب أن تدرج \${numPages - 1} من فواصل الصفحات).\`, 'document', coverHtml);
  };`;

// Note: Because code might have slight indentation variations, replacing by parsing might be safer, but let's try direct replacement first, if not we will use substring.

let startIndex = code.indexOf("const handleGenerateBook = () => {");
let endIndex = code.indexOf("  const handleGenerateCover = async () => {");

if (startIndex !== -1 && endIndex !== -1) {
    code = code.substring(0, startIndex) + newHandleGenerateBook + "\n\n" + code.substring(endIndex);
    fs.writeFileSync('components/AIAssistant.tsx', code);
    console.log('Replaced handleGenerateBook successfully');
} else {
    console.log('Failed to find handleGenerateBook boundaries');
}
