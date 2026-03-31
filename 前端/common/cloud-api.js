/**
 * 禄命排盘 - 云端数据库接口模块
 * 支持MySQL云服务API
 */

class CloudDatabase {
    constructor() {
        this.config = {
            enabled: false,
            apiUrl: 'https://your-mysql-api.com',
            apiKey: '',
            syncInterval: 30000,
            timeout: 10000
        };
        this.syncTimer = null;
    }

    // 配置云端数据库
    configure(config) {
        Object.assign(this.config, config);
    }

    // 启用/禁用云端同步
    setEnabled(enabled) {
        this.config.enabled = enabled;
        
        if (enabled) {
            this.startSync();
        } else {
            this.stopSync();
        }
    }

    // 开始同步
    startSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        // 立即同步一次
        this.sync();

        // 设置定时同步
        this.syncTimer = setInterval(() => {
            this.sync();
        }, this.config.syncInterval);

        console.log('云端同步已启动');
    }

    // 停止同步
    stopSync() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
            this.syncTimer = null;
            console.log('云端同步已停止');
        }
    }

    // 同步数据到云端
    async syncToCloud(records) {
        if (!this.config.enabled) return { success: false, message: '云端同步未启用' };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/sync`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify({ records })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            console.log('云端同步成功:', result);
            return { success: true, data: result };
        } catch (error) {
            console.error('云端同步失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 从云端获取数据
    async fetchFromCloud() {
        if (!this.config.enabled) return { success: false, data: [] };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/records`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const records = await response.json();
            return { success: true, data: records };
        } catch (error) {
            console.error('获取云端数据失败:', error);
            return { success: false, data: [], error: error.message };
        }
    }

    // 带超时的fetch
    async fetchWithTimeout(url, options = {}) {
        const timeout = this.config.timeout;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('请求超时');
            }
            throw error;
        }
    }

    // 上传单条记录
    async uploadRecord(record) {
        if (!this.config.enabled) return { success: false, message: '云端同步未启用' };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(record)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('上传记录失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 更新记录
    async updateRecord(id, updates) {
        if (!this.config.enabled) return { success: false, message: '云端同步未启用' };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/records/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.config.apiKey}`
                },
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('更新记录失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 删除记录
    async deleteRecord(id) {
        if (!this.config.enabled) return { success: false, message: '云端同步未启用' };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/records/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            return { success: true };
        } catch (error) {
            console.error('删除记录失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 搜索记录
    async searchRecords(keyword, filters = {}) {
        if (!this.config.enabled) return { success: false, data: [] };

        try {
            const params = new URLSearchParams({
                keyword,
                ...filters
            });

            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/records/search?${params}`, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const records = await response.json();
            return { success: true, data: records };
        } catch (error) {
            console.error('搜索记录失败:', error);
            return { success: false, data: [], error: error.message };
        }
    }

    // 备份数据
    async backup() {
        if (!this.config.enabled) return { success: false, message: '云端同步未启用' };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/backup`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('备份失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 恢复数据
    async restore(backupId) {
        if (!this.config.enabled) return { success: false, message: '云端同步未启用' };

        try {
            const response = await this.fetchWithTimeout(`${this.config.apiUrl}/restore/${backupId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('恢复失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取同步状态
    getStatus() {
        return {
            enabled: this.config.enabled,
            apiUrl: this.config.apiUrl,
            syncInterval: this.config.syncInterval,
            isSyncing: this.syncTimer !== null
        };
    }
}

// 全局实例
const cloudDB = new CloudDatabase();

// 自动初始化
if (typeof window !== 'undefined') {
    window.CloudDatabase = CloudDatabase;
    window.cloudDB = cloudDB;
}

// 微信登录接口预留
class WechatAuth {
    constructor() {
        this.config = {
            appId: '', // 微信开放平台AppID
            appSecret: '', // 微信开放平台AppSecret
            redirectUri: '', // 回调地址
            scope: 'snsapi_userinfo' // 授权范围
        };
        this.currentUser = null;
    }

    // 配置微信登录
    configure(config) {
        Object.assign(this.config, config);
    }

    // 生成微信授权URL
    getAuthUrl(state = '') {
        if (!this.config.appId || !this.config.redirectUri) {
            console.error('请配置微信AppID和回调地址');
            return null;
        }

        const params = new URLSearchParams({
            appid: this.config.appId,
            redirect_uri: this.config.redirectUri,
            response_type: 'code',
            scope: this.config.scope,
            state: state || Math.random().toString(36).substring(7)
        });

        return `https://open.weixin.qq.com/connect/oauth2/authorize?${params.toString()}#wechat_redirect`;
    }

    // 打开微信授权页面
    authorize(state = '') {
        const authUrl = this.getAuthUrl(state);
        if (authUrl) {
            window.location.href = authUrl;
        }
    }

    // 处理微信回调
    async handleCallback(code) {
        if (!code) {
            throw new Error('缺少授权码');
        }

        try {
            // 这里应该调用后端API，由后端与微信服务器交互
            // 前端不直接处理微信API，以保护AppSecret安全
            const response = await fetch('/api/wechat/callback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code })
            });

            if (!response.ok) {
                throw new Error('微信登录失败');
            }

            const userData = await response.json();
            this.currentUser = userData;
            
            // 保存用户信息到本地存储
            localStorage.setItem('cloud_user', JSON.stringify(userData));
            localStorage.setItem('current_user', JSON.stringify(userData));
            
            return { success: true, user: userData };
        } catch (error) {
            console.error('微信登录处理失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取当前用户
    getCurrentUser() {
        if (this.currentUser) {
            return this.currentUser;
        }

        const userStr = localStorage.getItem('cloud_user');
        if (userStr) {
            this.currentUser = JSON.parse(userStr);
            return this.currentUser;
        }

        return null;
    }

    // 检查是否已登录
    isLoggedIn() {
        return this.getCurrentUser() !== null;
    }

    // 退出登录
    logout() {
        this.currentUser = null;
        localStorage.removeItem('cloud_user');
        localStorage.removeItem('current_user');
    }

    // 获取用户信息
    async getUserInfo() {
        const user = this.getCurrentUser();
        if (!user) {
            return { success: false, error: '未登录' };
        }

        try {
            // 如果有token，可以通过后端获取最新用户信息
            if (user.token) {
                const response = await fetch('/api/wechat/userinfo', {
                    headers: {
                        'Authorization': `Bearer ${user.token}`
                    }
                });

                if (response.ok) {
                    const userInfo = await response.json();
                    this.currentUser = { ...this.currentUser, ...userInfo };
                    localStorage.setItem('cloud_user', JSON.stringify(this.currentUser));
                    return { success: true, user: this.currentUser };
                }
            }

            return { success: true, user };
        } catch (error) {
            console.error('获取用户信息失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 同步数据到云端
    async syncToCloud(records) {
        const user = this.getCurrentUser();
        if (!user || !user.token) {
            return { success: false, error: '未登录云端账户' };
        }

        try {
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify({ records })
            });

            if (!response.ok) {
                throw new Error('同步失败');
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('云端同步失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 从云端获取数据
    async fetchFromCloud() {
        const user = this.getCurrentUser();
        if (!user || !user.token) {
            return { success: false, data: [], error: '未登录云端账户' };
        }

        try {
            const response = await fetch('/api/records', {
                headers: {
                    'Authorization': `Bearer ${user.token}`
                }
            });

            if (!response.ok) {
                throw new Error('获取云端数据失败');
            }

            const records = await response.json();
            return { success: true, data: records };
        } catch (error) {
            console.error('获取云端数据失败:', error);
            return { success: false, data: [], error: error.message };
        }
    }

    // 导入数据到云端
    async importDataToCloud(options = {}) {
        const user = this.getCurrentUser();
        if (!user || !user.token) {
            return { success: false, error: '未登录云端账户' };
        }

        try {
            const response = await fetch('/api/import', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${user.token}`
                },
                body: JSON.stringify(options)
            });

            if (!response.ok) {
                throw new Error('导入数据失败');
            }

            const result = await response.json();
            return { success: true, data: result };
        } catch (error) {
            console.error('导入数据失败:', error);
            return { success: false, error: error.message };
        }
    }

    // 获取登录状态
    getStatus() {
        const user = this.getCurrentUser();
        return {
            isLoggedIn: user !== null,
            user: user,
            config: {
                appId: this.config.appId ? '已配置' : '未配置',
                redirectUri: this.config.redirectUri ? '已配置' : '未配置'
            }
        };
    }
}

// 全局实例
const wechatAuth = new WechatAuth();

// 自动初始化
if (typeof window !== 'undefined') {
    window.WechatAuth = WechatAuth;
    window.wechatAuth = wechatAuth;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CloudDatabase, cloudDB, WechatAuth, wechatAuth };
}