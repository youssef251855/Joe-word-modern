import React, { useState } from 'react';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signInAnonymously, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';

const Auth: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    try {
      setLoading(true);
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Error with email auth:', error);
      if (error.code === 'auth/email-already-in-use') {
        setErrorMsg('البريد الإلكتروني مستخدم مسبقاً');
      } else if (error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        setErrorMsg('البريد الإلكتروني أو كلمة المرور غير صحيحة');
      } else if (error.code === 'auth/weak-password') {
        setErrorMsg('كلمة المرور ضعيفة، يجب أن تكون 6 أحرف على الأقل');
      } else if (error.code === 'auth/operation-not-allowed') {
        setErrorMsg('يرجى تفعيل "تحديث بالبريد الإلكتروني/كلمة المرور" (Email/Password) في إعدادات Firebase Authentication.');
      } else {
        setErrorMsg(`حدث خطأ أثناء المصادقة: ${error.message}`);
      }
      setLoading(false);
    }
  };

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      setErrorMsg('');
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Error signing in:', error);
      setErrorMsg('حدث خطأ أثناء تسجيل الدخول بـ Google');
      setLoading(false);
    }
  };

  const handleAnonymousSignIn = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      await signInAnonymously(auth);
    } catch (error: any) {
      console.error('Error signing in anonymously:', error);
      setErrorMsg('حدث خطأ أثناء الدخول كضيف');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="p-8 bg-white dark:bg-slate-800 rounded-lg shadow-md text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4 text-slate-900 dark:text-white">مرحباً بك في Joe Word</h1>
        <p className="mb-4 text-slate-600 dark:text-slate-300">قم بتسجيل الدخول للبدء (يعمل داخل التطبيق)</p>

        {errorMsg && (
          <div className="bg-red-50 text-red-600 text-sm p-3 mb-4 rounded-md border border-red-200 text-right">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="mb-4 flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="البريد الإلكتروني"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-right dark:text-white"
            dir="ltr"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="كلمة المرور"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-transparent text-right dark:text-white"
            dir="ltr"
            minLength={6}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'جاري التحميل...' : isLogin ? 'تسجيل الدخول' : 'إنشاء حساب'}
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary-600 hover:underline mt-1"
          >
            {isLogin ? 'ليس لديك حساب؟ أنشئ حساباً جديداً' : 'لديك حساب بالفعل؟ سجل دخولك'}
          </button>
        </form>

        <div className="relative flex items-center py-2 mb-4">
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
          <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">أو</span>
          <div className="flex-grow border-t border-slate-300 dark:border-slate-600"></div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleSignIn}
            disabled={loading}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
          >
            تسجيل الدخول باستخدام Google (للمتصفح)
          </button>

          <button
            onClick={handleAnonymousSignIn}
            disabled={loading}
            className="w-full px-4 py-2 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-white rounded hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
             الدخول كضيف (بدون حساب)
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
