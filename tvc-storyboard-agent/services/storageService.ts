/**
 * IndexedDB Storage Service
 * 用于存储大型数据（如 base64 图片），避免 localStorage 5MB 限制
 */

import { SavedModel } from '../types';

const DB_NAME = 'tvc_storyboard_db';
const DB_VERSION = 2; // 升级版本以添加模特库
const PROJECTS_STORE = 'projects';
const MODELS_STORE = 'models';

let db: IDBDatabase | null = null;

// 初始化数据库
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // 创建项目存储
      if (!database.objectStoreNames.contains(PROJECTS_STORE)) {
        database.createObjectStore(PROJECTS_STORE, { keyPath: 'id' });
      }

      // 创建模特库存储
      if (!database.objectStoreNames.contains(MODELS_STORE)) {
        const modelStore = database.createObjectStore(MODELS_STORE, { keyPath: 'id' });
        modelStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
  });
};

// 保存项目
export const saveProject = async (project: any): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([PROJECTS_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.put(project);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to save project:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Storage error:', error);
    // 静默失败，不影响用户操作
  }
};

// 加载所有项目
export const loadAllProjects = async (): Promise<any[]> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([PROJECTS_STORE], 'readonly');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        console.error('Failed to load projects:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Storage error:', error);
    return [];
  }
};

// 删除项目
export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([PROJECTS_STORE], 'readwrite');
      const store = transaction.objectStore(PROJECTS_STORE);
      const request = store.delete(projectId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to delete project:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Storage error:', error);
  }
};

// 保存当前项目 ID（仍使用 localStorage，因为这只是一个小字符串）
export const saveCurrentProjectId = (projectId: string | null): void => {
  if (projectId) {
    localStorage.setItem('tvc_current_project', projectId);
  } else {
    localStorage.removeItem('tvc_current_project');
  }
};

// 获取当前项目 ID
export const getCurrentProjectId = (): string | null => {
  return localStorage.getItem('tvc_current_project');
};

// 从 localStorage 迁移数据到 IndexedDB（兼容旧数据）
export const migrateFromLocalStorage = async (): Promise<void> => {
  try {
    const oldData = localStorage.getItem('tvc_projects');
    if (oldData) {
      const projects = JSON.parse(oldData);
      for (const project of projects) {
        await saveProject(project);
      }
      // 迁移成功后删除旧数据
      localStorage.removeItem('tvc_projects');
      console.log('Successfully migrated projects from localStorage to IndexedDB');
    }
  } catch (error) {
    console.error('Migration error:', error);
  }
};

// ==================== 模特库 ====================

// 保存模特到模特库
export const saveModel = async (model: SavedModel): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([MODELS_STORE], 'readwrite');
      const store = transaction.objectStore(MODELS_STORE);
      const request = store.put(model);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to save model:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Storage error:', error);
  }
};

// 加载所有模特（按创建时间倒序）
export const loadAllModels = async (): Promise<SavedModel[]> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([MODELS_STORE], 'readonly');
      const store = transaction.objectStore(MODELS_STORE);
      const request = store.getAll();

      request.onsuccess = () => {
        const models = request.result || [];
        // 按创建时间倒序排列
        models.sort((a: SavedModel, b: SavedModel) => b.createdAt - a.createdAt);
        resolve(models);
      };
      request.onerror = () => {
        console.error('Failed to load models:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Storage error:', error);
    return [];
  }
};

// 获取最近 N 个模特
export const getRecentModels = async (limit: number = 3): Promise<SavedModel[]> => {
  const allModels = await loadAllModels();
  return allModels.slice(0, limit);
};

// 删除模特
export const deleteModel = async (modelId: string): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([MODELS_STORE], 'readwrite');
      const store = transaction.objectStore(MODELS_STORE);
      const request = store.delete(modelId);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        console.error('Failed to delete model:', request.error);
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Storage error:', error);
  }
};

// 更新模特（如改名）
export const updateModel = async (modelId: string, updates: Partial<SavedModel>): Promise<void> => {
  try {
    const database = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction([MODELS_STORE], 'readwrite');
      const store = transaction.objectStore(MODELS_STORE);
      const getRequest = store.get(modelId);

      getRequest.onsuccess = () => {
        const model = getRequest.result;
        if (model) {
          const updatedModel = { ...model, ...updates };
          const putRequest = store.put(updatedModel);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Model not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  } catch (error) {
    console.error('Storage error:', error);
  }
};
