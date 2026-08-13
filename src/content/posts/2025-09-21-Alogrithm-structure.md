---
title: 数据结构(算法)
commentSlug: '2025-09-21-Alogrithm--structure'
published: 2025-09-21T00:00:00.000Z
draft: false
description: '我感觉将算法放到一个板子里面容易忘记自己学了什么,所以我以后单独开个专栏来记录算法知识点'
image: /post-covers/2025-09-21-alogrithm-structure.jpg
tags:
  - 算法
  - 热爱
category: 算法
lang: zh-CN
---
OK,数据结构第一舞
目前想学知识点:

1. 笛卡尔树
2. 线段树

## 区间信息维护

### 笛卡尔树

笛卡尔树的结构主要是: 一个数字有两个属性:**数列中的位置和数值**,满足两个性质,将位置作为键值,是一颗BST树,对这颗树进行中序遍历,返回的就是这个序列的顺序(其实就是满足一个性质,节点的左孩子小于当前节点,节点的右孩子大于当前节点)

实现方法:

1. 当前插入节点 x, 根据 x 的 value 不断从单调栈中弹出节点(根据你需要的笛卡尔树需要满足小根堆还是大根堆的性质)
2. 最晚弹出的节点 y 以及y的整棵子树成为 x 的左子树
3. 假设 x 在 单调栈中还压着 z 节点, x 成为 z 的右孩子
4. 将节点 x 根据 value 加入单调栈

```cpp
#include<bits/stdc++.h>
using namespace std;
#define int long long
signed main(){
	ios::sync_with_stdio(false); cin.tie(0);
	int n;
	cin >> n;
	vector<int> p(n + 1, 0);
	for(int i = 1; i <= n; i++) cin >> p[i];
	deque<int> dq;
	vector<int> left(n + 1, 0);
	vector<int> right(n + 1, 0);
	for(int i = 1; i <= n; i++){
		int last = -1;
		while(!dq.empty() && p[i] <= p[dq.back()]){
			last = dq.back(); dq.pop_back();
		}
		if(last != -1){
			left[i] = last;
		}
		if(!dq.empty()){
			right[dq.back()] = i;
		}
		dq.push_back(i);
	}
}
```

### 高维前缀和(SOSDP)

什么是 SOSDP,其实就是一个**子集DP**

比如 $DP[S1] = \sum_{S1_{children}} DP[S1_{children}]$

[子集和超集](https://ac.nowcoder.com/acm/contest/19483/B)

```cpp
#include<bits/stdc++.h>
using namespace std;
#define int long long

signed main(){
    int n,m;
    cin >> n >> m;
    vector<int> a(n);
    for(int i = 0; i < n; i++){
        cin >> a[i];
    }
    vector<int> sum(1 << n, 0);
    auto dfs = [&](auto dfs, int i, int status) ->void{
        if(i >= n) return;
        sum[status | (1 << i)] = sum[status] ^ a[i];
        dfs(dfs, i + 1, status);
        dfs(dfs, i + 1, status | (1 << i));
    };
    dfs(dfs, 0, 0);
//     for(int i = 0; i < (1 << n); i++){
//         cout << sum[i] << " ";
//     }cout << endl;
    vector<int> sum1(1 << n, 0);
    for(int i = 0; i < (1 << n); i++){
        sum1[i] = sum[i];
    }
    for(int j = 0; j < n; j++){
        for(int i = 0; i < (1 << n); i++){
            if((i >> j) & 1){
                sum1[i] += sum1[(i ^ (1 << j))];
            }
        }
    }
    vector<int> sum2(1 << n, 0);
    for(int i = 0; i < (1 << n); i++){
        sum2[i] = sum[i];
    }
    for(int k = 0; k < n; k++){
        for(int i = 0; i < (1 << n); i++){
            if((i >> k & 1) == 0){
                sum2[i] += sum2[(i ^ (1 << k))];
            }
        }
    }
    for(int i = 0; i < m; i++){
        int k, sta = 0, sta1 = (1 << n) - 1;
        int ssum1 = 0;
        cin >> k;
        for(int i = 0, temp; i < k; i++){
            cin >> temp;
            temp --;
            sta |= (1 << temp);
        }
        cout << sum1[sta] << " " << sum2[sta] << endl;
    }

}
```

### 前缀和变形

> [!NOTE]
> 前缀和变形是针对于 数组 和 差分数组 之间的关系。

首先我们需要理解什么是差分,差分的作用是什么,一般来说,差分就是原始数组的差值,为什么需要构建这个数组,因为我们针对于一个区间进行操作的时候,直接进行操作时间复杂度过高,这个时候我们的差分数组就出现了,**在原始数组中对一个区间进行操作就相当于在差分数组中对两个位置进行操作**为什么是这样的?**因为差分数组是原始数组的相邻数组之间的差值,我们对一个区间进行操作的时候,在差分数组来说这个区间是不会变化的,变化的是这个区间的首尾**

[糖果分配](https://ac.nowcoder.com/acm/contest/19483/H) 这个题目就是一个典型的差分问题,只是这个不仅仅是原数组的一维差分,可以多维差分,很能让我们更清晰的认识.

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long
const int mod = 1e9 + 7;

void slove(){
    int n, m;
    cin >> n >> m;
    vector<int> sum1(n + 2, 0);
    vector<int> sum2(n + 2, 0);
    vector<int> sum3(n + 2, 0);
    vector<int> sum4(n + 2, 0);
    for(int i = 0; i < m; i++){
        int type, pos;
        cin >> type >> pos;
        if(type == 1){
            sum1[pos] += 1;
        }else if(type == 2){
            sum2[pos] += 1;
        }else{
            sum4[pos] += 1;
            sum3[pos + 1] += 2;
        }
    }
    for(int i = 1; i <= n; i++){
        sum1[i] = (sum1[i] + sum1[i - 1]) % mod;
    }
    for(int k = 0; k < 2; k++){
        for(int i = 1; i <= n; i++){
            sum2[i] = (sum2[i] + sum2[i - 1]) % mod;
        }
    }
    for(int k = 0; k < 3; k++){
        for(int i = 1; i <= n; i++){
            sum3[i] = (sum3[i] + sum3[i - 1]) % mod;
        }
        if(k == 0){
            for(int i = 1; i <= n; i++){
                sum3[i] += sum4[i];
            }
        }
    }
    for(int i = 1; i <= n; i++){
        cout << ((sum1[i] + sum2[i]) % mod + sum3[i]) % mod << " ";
    }
    cout << endl;
}
signed main(){
    int t;
    cin >> t;
    while(t--) slove();
}
```
