
import React, { useState, useCallback, useRef } from 'react';
import { 
  ShieldAlert, MessageSquare, Image as ImageIcon, X, 
  ArrowLeft, Volume2, Info, Loader2, CheckCircle2,
  AlertTriangle, Shield, ChevronDown, ChevronUp, Mic, Heart, Languages, Square
} from 'lucide-react';
import { Verdict, AnalysisResult, Language } from './types';
import { analyzeMessage } from './services/geminiService';
import { validateImageData } from './utils/security';

const LOCALE_MAP: Record<Language, string> = {
  en: 'en-US',
  es: 'es-ES',
  fr: 'fr-FR',
  ar: 'ar-SA'
};

const translations = {
  en: {
    guardian: "Safe Digital Guardian",
    startOver: "Start Over",
    hello: "Hello! Let's check for tricks.",
    strangeMsg: "Did you get a message that feels strange? I'm here to help.",
    copyPaste: "Copy and Paste",
    textEmail: "For text messages or emails",
    checkPic: "Check a Picture",
    photos: "For photos or screenshots",
    readAloud: "Read it Aloud",
    speakToMe: "Just speak the message to me",
    doingRight: "You are doing the right thing. Scammers are clever, but we are cleverer together.",
    pasteMsg: "Paste the message:",
    typeHere: "Type or paste the message here...",
    startCheck: "Start the Check",
    checking: "Checking...",
    pickPhoto: "Pick the photo:",
    tapPhoto: "Tap here to pick a photo",
    checkThisPhoto: "Check this photo",
    readToMe: "Read it to me:",
    speakMessage: "Tap the microphone and read the message out loud.",
    heard: "I heard you say:",
    analyzeSaid: "Analyze what I said",
    safeTitle: "This looks safe",
    safeSubtitle: "You can relax. We didn't find signs of a trick.",
    carefulTitle: "Be careful",
    carefulSubtitle: "Something feels strange. It might be a trick to rush you.",
    scamTitle: "This is a trick",
    scamSubtitle: "Do not reply or click anything. A scammer is trying to fool you.",
    whatToDo: "WHAT YOU SHOULD DO",
    whyThink: "Why we think this",
    guardianAnalysis: "Guardian's Analysis",
    listen: "Read Aloud",
    whatNoticed: "WHAT WE NOTICED",
    checkAnother: "Check Another Message",
    footerText: "You did the right thing by checking. If you're still worried, please call someone you trust or your bank directly.",
    privacy: "Privacy First",
    zeroTrust: "Zero Trust",
    free: "Always Free",
    listening: "Listening now...",
    stop: "Stop",
    interim: "Processing speech...",
    speakClear: "Speak clearly and take your time."
  },
  es: {
    guardian: "Guardián Digital Seguro",
    startOver: "Reiniciar",
    hello: "¡Hola! Busquemos trucos.",
    strangeMsg: "¿Recibiste un mensaje que te parece extraño? Estoy aquí para ayudar.",
    copyPaste: "Copiar y Pegar",
    textEmail: "Para mensajes de texto o correos",
    checkPic: "Revisar una Foto",
    photos: "Para fotos o capturas de pantalla",
    readAloud: "Leer en Voz Alta",
    speakToMe: "Solo dime el mensaje",
    doingRight: "Estás haciendo lo correcto. Los estafadores son astutos, pero juntos somos más inteligentes.",
    pasteMsg: "Pega el mensaje:",
    typeHere: "Escribe o pega el mensaje aquí...",
    startCheck: "Iniciar Revisión",
    checking: "Revisando...",
    pickPhoto: "Elige la foto:",
    tapPhoto: "Toca aquí para elegir una foto",
    checkThisPhoto: "Revisar esta foto",
    readToMe: "Léemelo:",
    speakMessage: "Toca el micrófono y lee el mensaje en voz alta.",
    heard: "Escuché que dijiste:",
    analyzeSaid: "Analizar lo que dije",
    safeTitle: "Parece seguro",
    safeSubtitle: "Puedes relajarte. No encontramos señales de trucos.",
    carefulTitle: "Ten cuidado",
    carefulSubtitle: "Algo parece extraño. Podría ser un truco para apresurarte.",
    scamTitle: "Esto es un truco",
    scamSubtitle: "No respondas ni hagas clic. Un estafador intenta engañarte.",
    whatToDo: "QUÉ DEBES HACER",
    whyThink: "Por qué pensamos esto",
    guardianAnalysis: "Análisis del Guardián",
    listen: "Escuchar",
    whatNoticed: "LO QUE NOTAMOS",
    checkAnother: "Revisar Otro Mensaje",
    footerText: "Hiciste lo correcto al revisar. Si aún tienes dudas, llama a alguien de confianza o a tu banco directamente.",
    privacy: "Privacidad Primero",
    zeroTrust: "Confianza Cero",
    free: "Siempre Gratis",
    listening: "Escuchando...",
    stop: "Detener",
    interim: "Procesando voz...",
    speakClear: "Habla con claridad y tómate tu tiempo."
  },
  fr: {
    guardian: "Gardien Numérique Sûr",
    startOver: "Recommencer",
    hello: "Bonjour ! Cherchons les pièges.",
    strangeMsg: "Avez-vous reçu un message étrange ? Je suis là pour vous aider.",
    copyPaste: "Copier et Coller",
    textEmail: "Pour SMS ou e-mails",
    checkPic: "Vérifier une Photo",
    photos: "Pour photos ou captures d'écran",
    readAloud: "Lire à Voix Haute",
    speakToMe: "Dites-moi simplement le message",
    doingRight: "Vous faites ce qu'il faut. Les arnaqueurs sont malins, mais nous le sommes plus ensemble.",
    pasteMsg: "Collez le message :",
    typeHere: "Tapez ou collez le message ici...",
    startCheck: "Lancer la Vérification",
    checking: "Vérification...",
    pickPhoto: "Choisissez la photo :",
    tapPhoto: "Appuyez ici pour choisir une photo",
    checkThisPhoto: "Vérifier cette photo",
    readToMe: "Lisez-moi le message :",
    speakMessage: "Appuyez sur le micro et lisez le message à haute voix.",
    heard: "J'ai entendu :",
    analyzeSaid: "Analyser mes paroles",
    safeTitle: "Cela semble sûr",
    safeSubtitle: "Vous pouvez vous détendre. Aucun signe de piège trouvé.",
    carefulTitle: "Soyez prudent",
    carefulSubtitle: "Quelque chose est étrange. C'est peut-être un piège pour vous presser.",
    scamTitle: "C'est un piège",
    scamSubtitle: "Ne répondez pas et ne cliquez pas. Un arnaqueur tente de vous tromper.",
    whatToDo: "CE QUE VOUS DEVEZ FAIRE",
    whyThink: "Pourquoi nous pensons cela",
    guardianAnalysis: "Analyse du Gardien",
    listen: "Écouter",
    whatNoticed: "CE QUE NOUS AVONS REMARQUÉ",
    checkAnother: "Vérifier un Autre Message",
    footerText: "Vous avez bien fait de vérifier. Si vous êtes inquiet, appelez un proche ou votre banque.",
    privacy: "Confidentialité d'abord",
    zeroTrust: "Zéro Confiance",
    free: "Toujours Gratuit",
    listening: "Écoute en cours...",
    stop: "Arrêter",
    interim: "Traitement de la voix...",
    speakClear: "Parlez clairement et prenez votre temps."
  },
  ar: {
    guardian: "الحارس الرقمي الآمن",
    startOver: "البدء من جديد",
    hello: "مرحباً! دعنا نبحث عن الخدع.",
    strangeMsg: "هل وصلتك رسالة تبدو غريبة؟ أنا هنا للمساعدة.",
    copyPaste: "نسخ ولصق",
    textEmail: "للرسائل النصية أو البريد الإلكتروني",
    checkPic: "فحص صورة",
    photos: "للصور أو لقطات الشاشة",
    readAloud: "القراءة بصوت عالٍ",
    speakToMe: "فقط اقرأ لي الرسالة",
    doingRight: "أنت تفعل الشيء الصحيح. المحتالون أذكياء، لكننا أذكى معاً.",
    pasteMsg: "الصق الرسالة:",
    typeHere: "اكتب أو الصق الرسالة هنا...",
    startCheck: "بدء الفحص",
    checking: "جاري الفحص...",
    pickPhoto: "اختر الصورة:",
    tapPhoto: "اضغط هنا لاختيار صورة",
    checkThisPhoto: "فحص هذه الصورة",
    readToMe: "اقرأ لي:",
    speakMessage: "اضغط على الميكروفون واقرأ الرسالة بصوت عالٍ.",
    heard: "سمعتك تقول:",
    analyzeSaid: "تحليل ما قلته",
    safeTitle: "يبدو آمناً",
    safeSubtitle: "يمكنك الاسترخاء. لم نجد علامات على وجود خدعة.",
    carefulTitle: "كن حذراً",
    carefulSubtitle: "هناك شيء غريب. قد تكون خدعة لاستعجالك.",
    scamTitle: "هذه خدعة",
    scamSubtitle: "لا ترد ولا تضغط على أي شيء. هناك محتال يحاول خداعك.",
    whatToDo: "ما يجب عليك فعله",
    whyThink: "لماذا نعتقد ذلك",
    guardianAnalysis: "تحليل الحارس",
    listen: "استماع",
    whatNoticed: "ما لاحظناه",
    checkAnother: "فحص رسالة أخرى",
    footerText: "لقد فعلت الشيء الصحيح بالفحص. إذا كنت لا تزال قلقاً، يرجى الاتصال بشخص تثق به أو بمصرفك مباشرة.",
    privacy: "الخصوصية أولاً",
    zeroTrust: "ثقة معدومة",
    free: "مجاني دائماً",
    listening: "جاري الاستماع الآن...",
    stop: "إيقاف",
    interim: "معالجة الكلام...",
    speakClear: "تحدث بوضوح وتمهل."
  }
};

