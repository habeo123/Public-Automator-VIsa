import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ChevronRight, 
  Contact as IdCard, 
  User, 
  FileCheck, 
  Stethoscope, 
  Plane,
  Trash2,
  Users,
  FileWarning,
  CheckCircle,
  LayoutDashboard,
  Search,
  LogOut,
  Settings,
  Plus,
  Filter,
  ArrowRight,
  ShieldCheck,
  Briefcase,
  Globe,
  Stamp,
  Calendar,
  Building2,
  Edit,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from './lib/utils';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User as FirebaseUser
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase';

// --- Types ---

type VisaType = 
  | 'Employment' 
  | 'Business Visit' 
  | 'Tourist' 
  | 'Family Visit' 
  | 'Residence' 
  | 'Student' 
  | 'Government Visit' 
  | 'Personal Visit'
  | 'Unknown';

type DocumentType = 
  | 'Passport' 
  | 'Visa Application Form' 
  | 'Personal Photo' 
  | 'Medical Report' 
  | 'Invitation Letter' 
  | 'Employment Letter' 
  | 'Flight/Hotel Booking' 
  | 'Employment Contract'
  | 'University Degree/Diploma'
  | 'Criminal Record'
  | 'Resident Permit'
  | 'Business Registration'
  | 'Bank Statement'
  | 'Scholarship Notice'
  | 'Birth Certificate'
  | 'Diploma/Transcript'
  | 'Sponsor Iqama'
  | 'Relationship Document'
  | 'Government Letter'
  | 'Unknown';

interface AnalyzedDocument {
  id: string;
  clientId: string;
  fileName: string;
  type: DocumentType;
  confidence: number;
  extractedInfo: Record<string, string>;
  previewUrl?: string;
  uploadedAt: any;
  uploadedBy: string;
}

interface ClientProfile {
  id: string;
  name: string;
  normalizedName: string;
  visaType: VisaType;
  status: 'incomplete' | 'ready' | 'submitted';
  lastUpdated: any;
  createdBy: string;
  email?: string;
  phone?: string;
  assignedTo?: string; // UID of the employee
  documents?: AnalyzedDocument[];
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'owner' | 'employee';
  createdAt: any;
  notificationsEnabled?: boolean;
  phone?: string;
  address?: string;
}

type View = 'dashboard' | 'clients' | 'upload' | 'settings' | 'team';

// --- Constants ---

const VISA_REQUIREMENTS: Record<VisaType, string[]> = {
  'Employment': ['Passport', 'Resident Permit', 'Visa Application Form', 'Employment Contract', 'University Degree/Diploma', 'Medical Report', 'Criminal Record'],
  'Business Visit': ['Passport', 'Resident Permit', 'Invitation Letter', 'Employment Letter', 'Business Registration'],
  'Tourist': ['Passport', 'Resident Permit', 'Flight/Hotel Booking', 'Bank Statement'],
  'Family Visit': ['Passport', 'Resident Permit', 'Visa Application Form', 'Relationship Document'],
  'Residence': ['Passport', 'Visa Application Form', 'Resident Permit', 'Relationship Document', 'Sponsor Iqama', 'Medical Report', 'Criminal Record'],
  'Student': ['Scholarship Notice', 'Visa Application Form', 'Passport', 'Birth Certificate', 'Diploma/Transcript', 'Medical Report', 'Criminal Record'],
  'Government Visit': ['Passport', 'Visa Application Form', 'Government Letter'],
  'Personal Visit': ['Passport', 'Invitation Letter', 'Resident Permit'],
  'Unknown': []
};

// --- Translations ---

