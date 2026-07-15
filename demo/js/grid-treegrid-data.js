(function(root) {
  'use strict';

  root.createGridTreeDragPool = function() {
    return [
      { nodeId: 'NEW-101', name: '行動應用組', nodeType: '待配置團隊', owner: '江品妤', status: '待配置', headcount: 6 },
      { nodeId: 'NEW-102', name: '資料治理組', nodeType: '待配置團隊', owner: '蕭承恩', status: '待配置', headcount: 5 },
      { nodeId: 'NEW-103', name: '自動化測試組', nodeType: '待配置團隊', owner: '葉心怡', status: '待配置', headcount: 4 },
      { nodeId: 'NEW-104', name: '客戶體驗組', nodeType: '待配置團隊', owner: '杜宗翰', status: '待配置', headcount: 7 },
      { nodeId: 'NEW-105', name: '雲端維運組', nodeType: '待配置團隊', owner: '潘雅雯', status: '待配置', headcount: 8 }
    ];
  };

  root.createGridTreeDragTree = function() {
    return [
      {
        nodeId: 'BG-100',
        name: '數位產品事業群',
        nodeType: '事業群',
        owner: '林怡君',
        status: '運作中',
        headcount: 35,
        children: [
          {
            nodeId: 'DP-110',
            name: '平台研發部',
            nodeType: '部門',
            owner: '陳俊明',
            status: '運作中',
            headcount: 20,
            children: [
              { nodeId: 'TM-111', name: '前端工程組', nodeType: '團隊', owner: '王雅婷', status: '正常', headcount: 9 },
              { nodeId: 'TM-112', name: '後端工程組', nodeType: '團隊', owner: '李承翰', status: '正常', headcount: 11 }
            ]
          },
          {
            nodeId: 'DP-120',
            name: '產品設計部',
            nodeType: '部門',
            owner: '周映彤',
            status: '運作中',
            headcount: 15,
            children: [
              { nodeId: 'TM-121', name: '產品企劃組', nodeType: '團隊', owner: '劉書維', status: '正常', headcount: 8 },
              { nodeId: 'TM-122', name: '使用者體驗組', nodeType: '團隊', owner: '吳佳蓉', status: '正常', headcount: 7 }
            ]
          }
        ]
      },
      {
        nodeId: 'BG-200',
        name: '企業服務事業群',
        nodeType: '事業群',
        owner: '黃冠宇',
        status: '運作中',
        headcount: 19,
        children: [
          {
            nodeId: 'DP-210',
            name: '顧問服務部',
            nodeType: '部門',
            owner: '蔡佩珊',
            status: '運作中',
            headcount: 19,
            children: [
              { nodeId: 'TM-211', name: '導入顧問組', nodeType: '團隊', owner: '江彥廷', status: '正常', headcount: 10 },
              { nodeId: 'TM-212', name: '客戶成功組', nodeType: '團隊', owner: '鄭思妤', status: '正常', headcount: 9 }
            ]
          }
        ]
      }
    ];
  };
}(typeof window !== 'undefined' ? window : this));