const App: React.FC = () => {
  const [lang, setLang] = useState<Language>('en');
  const [inputText, setInputText] = useState('');
  const [imageFile, setImageFile] = useState<string | null>(null);
  const [currentResult, setCurrentResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [step, setStep] = useState<'home' | 'input-text' | 'input-image' | 'voice' | 'result'>('home');
  const [showDetails, setShowDetails] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [interimText, setInterimText] = useState('');
  
  const recognitionRef = useRef<any>(null);

  const t = translations[lang];
  const isRTL = lang === 'ar';

  const readAloud = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LOCALE_MAP[lang];
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [lang]);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Voice input is not supported here.");
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    // Dynamically set the recognition language based on current state
    recognition.lang = LOCALE_MAP[lang];
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
      setInterimText('');
      setVoiceText('');
    };
    
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) {
        setVoiceText(prev => prev + ' ' + final);
        setInputText(prev => prev + ' ' + final);
      }
      setInterimText(interim);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleStartCheck = async (contentOverride?: string, isImg: boolean = false) => {
    const finalContent = contentOverride || (isImg ? imageFile : (step === 'voice' ? voiceText : inputText));
    if (!finalContent) return;

    setIsAnalyzing(true);
    setShowDetails(false);
    try {
      const result = await analyzeMessage(finalContent, isImg, lang);
      setCurrentResult(result);
      setStep('result');
      
      const summary = result.verdict === Verdict.SAFE ? t.safeSubtitle : 
                      result.verdict === Verdict.SCAM ? t.scamSubtitle :
                      t.carefulSubtitle;
      readAloud(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const reset = () => {
    setInputText('');
    setVoiceText('');
    setInterimText('');
    setImageFile(null);
    setCurrentResult(null);
    setStep('home');
    setShowDetails(false);
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis.cancel();
  };

  const getVerdictUI = (verdict: Verdict) => {
    switch (verdict) {
      case Verdict.SAFE: return {
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        shadow: 'safe-shadow',
        icon: <CheckCircle2 className="w-24 h-24 text-emerald-400" />,
        title: t.safeTitle,
        subtitle: t.safeSubtitle
      };
      case Verdict.SUSPICIOUS: return {
        color: 'text-amber-400',
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        shadow: 'caution-shadow',
        icon: <AlertTriangle className="w-24 h-24 text-amber-400" />,
        title: t.carefulTitle,
        subtitle: t.carefulSubtitle
      };
      case Verdict.SCAM: return {
        color: 'text-rose-400',
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        shadow: 'scam-shadow',
        icon: <ShieldAlert className="w-24 h-24 text-rose-400" />,
        title: t.scamTitle,
        subtitle: t.scamSubtitle
      };
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center p-6 md:p-12 max-w-2xl mx-auto w-full transition-all`} dir={isRTL ? 'rtl' : 'ltr'}>
      <header className="w-full flex flex-col sm:flex-row justify-between items-center mb-10 gap-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-wider uppercase leading-none">SCAMSHIELD PRO</h1>
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 block">{t.guardian}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="bg-slate-800 p-1.5 rounded-full flex gap-1 border border-slate-700">
            {(['en', 'es', 'fr', 'ar'] as Language[]).map((l) => (
              <button
                key={l}
                onClick={() => { 
                  setLang(l); 
                  if (step === 'voice') stopListening(); 
                }}
                className={`w-8 h-8 rounded-full text-[10px] font-black uppercase transition-all ${lang === l ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                {l}
              </button>
            ))}
          </div>

          {step !== 'home' && (
            <button onClick={reset} className="flex items-center gap-2 text-slate-400 font-bold hover:text-white transition-all text-sm uppercase tracking-widest px-4 py-2 rounded-full bg-white/5">
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} /> {t.startOver}
            </button>
          )}
        </div>
      </header>

      <main className="w-full flex-1 flex flex-col">
        {step === 'home' && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-8 duration-500">
            <div className="mb-10 text-center">
              <h2 className="text-4xl md:text-5xl font-black mb-5 leading-[1.1]">{t.hello}</h2>
              <p className="text-slate-400 text-xl font-medium px-4">{t.strangeMsg}</p>
            </div>
            
            <button onClick={() => setStep('input-text')} className="btn-massive w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-[2.5rem] flex items-center px-10 gap-8 text-left transition-all active:scale-95 shadow-xl">
              <MessageSquare className="w-10 h-10 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-2xl">{t.copyPaste}</span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.textEmail}</span>
              </div>
            </button>

            <button onClick={() => setStep('input-image')} className="btn-massive w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-[2.5rem] flex items-center px-10 gap-8 text-left transition-all active:scale-95 shadow-xl">
              <ImageIcon className="w-10 h-10 text-amber-400" />
              <div className="flex flex-col">
                <span className="text-2xl">{t.checkPic}</span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.photos}</span>
              </div>
            </button>

            <button onClick={() => setStep('voice')} className="btn-massive w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-[2.5rem] flex items-center px-10 gap-8 text-left transition-all active:scale-95 shadow-xl">
              <Mic className="w-10 h-10 text-emerald-400" />
              <div className="flex flex-col">
                <span className="text-2xl">{t.readAloud}</span>
                <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{t.speakToMe}</span>
              </div>
            </button>

            <div className="mt-12 p-8 bg-indigo-600/5 border border-indigo-500/20 rounded-[2.5rem] flex gap-5 items-center">
               <Heart className="w-8 h-8 text-indigo-400 flex-shrink-0" />
               <p className="text-lg text-indigo-100/80 leading-snug font-medium italic">
                 "{t.doingRight}"
               </p>
            </div>
          </div>
        )}

        {(step === 'input-text' || step === 'input-image' || step === 'voice') && (
          <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <h2 className="text-3xl font-black mb-2 px-2">
              {step === 'input-text' ? t.pasteMsg : step === 'input-image' ? t.pickPhoto : t.readToMe}
            </h2>
            
            {step === 'input-text' && (
              <textarea autoFocus value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t.typeHere} className="w-full h-80 bg-slate-900 border-2 border-slate-800 rounded-[3rem] p-10 text-2xl outline-none focus:border-indigo-500 transition-all placeholder:text-slate-800 resize-none shadow-2xl" />
            )}

            {step === 'input-image' && (
              <div className="relative group">
                {!imageFile ? (
                  <label className="w-full h-[450px] bg-slate-900 border-4 border-dashed border-slate-800 rounded-[3rem] flex flex-col items-center justify-center gap-6 cursor-pointer hover:bg-slate-800 transition-all">
                    <div className="p-8 bg-slate-800 rounded-full text-slate-500 shadow-xl"><ImageIcon className="w-16 h-16" /></div>
                    <span className="text-slate-500 text-xl font-bold">{t.tapPhoto}</span>
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) {
                        const r = new FileReader();
                        r.onload = () => { if (validateImageData(r.result as string)) setImageFile(r.result as string); };
                        r.readAsDataURL(f);
                      }
                    }} />
                  </label>
                ) : (
                  <div className="relative w-full h-[450px] rounded-[3rem] overflow-hidden border-2 border-slate-800 bg-black/60 shadow-2xl">
                    <img src={imageFile} alt="Check this" className="w-full h-full object-contain" />
                    <button onClick={() => setImageFile(null)} className="absolute top-6 right-6 p-5 bg-rose-500 text-white rounded-[1.5rem] shadow-2xl active:scale-90 transition-all"><X className="w-8 h-8" /></button>
                  </div>
                )}
              </div>
            )}

            {step === 'voice' && (
              <div className="flex flex-col items-center gap-8 py-6">
                <p className="text-xl font-bold text-center text-slate-400">{t.speakClear}</p>
                
                <div className="relative">
                  {isListening && (
                    <div className="absolute inset-0 bg-rose-500/20 rounded-full animate-ping scale-125" />
                  )}
                  <button 
                    onClick={isListening ? stopListening : startListening} 
                    className={`relative w-48 h-48 rounded-full flex flex-col items-center justify-center transition-all shadow-2xl z-10 ${isListening ? 'bg-rose-500 shadow-rose-500/40' : 'bg-emerald-600 hover:scale-105 active:scale-95 shadow-emerald-600/30'}`}
                  >
                    {isListening ? (
                      <>
                        <Square className="w-16 h-16 text-white mb-2" />
                        <span className="text-xs font-black uppercase text-white/80">{t.stop}</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-20 h-20 text-white mb-2" />
                        <span className="text-xs font-black uppercase text-white/80">{t.readAloud}</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="w-full space-y-4">
                  {(voiceText || interimText) ? (
                    <div className="w-full p-8 bg-slate-900 border-2 border-slate-800 rounded-[3rem] animate-in slide-in-from-bottom-4 shadow-xl">
                      <div className="flex justify-between items-center mb-4">
                         <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t.heard}</p>
                         {isListening && <span className="flex items-center gap-2 text-rose-400 text-[10px] font-black uppercase animate-pulse"><div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> {t.listening}</span>}
                      </div>
                      <p className="text-2xl font-bold text-slate-100 italic leading-snug break-words">
                        {voiceText}
                        <span className="text-slate-500 opacity-60"> {interimText}</span>
                      </p>
                    </div>
                  ) : isListening && (
                    <div className="text-center text-slate-500 font-bold italic animate-pulse">
                      {t.listening}
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              disabled={isAnalyzing || isListening || (step === 'input-text' ? !inputText.trim() : step === 'input-image' ? !imageFile : !voiceText)}
              onClick={() => handleStartCheck(undefined, step === 'input-image')}
              className="btn-massive w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-[3rem] shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 active:scale-95 transition-all mt-6"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-10 h-10 animate-spin" />
                  <span className="text-2xl">{t.checking}</span>
                </>
              ) : (
                <span className="text-2xl">{step === 'voice' ? t.analyzeSaid : t.startCheck}</span>
              )}
            </button>
          </div>
        )}

        {step === 'result' && currentResult && (
          <div className="flex flex-col gap-8 animate-in zoom-in duration-500">
            {(() => {
              const ui = getVerdictUI(currentResult.verdict);
              return (
                <div className={`w-full overflow-hidden rounded-[4rem] border-4 ${ui.border} ${ui.bg} ${ui.shadow} flex flex-col`}>
                  <div className="p-12 flex flex-col items-center text-center">
                    <div className="mb-8 scale-110 drop-shadow-2xl">{ui.icon}</div>
                    <h2 className={`text-5xl font-black mb-4 ${ui.color}`}>{ui.title}</h2>
                    <p className="text-white text-2xl font-bold mb-10 max-w-sm leading-tight">{ui.subtitle}</p>
                    
                    <div className="w-full h-0.5 bg-white/10 mb-10" />
                    
                    <div className="w-full text-left">
                      <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] mb-6">{t.whatToDo}</h3>
                      <div className="space-y-4">
                         {currentResult.advice.split('\n').filter(l => l.trim()).map((line, i) => (
                           <div key={i} className="flex items-center gap-6 p-7 bg-black/40 rounded-[2.5rem] border border-white/5 shadow-inner">
                             <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-black text-2xl flex-shrink-0">
                               {i + 1}
                             </div>
                             <p className="text-2xl font-bold text-white leading-tight">{line.replace(/^[•\-\d.]\s*/, '')}</p>
                           </div>
                         ))}
                      </div>
                    </div>

                    <div className="w-full mt-10 pt-6 border-t border-white/10">
                      <button onClick={() => setShowDetails(!showDetails)} className="w-full flex items-center justify-between p-6 hover:bg-white/5 rounded-[2rem] transition-all">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{t.whyThink}</span>
                        {showDetails ? <ChevronUp className="w-6 h-6 text-slate-500" /> : <ChevronDown className="w-6 h-6 text-slate-500" />}
                      </button>

                      {showDetails && (
                        <div className="text-left mt-6 p-10 bg-black/60 rounded-[3rem] border border-white/5 animate-in slide-in-from-top-6">
                          <div className="flex justify-between items-center mb-6">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">{t.guardianAnalysis}</h4>
                            <button onClick={() => readAloud(currentResult.reasoning)} className="flex items-center gap-3 px-6 py-3 bg-indigo-500/10 text-indigo-400 rounded-full hover:bg-indigo-500/20 transition-all text-sm font-black">
                              <Volume2 className="w-6 h-6" /> {t.listen}
                            </button>
                          </div>
                          <p className="text-2xl font-medium leading-relaxed text-slate-100 mb-8 italic">"{currentResult.reasoning}"</p>
                          {currentResult.indicators && currentResult.indicators.length > 0 && (
                            <div className="pt-8 border-t border-white/10">
                              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-4">{t.whatNoticed}</h4>
                              <div className="flex flex-wrap gap-4">
                                {currentResult.indicators.map((ind, i) => (
                                  <span key={i} className="px-6 py-2.5 bg-slate-800 text-slate-200 rounded-full text-sm font-bold border border-white/5">{ind}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <button onClick={reset} className="w-full bg-slate-100 text-slate-900 font-black text-2xl h-32 hover:bg-white transition-all active:bg-slate-300">{t.checkAnother}</button>
                </div>
              );
            })()}
          </div>
        )}
      </main>

      <footer className="mt-16 text-center text-slate-600 text-sm font-bold space-y-8 pb-10 max-w-md">
        <p className="px-6">{t.footerText}</p>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-40">
           <span>{t.privacy}</span>
           <div className="w-1 h-1 rounded-full bg-slate-800 hidden sm:block"></div>
           <span>{t.zeroTrust}</span>
           <div className="w-1 h-1 rounded-full bg-slate-800 hidden sm:block"></div>
           <span>{t.free}</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
