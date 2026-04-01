/**
 * 禄命排盘 - IndexedDB 数据库模块
 * 支持 Web 和安卓 WebView
 */

const DB_NAME = 'luming_db';
const DB_VERSION = 1;
const STORE_NAME = 'records';

// 云端数据库配置（预留）
const CLOUD_CONFIG = {
    enabled: false, // 是否启用云端同步
    apiUrl: 'https://your-mysql-api.com', // MySQL云服务API地址
    apiKey: '', // API密钥
    syncInterval: 30000, // 同步间隔（毫秒）
};

class LumingDatabase {
    constructor() {
        this.db = null;
        this.syncTimer = null; // 同步定时器
    }

    // 初始化数据库
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                
                // 启动云端同步（如果启用）
                if (CLOUD_CONFIG.enabled) {
                    this.startCloudSync();
                }
                
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const store = db.createObjectStore(STORE_NAME, { 
                        keyPath: 'id', 
                        autoIncrement: true 
                    });
                    
                    // 创建索引
                    store.createIndex('name', 'name', { unique: false });
                    store.createIndex('dateType', 'dateType', { unique: false });
                    store.createIndex('createdAt', 'createdAt', { unique: false });
                    store.createIndex('zodiac', 'zodiac', { unique: false });
                    store.createIndex('cloudId', 'cloudId', { unique: false }); // 云端ID索引
                    store.createIndex('actualTime', 'actualTime', { unique: false }); // 实际时间索引
                    store.createIndex('gender', 'gender', { unique: false }); // 性别索引
                    store.createIndex('userId', 'userId', { unique: false }); // 用户ID索引
                }
            };
        });
    }

    // 检查是否存在重复记录
    async checkDuplicateRecord(actualTime, gender, bazi) {
        if (!actualTime || !gender) return null;
        
        const allRecords = await this.getAllRecords();
        
        return allRecords.find(record => {
            if (!record.actualTime && !record.solarDate) return false;
            
            const recordTime = record.actualTime || record.solarDate;
            if (recordTime !== actualTime) return false;
            
            if (!record.gender || record.gender !== gender) return false;
            
            const recordBazi = `${record.year}${record.month}${record.day}${record.hour}`;
            const currentBazi = `${bazi.year}${bazi.month}${bazi.day}${bazi.hour}`;
            if (recordBazi !== currentBazi) return false;
            
            return true;
        });
    }

    // 更新记录
    async updateRecord(id, updatedRecord) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            
            // 保留原有的ID和创建时间
            updatedRecord.id = id;
            updatedRecord.updatedAt = new Date().toISOString();
            
            const request = store.put(updatedRecord);
            
            request.onsuccess = () => {
                // 如果启用云端同步，同步更新后的记录
                if (CLOUD_CONFIG.enabled) {
                    this.syncToCloud([updatedRecord]);
                }
                resolve(request.result);
            };
            request.onerror = () => reject(request.error);
        });
    }

    // 添加记录（修改版，包含去重检查）
    async addRecord(record) {
        try {
            // 确保数据库已初始化
            if (!this.db) await this.init();
            
            // 检查是否存在重复记录
            const duplicate = await this.checkDuplicateRecord(
                record.actualTime || record.solarDate,
                record.gender,
                {
                    year: record.year,
                    month: record.month,
                    day: record.day,
                    hour: record.hour
                }
            );
            
            if (duplicate) {
                console.log('发现重复记录，删除旧记录:', duplicate.id);
                // 删除旧记录，然后添加新记录
                await this.deleteRecord(duplicate.id);
            }
            
            // 没有重复，正常添加
            return new Promise((resolve, reject) => {
                const tx = this.db.transaction(STORE_NAME, 'readwrite');
                const store = tx.objectStore(STORE_NAME);
                
                record.createdAt = new Date().toISOString();
                record.cloudId = null; // 云端ID，同步后设置
                
                // 如果没有用户ID，设置为null（游客数据）
                if (!record.userId) {
                    record.userId = null;
                    record.userType = 'guest';
                }
                
                const request = store.add(record);
                
                request.onsuccess = () => {
                    // 如果启用云端同步，立即同步这条记录
                    if (CLOUD_CONFIG.enabled) {
                        this.syncToCloud([record]);
                    }
                    resolve(request.result);
                };
                request.onerror = () => reject(request.error);
            });
        } catch (error) {
            console.error('添加记录失败:', error);
            throw error;
        }
    }

    // 获取所有记录
    async getAllRecords() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 根据ID获取记录
    async getRecord(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.get(id);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 根据ID删除记录
    async deleteRecord(id) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.delete(id);
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // 根据日期类型筛选
    async getRecordsByDateType(dateType) {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('dateType');
            const request = index.getAll(dateType);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // 搜索记录（按姓名）
    async searchRecords(keyword) {
        const allRecords = await this.getAllRecords();
        return allRecords.filter(record => 
            record.name.toLowerCase().includes(keyword.toLowerCase())
        );
    }

    // 清空所有记录
    async clearAll() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            const request = store.clear();
            
            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }

    // 获取记录数量
    async getCount() {
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const request = store.count();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    // ===== 云端同步方法（预留） =====
    
    // 同步到云端
    async syncToCloud(records = null) {
        if (!CLOUD_CONFIG.enabled || !this.db) return;
        
        try {
            // 如果没有指定记录，获取所有记录
            if (!records) {
                records = await this.getAllRecords();
            }
            
            const response = await fetch(`${CLOUD_CONFIG.apiUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CLOUD_CONFIG.apiKey}`
                },
                body: JSON.stringify({ records })
            });
            
            if (!response.ok) throw new Error('云端同步失败');
            
            const result = await response.json();
            console.log('云端同步成功:', result);
            return result;
        } catch (error) {
            console.error('云端同步错误:', error);
            // 同步失败不影响本地功能
        }
    }

    // 从云端获取记录
    async fetchFromCloud() {
        if (!CLOUD_CONFIG.enabled) return [];
        
        try {
            const response = await fetch(`${CLOUD_CONFIG.apiUrl}/records`, {
                headers: {
                    'Authorization': `Bearer ${CLOUD_CONFIG.apiKey}`
                }
            });
            
            if (!response.ok) throw new Error('获取云端记录失败');
            
            return await response.json();
        } catch (error) {
            console.error('获取云端记录错误:', error);
            return [];
        }
    }

    // 合并云端和本地记录
    async mergeCloudRecords() {
        if (!CLOUD_CONFIG.enabled || !this.db) return;
        
        try {
            const cloudRecords = await this.fetchFromCloud();
            const localRecords = await this.getAllRecords();
            
            // 合并逻辑：云端记录优先
            const merged = [...localRecords];
            const localIds = new Set(localRecords.map(r => r.id));
            const localCloudIds = new Set(localRecords.map(r => r.cloudId).filter(Boolean));
            
            cloudRecords.forEach(cloudRecord => {
                // 检查是否已存在
                const existsById = cloudRecord.id && localIds.has(cloudRecord.id);
                const existsByCloudId = cloudRecord.cloudId && localCloudIds.has(cloudRecord.cloudId);
                
                if (!existsById && !existsByCloudId) {
                    // 新记录，添加到本地
                    merged.push({
                        ...cloudRecord,
                        cloudId: cloudRecord.cloudId || cloudRecord.id
                    });
                }
            });
            
            // 这里可以添加更新本地数据库的逻辑
            // 由于IndexedDB的复杂性，这里先记录日志
            console.log('记录合并完成，云端记录:', cloudRecords.length, '本地记录:', localRecords.length);
            
        } catch (error) {
            console.error('合并云端记录错误:', error);
        }
    }

    // 启动云端同步定时器
    startCloudSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
        
        // 立即同步一次
        this.syncToCloud();
        this.mergeCloudRecords();
        
        // 设置定时同步
        this.syncTimer = setInterval(() => {
            this.syncToCloud();
            this.mergeCloudRecords();
        }, CLOUD_CONFIG.syncInterval);
        
        console.log('云端同步已启动，同步间隔:', CLOUD_CONFIG.syncInterval / 1000, '秒');
    }

    // 停止云端同步
    stopCloudSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('云端同步已停止');
        }
    }

    // 启用/禁用云端同步
    setCloudSync(enabled) {
        CLOUD_CONFIG.enabled = enabled;
        
        if (enabled) {
            this.startCloudSync();
        } else {
            this.stopCloudSync();
        }
    }

    // 设置云端配置
    setCloudConfig(config) {
        Object.assign(CLOUD_CONFIG, config);
        
        // 如果已经启用同步，重新启动
        if (CLOUD_CONFIG.enabled && this.db) {
            this.startCloudSync();
        }
    }
}

// 全局实例
const db = new LumingDatabase();

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
    db.init().then(() => {
        console.log('数据库初始化成功');
    }).catch(err => {
        console.error('数据库初始化失败:', err);
    });
});

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LumingDatabase, db };
}