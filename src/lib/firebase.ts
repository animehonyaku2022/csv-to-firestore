import { initializeApp, type FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs,
  enableIndexedDbPersistence,
  connectFirestoreEmulator,
  type Firestore
} from 'firebase/firestore';

export interface FirebaseConfig {
  id: string;
  name: string;
  config: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  };
}

export const firebaseConfigs: FirebaseConfig[] = [
  {
    id: 'nihongo-master',
    name: 'Nihongo Master',
    config: {
      apiKey: "AIzaSyBMXqQKia93_rAB9BwK-kan2wF44R0Ur9o",
      authDomain: "nihongo-master-3f325.firebaseapp.com",
      projectId: "nihongo-master-3f325",
      storageBucket: "nihongo-master-3f325.firebasestorage.app",
      messagingSenderId: "373790878583",
      appId: "1:373790878583:web:cf05cf747b54258e6a8f72",
      measurementId: "G-WNEW00VPKZ"
    }
  },
  {
    id: 'kanji-study',
    name: 'Kanji Study',
    config: {
      apiKey: "AIzaSyC5lWUr6M3F5yH2lNAuX9fKEngq-9vqd-Y",
      authDomain: "kanji-study-app.firebaseapp.com",
      projectId: "kanji-study-app",
      storageBucket: "kanji-study-app.appspot.com",
      messagingSenderId: "892347123456",
      appId: "1:892347123456:web:abc123def456",
      measurementId: "G-ABC123DEF4"
    }
  },
  {
    id: 'vocab-trainer',
    name: 'Vocabulary Trainer',
    config: {
      apiKey: "AIzaSyD8mK3jQ2lN6yH9fKpR4q-9vXd-Y",
      authDomain: "vocab-trainer-app.firebaseapp.com",
      projectId: "vocab-trainer-app",
      storageBucket: "vocab-trainer-app.appspot.com",
      messagingSenderId: "567891234567",
      appId: "1:567891234567:web:xyz789abc123",
      measurementId: "G-XYZ789ABC1"
    }
  }
];

class FirebaseManager {
  private apps: Map<string, FirebaseApp> = new Map();
  private dbs: Map<string, Firestore> = new Map();
  private currentConfigId: string | null = null;
  private configs: FirebaseConfig[];

  constructor(initialConfigs: FirebaseConfig[]) {
    this.configs = [...initialConfigs];
    if (this.configs.length > 0) {
      this.initializeConfig(this.configs[0].id);
    }
  }

  private async initializeConfig(configId: string) {
    const config = this.configs.find(c => c.id === configId);
    if (!config) throw new Error(`Firebase config not found: ${configId}`);

    if (!this.apps.has(configId)) {
      const app = initializeApp(config.config, configId);
      const db = getFirestore(app);
      
      this.apps.set(configId, app);
      this.dbs.set(configId, db);
      
      await this.initializeFirestore(db);
    }

    this.currentConfigId = configId;
  }

  private async initializeFirestore(db: Firestore) {
    try {
      if (!window.frameElement) {
        await enableIndexedDbPersistence(db).catch((err) => {
          if (err.code === 'failed-precondition') {
            console.log('Persistence already enabled in another tab');
          } else if (err.code === 'unimplemented') {
            console.log('Persistence not supported by browser');
          }
        });
      }

      if (import.meta.env.DEV) {
        connectFirestoreEmulator(db, 'localhost', 8080);
        console.log('Connected to Firestore emulator');
      }
    } catch (err) {
      console.warn('Firestore initialization encountered an issue:', err);
    }
  }

  async switchConfig(configId: string) {
    if (configId !== this.currentConfigId) {
      await this.initializeConfig(configId);
    }
    return this.getCurrentDb();
  }

  getCurrentDb(): Firestore {
    if (!this.currentConfigId || !this.dbs.has(this.currentConfigId)) {
      throw new Error('No Firebase configuration initialized');
    }
    return this.dbs.get(this.currentConfigId)!;
  }

  getCurrentConfig(): FirebaseConfig {
    if (!this.currentConfigId) {
      throw new Error('No Firebase configuration selected');
    }
    const config = this.configs.find(c => c.id === this.currentConfigId);
    if (!config) throw new Error(`Config not found: ${this.currentConfigId}`);
    return config;
  }

  getConfigs(): FirebaseConfig[] {
    return [...this.configs];
  }

  addConfig(config: FirebaseConfig) {
    this.configs.push(config);
    return [...this.configs];
  }

  removeConfig(configId: string) {
    this.configs = this.configs.filter(c => c.id !== configId);
    if (configId === this.currentConfigId && this.configs.length > 0) {
      this.initializeConfig(this.configs[0].id);
    }
    return [...this.configs];
  }
}

export const firebaseManager = new FirebaseManager(firebaseConfigs);

export const checkFirebaseConnection = async (configId?: string): Promise<{
  isConnected: boolean;
  message?: string;
}> => {
  try {
    const db = configId ? 
      await firebaseManager.switchConfig(configId) : 
      firebaseManager.getCurrentDb();
    
    await getDocs(collection(db, 'uploadedData'));
    return { 
      isConnected: true,
      message: `Connected to ${firebaseManager.getCurrentConfig().name}`
    };
  } catch (error) {
    const err = error as Error;
    console.error('Firebase connection error:', err);
    
    if (err.message.includes('offline')) {
      return {
        isConnected: false,
        message: 'Operating in offline mode. Changes will sync when connection is restored.'
      };
    }
    
    return {
      isConnected: false,
      message: 'Unable to connect to Firebase. Please check your internet connection.'
    };
  }
};