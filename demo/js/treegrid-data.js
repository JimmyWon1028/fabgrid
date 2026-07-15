(function(root) {
  'use strict';

  root.createTreeGridDemoData = function() {
    return [
      {
        nodeId: 'BG-100',
        name: '數位產品事業群',
        nodeType: '事業群',
        owner: '林怡君',
        status: '進行中',
        headcount: 42,
        budget: 18500000,
        children: [
          {
            nodeId: 'DP-110',
            name: '平台研發部',
            nodeType: '部門',
            owner: '陳俊明',
            status: '進行中',
            headcount: 24,
            budget: 10600000,
            children: [
              { nodeId: 'TM-111', name: '前端工程組', nodeType: '團隊', owner: '王雅婷', status: '正常', headcount: 9, budget: 3600000 },
              { nodeId: 'TM-112', name: '後端工程組', nodeType: '團隊', owner: '李承翰', status: '正常', headcount: 11, budget: 4700000 },
              { nodeId: 'TM-113', name: '品質保證組', nodeType: '團隊', owner: '張詠晴', status: '招募中', headcount: 4, budget: 2300000 }
            ]
          },
          {
            nodeId: 'DP-120',
            name: '產品設計部',
            nodeType: '部門',
            owner: '周映彤',
            status: '進行中',
            headcount: 18,
            budget: 7900000,
            children: [
              { nodeId: 'TM-121', name: '產品企劃組', nodeType: '團隊', owner: '劉書維', status: '正常', headcount: 10, budget: 4200000 },
              { nodeId: 'TM-122', name: '使用者體驗組', nodeType: '團隊', owner: '吳佳蓉', status: '正常', headcount: 8, budget: 3700000 }
            ]
          }
        ]
      },
      {
        nodeId: 'BG-200',
        name: '企業服務事業群',
        nodeType: '事業群',
        owner: '黃冠宇',
        status: '進行中',
        headcount: 31,
        budget: 14200000,
        children: [
          {
            nodeId: 'DP-210',
            name: '顧問服務部',
            nodeType: '部門',
            owner: '蔡佩珊',
            status: '正常',
            headcount: 17,
            budget: 7600000,
            children: [
              { nodeId: 'TM-211', name: '導入顧問組', nodeType: '團隊', owner: '江彥廷', status: '正常', headcount: 10, budget: 4300000 },
              { nodeId: 'TM-212', name: '客戶成功組', nodeType: '團隊', owner: '鄭思妤', status: '招募中', headcount: 7, budget: 3300000 }
            ]
          },
          {
            nodeId: 'DP-220',
            name: '解決方案部',
            nodeType: '部門',
            owner: '許志豪',
            status: '規劃中',
            headcount: 14,
            budget: 6600000,
            children: [
              { nodeId: 'TM-221', name: '資料整合組', nodeType: '團隊', owner: '何欣穎', status: '正常', headcount: 8, budget: 3800000 },
              { nodeId: 'TM-222', name: '雲端架構組', nodeType: '團隊', owner: '羅子謙', status: '規劃中', headcount: 6, budget: 2800000 }
            ]
          }
        ]
      },
      {
        nodeId: 'BG-300',
        name: '營運支援中心',
        nodeType: '中心',
        owner: '楊惠如',
        status: '正常',
        headcount: 15,
        budget: 6100000,
        children: [
          { nodeId: 'DP-310', name: '財務管理部', nodeType: '部門', owner: '謝明哲', status: '正常', headcount: 7, budget: 2900000 },
          { nodeId: 'DP-320', name: '人力資源部', nodeType: '部門', owner: '宋佳玲', status: '正常', headcount: 8, budget: 3200000 }
        ]
      }
    ];
  };
}(typeof window !== 'undefined' ? window : this));
