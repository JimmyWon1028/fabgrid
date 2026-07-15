(function(root) {
  'use strict';

  root.createGridGridLeftRows = function() {
    return [
      { taskId: 'TASK-101', name: '需求盤點', owner: '王雅婷', priority: '高', hours: 8, status: '待辦' },
      { taskId: 'TASK-102', name: '介面原型', owner: '李承翰', priority: '中', hours: 12, status: '待辦' },
      { taskId: 'TASK-103', name: '資料欄位確認', owner: '周映彤', priority: '高', hours: 6, status: '待辦' },
      { taskId: 'TASK-104', name: '權限流程設計', owner: '劉書維', priority: '中', hours: 10, status: '待辦' },
      { taskId: 'TASK-105', name: '驗收案例整理', owner: '吳佳蓉', priority: '低', hours: 5, status: '待辦' }
    ];
  };

  root.createGridGridRightRows = function() {
    return [
      { taskId: 'TASK-201', name: '核心 API', owner: '陳俊明', priority: '高', hours: 16, status: '進行中' },
      { taskId: 'TASK-202', name: '單元測試', owner: '蔡佩珊', priority: '高', hours: 14, status: '進行中' },
      { taskId: 'TASK-203', name: '效能量測', owner: '江彥廷', priority: '中', hours: 8, status: '進行中' },
      { taskId: 'TASK-204', name: '文件更新', owner: '鄭思妤', priority: '低', hours: 6, status: '進行中' }
    ];
  };
}(typeof window !== 'undefined' ? window : this));