type Language = 'en' | 'vi';

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    clients: 'Client Database',
    upload: 'Upload Center',
    settings: 'Settings',
    welcome: 'Welcome back',
    totalClients: 'Total Clients',
    readyToSubmit: 'Ready to Submit',
    incomplete: 'Incomplete',
    recentActivity: 'Recent Activity',
    searchPlaceholder: 'Search clients...',
    dropFolder: 'Drop Customer Folder',
    dropToProcess: 'Drop to Process',
    aiProcessing: 'AI will automatically identify the customer, sort documents, and update their persistent profile.',
    analyzing: 'AI is analyzing your documents...',
    signOut: 'Sign Out',
    enterprise: 'Enterprise v2.0',
    teamManagement: 'Team Management',
    accountSettings: 'Account Settings',
    currentRole: 'Current Role',
    notifications: 'Email Notifications',
    newClientAlerts: 'New Client Uploads',
    personalInfo: 'Personal Information',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    displayName: 'Display Name',
    assignedTo: 'Assigned To',
    unassigned: 'Unassigned',
    save: 'Save',
    edit: 'Edit',
    cancel: 'Cancel',
    uploadBy: 'Uploaded by',
    visaType: 'Visa Type',
    status: 'Status',
    lastUpdated: 'Last Updated',
    ready: 'Ready',
    submitted: 'Submitted',
    noClients: 'No clients found.',
    selectEmployee: 'Select Employee',
    activity: 'Activity',
    you: 'You',
    members: 'Team Members',
    workManagement: 'Work Management',
    workload: 'Workload Overview',
    assignedClients: 'Assigned Clients',
    performance: 'Performance',
    legalization: 'Legalization',
    globalVisas: 'Global Visas',
    planning: 'Visa Planning',
    services: 'Our Services'
  },
  vi: {
    dashboard: 'Bảng điều khiển',
    clients: 'Cơ sở dữ liệu khách hàng',
    upload: 'Trung tâm tải lên',
    settings: 'Cài đặt',
    welcome: 'Chào mừng trở lại',
    totalClients: 'Tổng số khách hàng',
    readyToSubmit: 'Sẵn sàng nộp',
    incomplete: 'Chưa hoàn thiện',
    recentActivity: 'Hoạt động gần đây',
    searchPlaceholder: 'Tìm kiếm khách hàng...',
    dropFolder: 'Thả thư mục khách hàng',
    dropToProcess: 'Thả để xử lý',
    aiProcessing: 'AI sẽ tự động nhận diện khách hàng, phân loại tài liệu và cập nhật hồ sơ.',
    analyzing: 'AI đang phân tích tài liệu của bạn...',
    signOut: 'Đăng xuất',
    enterprise: 'Doanh nghiệp v2.0',
    teamManagement: 'Quản lý nhóm',
    accountSettings: 'Cài đặt tài khoản',
    currentRole: 'Vai trò hiện tại',
    notifications: 'Thông báo Email',
    newClientAlerts: 'Tải lên khách hàng mới',
    personalInfo: 'Thông tin cá nhân',
    email: 'Email',
    phone: 'Số điện thoại',
    address: 'Địa chỉ',
    displayName: 'Tên hiển thị',
    assignedTo: 'Người phụ trách',
    unassigned: 'Chưa phân công',
    save: 'Lưu',
    edit: 'Sửa',
    cancel: 'Hủy',
    uploadBy: 'Tải lên bởi',
    visaType: 'Loại Visa',
    status: 'Trạng thái',
    lastUpdated: 'Cập nhật cuối',
    ready: 'Sẵn sàng',
    submitted: 'Đã nộp',
    noClients: 'Không tìm thấy khách hàng.',
    selectEmployee: 'Chọn nhân viên',
    activity: 'Hoạt động',
    you: 'Bạn',
    members: 'Thành viên nhóm',
    workManagement: 'Quản lý công việc',
    workload: 'Tổng quan khối lượng',
    assignedClients: 'Khách hàng đã phân công',
    performance: 'Hiệu suất',
    legalization: 'Hợp pháp hoá',
    globalVisas: 'Visa quốc tế',
    planning: 'Lập kế hoạch',
    services: 'Dịch vụ của chúng tôi'
  }
};

// --- Utils ---

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const normalizeName = (name: string) => {
  if (!name || name === 'UNIDENTIFIED CUSTOMER') return '';
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/\b(mr|ms|mrs|miss|dr|prof)\b/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
};

const getWords = (name: string) => normalizeName(name).split(/\s+/).filter(Boolean);

const isSamePerson = (nameA: string, nameB: string) => {
  const wordsA = getWords(nameA);
  const wordsB = getWords(nameB);
  if (wordsA.length === 0 || wordsB.length === 0) return false;
  const isSubset = wordsA.every(w => wordsB.includes(w)) || wordsB.every(w => wordsA.includes(w));
  const commonWords = wordsA.filter(w => wordsB.includes(w));
  return isSubset || commonWords.length >= 2;
};

// --- Components ---

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [language, setLanguage] = useState<Language>('en');
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const ai = useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY }), []);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setUserProfile(null);
        setIsAuthReady(true);
      }
    });
    return unsubscribe;
  }, []);

  // User Profile Listener (Real-time)
  useEffect(() => {
    if (!user) return;

    const profileRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(profileRef, async (snap) => {
      if (snap.exists()) {
        setUserProfile(snap.data() as UserProfile);
      } else {
        // Create profile if missing
        const isDefaultAdmin = user.email === 'hongha.vu298@gmail.com';
        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'User',
          role: isDefaultAdmin ? 'owner' : 'employee',
          createdAt: serverTimestamp(),
          notificationsEnabled: true
        };
        try {
          await setDoc(profileRef, newProfile);
          // snap will trigger again
        } catch (err) {
          console.error("Profile creation error:", err);
        }
      }
      setIsAuthReady(true);
    }, (err) => {
      console.error("Profile listener error:", err);
      setIsAuthReady(true);
    });

    return unsubscribe;
  }, [user]);

  // Clients Listener
  useEffect(() => {
    if (!user || !userProfile) return;

    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, orderBy('lastUpdated', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const clientsData: ClientProfile[] = [];
      snapshot.forEach((doc) => {
        clientsData.push({ id: doc.id, ...doc.data() } as ClientProfile);
      });
      setClients(clientsData);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clients');
    });

    return unsubscribe;
  }, [user, userProfile]);

  // Users Listener (for Owners)
  useEffect(() => {
    if (!user || userProfile?.role !== 'owner') {
      setUsers([]);
      return;
    }

    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const usersData: UserProfile[] = [];
      snapshot.forEach((doc) => {
        usersData.push({ ...doc.data() } as UserProfile);
      });
      setUsers(usersData);
    }, (err) => {
      // Don't throw for users list if it's just a permission thing, but we check role above
      console.error("Users fetch error:", err);
    });

    return unsubscribe;
  }, [user, userProfile]);

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError("Login failed. Please try again.");
    }
  };

  const handleLogout = () => signOut(auth);

  const handleUpdateUserRole = async (targetUid: string, newRole: 'owner' | 'employee') => {
    if (userProfile?.role !== 'owner') return;
    try {
      const userRef = doc(db, 'users', targetUid);
      await updateDoc(userRef, { role: newRole });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${targetUid}`);
    }
  };

  const analyzeFile = async (file: File): Promise<{ result: any, previewUrl: string }> => {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });

    const base64Data = await base64Promise;
    const previewUrl = URL.createObjectURL(file);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          parts: [
            {
              text: `Analyze this document for a Saudi Arabia Visa application. 
              Filename: "${file.name}"
              1. Type: Passport, Visa Application Form, Personal Photo, Medical Report, Invitation Letter, Employment Letter, Flight/Hotel Booking, Employment Contract, University Degree/Diploma, Criminal Record, Resident Permit, Business Registration, Bank Statement, Scholarship Notice, Birth Certificate, Diploma/Transcript, Sponsor Iqama, Relationship Document, Government Letter, Unknown.
              2. Name: Extract CUSTOMER NAME. Standardize to UPPERCASE without accents.
              3. Visa Type: If Application Form, identify: Employment, Business Visit, Tourist, Family Visit, Residence, Student, Government Visit, Personal Visit.
              4. Info: Extract Document Number, Expiry Date.
              5. Email: Extract customer email if present.
              6. Phone: Extract customer phone number if present.
              Return JSON.`,
            },
            { inlineData: { mimeType: file.type, data: base64Data } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            type: { type: Type.STRING },
            customerName: { type: Type.STRING },
            suggestedVisaType: { type: Type.STRING },
            confidence: { type: Type.NUMBER },
            extractedInfo: { type: Type.OBJECT },
            email: { type: Type.STRING },
            phone: { type: Type.STRING }
          },
          required: ["type", "customerName", "confidence"]
        }
      }
    });

    return { result: JSON.parse(response.text || '{}'), previewUrl };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return;
    setIsAnalyzing(true);
    setError(null);

    try {
      for (const file of acceptedFiles) {
        const { result, previewUrl } = await analyzeFile(file);
        const name = result.customerName || 'Unidentified Customer';
        const normalized = normalizeName(name);

        // Find existing client or create new
        let client = clients.find(c => isSamePerson(c.name, name));
        let clientId = client?.id;

        if (!clientId) {
          const newClientRef = doc(collection(db, 'clients'));
          clientId = newClientRef.id;
          try {
            await setDoc(newClientRef, {
              id: clientId,
              name: name.toUpperCase(),
              normalizedName: normalized,
              visaType: (result.suggestedVisaType as VisaType) || 'Unknown',
              status: 'incomplete',
              lastUpdated: serverTimestamp(),
              createdBy: user.uid,
              email: result.email || '',
              phone: result.phone || ''
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.CREATE, `clients/${clientId}`);
          }
        } else {
          try {
            await updateDoc(doc(db, 'clients', clientId), {
              lastUpdated: serverTimestamp()
            });
          } catch (err) {
            handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}`);
          }
        }

        // Add document
        const docRef = doc(collection(db, `clients/${clientId}/documents`));
        try {
          await setDoc(docRef, {
            id: docRef.id,
            clientId,
            fileName: file.name,
            type: result.type || 'Unknown',
            confidence: result.confidence || 0,
            extractedInfo: result.extractedInfo || {},
            uploadedAt: serverTimestamp(),
            uploadedBy: user.uid
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `clients/${clientId}/documents/${docRef.id}`);
        }
      }
      setCurrentView('clients');
    } catch (err) {
      console.error(err);
      setError("Analysis or database error.");
    } finally {
      setIsAnalyzing(false);
    }
  }, [user, clients, ai]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop } as any);

  const t = TRANSLATIONS[language];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <Loader2 className="w-10 h-10 animate-spin text-[#006C35]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl shadow-[#006C35]/10 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-[#006C35] rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-[#006C35]/20">
            <Globe className="text-white w-10 h-10" />
          </div>
          <h1 className="text-3xl font-black mb-2 tracking-tight">TCS</h1>
          <p className="text-sm font-black text-[#006C35] uppercase tracking-[0.2em] mb-6">Tashira Consultancy Service</p>
          <p className="text-gray-500 mb-10 leading-relaxed text-sm">
            Internal document management and AI-powered sorting for Saudi Arabia Visa processing.
          </p>
          <button 
            onClick={handleLogin}
            className="w-full bg-[#006C35] text-white py-4 rounded-2xl font-bold text-lg hover:bg-[#005228] transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3"
          >
            <img src="https://www.gstatic.com/firebase/static/bin/urls/google.svg" className="w-6 h-6 bg-white p-1 rounded-full" alt="Google" />
            Sign in with Google
          </button>
          <p className="mt-8 text-xs text-gray-400 font-medium uppercase tracking-widest">Secure Team Access Only</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-200 flex flex-col sticky top-0 h-screen">
        <div className="p-8 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#006C35] rounded-xl flex items-center justify-center shadow-lg shadow-[#006C35]/20">
                <Globe className="text-white w-6 h-6" />
              </div>
              <div>
                <h2 className="font-black text-lg tracking-tight">TCS</h2>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">TASHIRA</p>
              </div>
            </div>
            <button 
              onClick={() => setLanguage(l => l === 'en' ? 'vi' : 'en')}
              className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] font-black hover:bg-gray-100 transition-colors border border-gray-200"
            >
              {language.toUpperCase()}
            </button>
          </div>

          <nav className="space-y-2">
            <SidebarLink 
              icon={<Globe size={20} />} 
              label={t.dashboard} 
              active={currentView === 'dashboard'} 
              onClick={() => setCurrentView('dashboard')} 
            />
            <SidebarLink 
              icon={<Users size={20} />} 
              label={t.clients} 
              active={currentView === 'clients'} 
              onClick={() => setCurrentView('clients')} 
            />
            {userProfile?.role === 'owner' && (
              <SidebarLink 
                icon={<Briefcase size={20} />} 
                label={t.workManagement} 
                active={currentView === 'team'} 
                onClick={() => setCurrentView('team')} 
              />
            )}
            <SidebarLink 
              icon={<Upload size={20} />} 
              label={t.upload} 
              active={currentView === 'upload'} 
              onClick={() => setCurrentView('upload')} 
            />
            <SidebarLink 
              icon={<Settings size={20} />} 
              label={t.settings} 
              active={currentView === 'settings'} 
              onClick={() => setCurrentView('settings')} 
            />
          </nav>
        </div>

        <div className="p-8 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-6">
            <img src={user.photoURL || ''} className="w-10 h-10 rounded-full border-2 border-[#006C35]/20" alt="Profile" />
            <div className="min-w-0">
              <p className="font-bold text-sm truncate">{user.displayName}</p>
              <p className="text-[10px] font-bold text-[#006C35] uppercase tracking-widest">{userProfile?.role === 'owner' ? 'Owner' : 'Employee'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 text-gray-400 font-bold text-sm hover:text-red-600 transition-colors"
          >
            <LogOut size={18} />
            {t.signOut}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black tracking-tight capitalize">{t[currentView as keyof typeof t]}</h1>
            <p className="text-gray-500 mt-1">{t.welcome}, {user.displayName?.split(' ')[0]}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder={t.searchPlaceholder} 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border border-gray-200 rounded-2xl py-3 pl-12 pr-6 w-80 focus:outline-none focus:ring-2 focus:ring-[#006C35]/20 focus:border-[#006C35] transition-all shadow-sm"
              />
            </div>
            <button 
              onClick={() => setCurrentView('upload')}
              className="bg-[#006C35] text-white p-3 rounded-2xl shadow-lg shadow-[#006C35]/20 hover:scale-105 transition-all active:scale-95"
            >
              <Plus size={24} />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {currentView === 'dashboard' && (
            <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <Dashboard clients={clients} userProfile={userProfile} language={language} />
            </motion.div>
          )}
          {currentView === 'clients' && (
            <motion.div key="clients" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <ClientList clients={clients} searchQuery={searchQuery} language={language} users={users} userProfile={userProfile} />
            </motion.div>
          )}
          {currentView === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <UploadView 
                getRootProps={getRootProps} 
                getInputProps={getInputProps} 
                isDragActive={isDragActive} 
                isAnalyzing={isAnalyzing} 
                error={error} 
                language={language}
              />
            </motion.div>
          )}
          {currentView === 'settings' && (
            <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SettingsView userProfile={userProfile} users={users} onUpdateRole={handleUpdateUserRole} language={language} />
            </motion.div>
          )}
          {currentView === 'team' && userProfile?.role === 'owner' && (
            <motion.div key="team" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <TeamWorkloadView users={users} clients={clients} language={language} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-Views ---

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl font-bold text-sm transition-all",
        active 
          ? "bg-[#006C35] text-white shadow-lg shadow-[#006C35]/20" 
          : "text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function Dashboard({ clients, userProfile, language }: { clients: ClientProfile[], userProfile: UserProfile | null, language: Language }) {
  const t = TRANSLATIONS[language];
  const stats = useMemo(() => {
    const total = clients.length;
    const ready = clients.filter(c => c.status === 'ready').length;
    const incomplete = clients.filter(c => c.status === 'incomplete').length;
    return { total, ready, incomplete };
  }, [clients]);

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <StatCard title={t.totalClients} value={stats.total} icon={<Users className="text-blue-600" />} color="blue" />
        <StatCard title={t.readyToSubmit} value={stats.ready} icon={<CheckCircle2 className="text-green-600" />} color="green" />
        <StatCard title={t.incomplete} value={stats.incomplete} icon={<AlertCircle className="text-amber-600" />} color="amber" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <div className="bg-white rounded-[2.5rem] p-8 border border-gray-200 shadow-sm">
          <h3 className="text-xl font-black mb-6">{t.recentActivity}</h3>
          <div className="space-y-6">
            {clients.slice(0, 5).map(client => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <User size={20} className="text-[#006C35]" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{client.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{client.visaType} Visa</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-[#006C35] uppercase tracking-widest">{t[client.status as keyof typeof t] || client.status}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.lastUpdated} {client.lastUpdated?.seconds ? new Date(client.lastUpdated.seconds * 1000).toLocaleDateString() : 'Just now'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#006C35] rounded-[2.5rem] p-10 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-black mb-4">Processor Insights</h3>
            <p className="text-white/70 mb-8 leading-relaxed">
              {language === 'en' ? `You have ${stats.ready} applications ready for submission.` : `Bạn có ${stats.ready} hồ sơ đã sẵn sàng để nộp.`} 
              {userProfile?.role === 'owner' 
                ? (language === 'en' ? " Your team is currently processing " : " Nhóm của bạn đang xử lý ") 
                : (language === 'en' ? " You are currently processing " : " Bạn đang xử lý ")} 
              {stats.incomplete} {language === 'en' ? "active files." : "hồ sơ đang hoạt động."}
            </p>
            <button className="bg-white text-[#006C35] px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition-all flex items-center gap-2">
              {language === 'en' ? "Review Ready Files" : "Xem hồ sơ sẵn sàng"}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10 rotate-12">
            <FileCheck size={240} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-gray-200 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">{title}</p>
        <p className="text-4xl font-black tracking-tight">{value}</p>
      </div>
      <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center bg-opacity-10", {
        "bg-blue-500": color === 'blue',
        "bg-green-500": color === 'green',
        "bg-amber-500": color === 'amber'
      })}>
        {icon}
      </div>
    </div>
  );
}

function ClientList({ clients, searchQuery, language, users, userProfile }: { clients: ClientProfile[], searchQuery: string, language: Language, users: UserProfile[], userProfile: UserProfile | null }) {
  const t = TRANSLATIONS[language];
  const [editingClient, setEditingClient] = useState<string | null>(null);
  const [editData, setEditData] = useState({ email: '', phone: '' });

  const filtered = clients.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAssign = async (clientId: string, employeeUid: string) => {
    try {
      await updateDoc(doc(db, 'clients', clientId), {
        assignedTo: employeeUid,
        lastUpdated: serverTimestamp()
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}`);
    }
  };

  const handleSaveInfo = async (clientId: string) => {
    try {
      await updateDoc(doc(db, 'clients', clientId), {
        ...editData,
        lastUpdated: serverTimestamp()
      });
      setEditingClient(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `clients/${clientId}`);
    }
  };

  return (
    <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-sm overflow-hidden">
      <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <h3 className="text-xl font-black">{language === 'en' ? 'Active Portfolios' : 'Hồ sơ đang hoạt động'}</h3>
        <div className="flex gap-3">
          <button className="p-2.5 bg-white border border-gray-200 rounded-xl text-gray-400 hover:text-[#006C35] transition-all">
            <Filter size={20} />
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
              <th className="px-8 py-6">{language === 'en' ? 'Client Name' : 'Tên khách hàng'}</th>
              <th className="px-8 py-6">{t.personalInfo}</th>
              <th className="px-8 py-6">{t.visaType}</th>
              <th className="px-8 py-6">{t.assignedTo}</th>
              <th className="px-8 py-6">{t.status}</th>
              <th className="px-8 py-6 text-right">{language === 'en' ? 'Actions' : 'Thao tác'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-8 py-20 text-center text-gray-400 font-bold">
                  {t.noClients}
                </td>
              </tr>
            ) : (
              filtered.map(client => (
                <tr key={client.id} className="group hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#006C35]/10 rounded-xl flex items-center justify-center text-[#006C35] font-bold">
                        {client.name.charAt(0)}
                      </div>
                      <span className="font-bold text-sm">{client.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    {editingClient === client.id ? (
                      <div className="space-y-2">
                        <input 
                          type="text" 
                          placeholder={t.email}
                          value={editData.email}
                          onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                          className="text-[10px] w-full bg-white border border-gray-200 rounded-lg px-2 py-1"
                        />
                        <input 
                          type="text" 
                          placeholder={t.phone}
                          value={editData.phone}
                          onChange={(e) => setEditData(prev => ({ ...prev, phone: e.target.value }))}
                          className="text-[10px] w-full bg-white border border-gray-200 rounded-lg px-2 py-1"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleSaveInfo(client.id)} className="text-[10px] font-black text-[#006C35]">{t.save}</button>
                          <button onClick={() => setEditingClient(null)} className="text-[10px] font-black text-gray-400">{t.cancel}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[10px] font-bold text-gray-600">{client.email || t.email + '...'}</p>
                        <p className="text-[10px] text-gray-400">{client.phone || t.phone + '...'}</p>
                        <button 
                          onClick={() => {
                            setEditingClient(client.id);
                            setEditData({ email: client.email || '', phone: client.phone || '' });
                          }}
                          className="text-[10px] font-black text-[#006C35] opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t.edit}
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className="text-xs font-bold text-gray-500">{client.visaType}</span>
                  </td>
                  <td className="px-8 py-6">
                    {userProfile?.role === 'owner' ? (
                      <select 
                        value={client.assignedTo || ''}
                        onChange={(e) => handleAssign(client.id, e.target.value)}
                        className="text-[10px] font-bold bg-white border border-gray-200 rounded-lg px-2 py-1 focus:outline-none"
                      >
                        <option value="">{t.unassigned}</option>
                        {users.filter(u => u.role === 'employee').map(emp => (
                          <option key={emp.uid} value={emp.uid}>{emp.displayName}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] font-bold text-gray-500">
                        {users.find(u => u.uid === client.assignedTo)?.displayName || t.unassigned}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-6">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full",
                      client.status === 'ready' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    )}>
                      {t[client.status as keyof typeof t] || client.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="p-2 text-gray-400 hover:text-[#006C35] transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UploadView({ getRootProps, getInputProps, isDragActive, isAnalyzing, error, language }: any) {
  const t = TRANSLATIONS[language as Language];
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10 flex items-center gap-6 p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div className="w-16 h-16 bg-[#006C35]/10 rounded-2xl flex items-center justify-center text-[#006C35]">
          <Building2 size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black tracking-tight">TASHIRA {t.upload}</h3>
          <p className="text-gray-400 text-sm font-medium">{language === 'en' ? 'Official Saudi Visa Processing Center' : 'Trung tâm xử lý Visa Saudi chính thức'}</p>
        </div>
      </div>
      
      <div 
        {...getRootProps()} 
        className={cn(
          "relative group cursor-pointer rounded-[3rem] border-4 border-dashed transition-all duration-500 ease-out overflow-hidden",
          isDragActive 
            ? "border-[#006C35] bg-[#006C35]/5 scale-[0.98]" 
            : "border-gray-200 bg-white hover:border-[#006C35]/30 hover:shadow-2xl"
        )}
      >
        <input {...getInputProps()} />
        <div className="py-32 px-12 flex flex-col items-center text-center">
          <div className={cn(
            "w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 transition-all duration-500 shadow-xl",
            isDragActive ? "scale-110 rotate-12 bg-[#006C35] text-white" : "bg-gray-50 text-gray-300 group-hover:bg-[#006C35]/10 group-hover:text-[#006C35]"
          )}>
            {isAnalyzing ? <Loader2 className="w-12 h-12 animate-spin" /> : <Upload className="w-12 h-12" />}
          </div>
          <h2 className="text-3xl font-black mb-4 tracking-tight">
            {isDragActive ? t.dropToProcess : t.dropFolder}
          </h2>
          <p className="text-gray-500 max-w-md mx-auto text-lg leading-relaxed">
            {isAnalyzing ? t.analyzing : t.aiProcessing}
          </p>
        </div>
      </div>
      {error && (
        <div className="mt-8 p-6 bg-red-50 border border-red-100 rounded-3xl flex items-center gap-4 text-red-600 animate-bounce">
          <AlertCircle size={24} />
          <p className="font-bold">{error}</p>
        </div>
      )}
    </div>
  );
}

function TeamWorkloadView({ users, clients, language }: { users: UserProfile[], clients: ClientProfile[], language: Language }) {
  const t = TRANSLATIONS[language];
  
  return (
    <div className="space-y-10">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm">
        <h3 className="text-2xl font-black mb-8">{t.workload}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map(user => {
            const assignedClients = clients.filter(c => c.assignedTo === user.uid);
            const readyCount = assignedClients.filter(c => c.status === 'ready').length;
            
            return (
              <div key={user.uid} className="bg-gray-50 rounded-3xl p-6 border border-gray-100 hover:border-[#006C35]/20 transition-all group">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#006C35] font-black shadow-sm group-hover:bg-[#006C35] group-hover:text-white transition-colors">
                    {user.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{user.displayName}</p>
                    <p className="text-[10px] font-bold text-[#006C35] uppercase tracking-widest">{user.role}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">{t.assignedClients}</span>
                    <span className="font-black text-lg">{assignedClients.length}</span>
                  </div>
                  
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-[#006C35] h-full transition-all" 
                      style={{ width: `${assignedClients.length > 0 ? (readyCount / assignedClients.length) * 100 : 0}%` }}
                    />
                  </div>
                  
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">{t.ready}: {readyCount}</span>
                    <span className="text-[#006C35]">{assignedClients.length > 0 ? Math.round((readyCount / assignedClients.length) * 100) : 0}% {t.performance}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm">
        <h3 className="text-2xl font-black mb-8">{t.recentActivity}</h3>
        <div className="space-y-4">
          {clients.slice(0, 10).map(client => (
            <div key={client.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[#006C35] shadow-sm">
                  <User size={20} />
                </div>
                <div>
                  <p className="font-bold text-sm">{client.name}</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold">{client.visaType}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-500">
                  {t.assignedTo}: {users.find(u => u.uid === client.assignedTo)?.displayName || t.unassigned}
                </p>
                <p className="text-[10px] text-gray-400">
                  {client.lastUpdated?.toDate ? client.lastUpdated.toDate().toLocaleDateString() : 'Just now'}
                </p>
              </div>
            </div>
          ))}
          {clients.length === 0 && (
            <div className="text-center py-10 text-gray-400 italic">
              {t.noClients}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarServiceItem({ icon, label }: { icon: React.ReactNode, label: string }) {
  return (
    <div className="flex items-center gap-4 px-4 py-2 text-gray-400 font-medium text-xs hover:text-[#006C35] transition-colors cursor-default">
      {icon}
      {label}
    </div>
  );
}

function SettingsView({ userProfile, users, onUpdateRole, language }: { userProfile: UserProfile | null, users: UserProfile[], onUpdateRole: (uid: string, role: 'owner' | 'employee') => void, language: Language }) {
  const t = TRANSLATIONS[language];
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    displayName: userProfile?.displayName || '',
    phone: userProfile?.phone || '',
    address: userProfile?.address || ''
  });

  const handleToggleNotifications = async () => {
    if (!userProfile) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        notificationsEnabled: !userProfile.notificationsEnabled
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;
    try {
      await updateDoc(doc(db, 'users', userProfile.uid), {
        displayName: editData.displayName,
        phone: editData.phone,
        address: editData.address
      });
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userProfile.uid}`);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-[#006C35]/10 rounded-[2rem] flex items-center justify-center text-[#006C35] font-black text-3xl shadow-inner">
              {userProfile?.displayName.charAt(0)}
            </div>
            <div>
              <h3 className="text-3xl font-black tracking-tight">{userProfile?.displayName}</h3>
              <p className="text-sm font-bold text-[#006C35] uppercase tracking-widest">{userProfile?.role === 'owner' ? 'Owner' : 'Employee'}</p>
            </div>
          </div>
          {!isEditing ? (
            <button 
              onClick={() => {
                setEditData({
                  displayName: userProfile?.displayName || '',
                  phone: userProfile?.phone || '',
                  address: userProfile?.address || ''
                });
                setIsEditing(true);
              }}
              className="flex items-center gap-2 text-sm font-bold text-[#006C35] bg-[#006C35]/5 px-6 py-3 rounded-2xl hover:bg-[#006C35]/10 transition-all hover:scale-[1.02]"
            >
              <Edit size={18} />
              {t.edit}
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsEditing(false)}
                className="text-sm font-bold text-gray-400 px-6 py-3 rounded-2xl hover:bg-gray-50 transition-all"
              >
                {t.cancel}
              </button>
              <button 
                onClick={handleSaveProfile}
                className="bg-[#006C35] text-white text-sm font-bold px-8 py-3 rounded-2xl shadow-xl shadow-[#006C35]/20 hover:scale-[1.05] active:scale-[0.98] transition-all"
              >
                {t.save}
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t.displayName}</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={editData.displayName}
                  onChange={(e) => setEditData({...editData, displayName: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-[#006C35]/20 transition-all"
                />
              ) : (
                <div className="px-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl font-bold text-gray-700 flex items-center gap-3">
                  <User size={18} className="text-gray-300" />
                  {userProfile?.displayName}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t.email}</label>
              <div className="px-5 py-4 bg-gray-50/30 border border-transparent rounded-2xl font-bold text-gray-400 flex items-center gap-3 cursor-not-allowed">
                <Mail size={18} className="text-gray-200" />
                {userProfile?.email}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t.phone}</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-[#006C35]/20 transition-all"
                />
              ) : (
                <div className="px-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl font-bold text-gray-700 flex items-center gap-3">
                  <Phone size={18} className="text-gray-300" />
                  {userProfile?.phone || '-'}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">{t.address}</label>
              {isEditing ? (
                <input 
                  type="text"
                  value={editData.address}
                  onChange={(e) => setEditData({...editData, address: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 font-bold focus:outline-none focus:ring-2 focus:ring-[#006C35]/20 transition-all"
                />
              ) : (
                <div className="px-5 py-4 bg-gray-50/50 border border-transparent rounded-2xl font-bold text-gray-700 flex items-center gap-3">
                  <MapPin size={18} className="text-gray-300" />
                  {userProfile?.address || '-'}
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-10 border-t border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{t.notifications}</p>
            <p className="font-bold text-gray-600">{t.newClientAlerts}</p>
          </div>
          <button 
            onClick={handleToggleNotifications}
            className={cn(
              "w-14 h-7 rounded-full relative transition-all duration-300",
              userProfile?.notificationsEnabled ? "bg-[#006C35]" : "bg-gray-200"
            )}
          >
            <div className={cn(
              "absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-sm",
              userProfile?.notificationsEnabled ? "right-1" : "left-1"
            )} />
          </button>
        </div>
      </div>

      {userProfile?.role === 'owner' && (
        <div className="bg-white rounded-[2.5rem] p-10 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black">{t.teamManagement}</h3>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-4 py-2 rounded-full">
              <Users size={14} />
              {users.length} {t.members}
            </div>
          </div>
          
          <div className="space-y-4">
            {users.map(member => (
              <div key={member.uid} className="flex items-center justify-between p-6 bg-gray-50 rounded-3xl group hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-[#006C35] font-black shadow-sm">
                    {member.displayName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{member.displayName}</p>
                    <p className="text-xs text-gray-400">{member.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <select 
                    value={member.role}
                    onChange={(e) => onUpdateRole(member.uid, e.target.value as 'owner' | 'employee')}
                    disabled={member.uid === userProfile.uid}
                    className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#006C35]/20 disabled:opacity-50"
                  >
                    <option value="owner">Owner</option>
                    <option value="employee">Employee</option>
                  </select>
                  
                  {member.uid === userProfile.uid && (
                    <span className="text-[10px] font-black text-[#006C35] uppercase tracking-widest bg-[#006C35]/10 px-3 py-1 rounded-full">
                      {t.you}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
