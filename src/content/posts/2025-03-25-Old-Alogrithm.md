---
title: 算法笔记1.0
commentSlug: '2025-03-25-Old-Alogrithm'
published: 2025-03-25T00:00:00.000Z
draft: false
description: Hello-World，算法学习的开始
image: /post-covers/2025-03-25-old-alogrithm.jpg
tags:
  - 热爱
  - 日常学习
category: 算法
lang: zh-CN
---
# 左神课程笔记

# 前置基本问题:

## 1. 归并分治算法

### 大范围的答案 等不等于 左边部分 + 右边部分 + 跨越左右两边的答案

💡考虑跨左右 **有序**是否能提升便捷性。

- **归并排序:**

💡归并排序是一个稳定的排序。

**分成左右，merge排序**

```cpp
#include<bits/stdc++.h>
using namespace std;
const int N = 1e5+10;
int a[N];
int help[N];

void merge(int l,int r){
    int i = l, j = ((l + r) >> 1) + 1, t1 = 0;

    while(i <= ((l + r)>> 1) && j <= r){
          help[t1++] = (a[i] <= a[j]) ? a[i++] : a[j++];}
    while(i <= ((l + r)>> 1) ){. help[t1++] = a[i++];  }
    while(j <= r){. help[t1++] = a[j++];  }

    for(i = r; i >=l; i--){. a[i] = help[--t1];  }
}
void guibin(int l, int r,int n){
     if(l >= r) return ;

     guibin(l, (l + r) >> 1, n);
     guibin(((l + r) >> 1)+1, r, n);
     merge(l, r);
}

```

- **归并分治**

💡

归并分治是基于归并排序，在归并排序的基础上进行分 **左右 + 左右中的过渡**，主要是**分析左右中的过渡过程是否跟左右部分的有序性相关。**

## 2. 随机快速排序

**基本内容与快速排序保持一致，只是在选择pivot的时候是随机选择。**

<aside>
💡

pivot的随机选择是从概率上讲快速排序的时间复杂度降低到**O(nlogn)**

**快排的重要部分是 partition函数 部分**

```cpp
#include<bits/stdc++.h>
using namespace std;

const int N = 1e5+10;
int nums[N];

int a,b;
void swap(int i, int j){
    int temp;
    temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}

void part(int l, int r, int x){
    int  i = l; // 小于区域 a 大于区域 b
    a = l, b = r;
    while(i <= b){
         if(nums[i] < x){
            swap(i++,a++);
         }else if(nums[i] > x){
            swap(i, b--);
         }else i++;
    }
}

void quick__sort(int l, int r){
    if(l >= r){
        return;
    }
    int pivot = nums[l];
    part(l, r, pivot);
    quick__sort(l,a-1);
    quick__sort(b+1,r);
}
```

### 可以用 partition 来寻找 第k大 第k小 (荷兰国旗问题)

```cpp
#include<bits/stdc++.h>
using namespace std;

const int N = 1e5+10;
int nums[N];

int a, b;

void swap(int i, int j){
    int temp = nums[i];
    nums[i] = nums[j];
    nums[j] = temp;
}

void partition(int l, int r, int x){
    int i = l;
    a = l, b = r;
    while(i <= b){
          if(nums[i] < x){
            swap(i++,a++);
          }else if(nums[i] > x){
            swap(i, b--);
          }else i++;
    }

}
int find(int k, int n){
    int ans = 0;
    for(int l = 0, r = n; l <= r;){
        partition(l, r, nums[l]);
        if(k < a){
            r = a -1;
        }else if(k > b){
            l = b + 1;
        }else{
            ans = nums[k];
            break;
        }
    }

    return ans;
}

```

## 构建前缀信息（46）

常见构建

- 构建前缀信息 （**最早 最晚） 出现的位置**

1. 前缀和来 求区间和

- sum[i] = sum[i-1] + a[i]
- {l , r} → sum[r + 1] - sum[l] 2. 求 区间累加和 为确定值的 最长长度（子数组个数）

- 记录 t = sum[i] - aim 的最早出现次数（i 之前的 t 的出现个数）3. 正数 和 负数 相等的 最长数组长度

- 正数相当于 1 负数相当于 -1 求区间为 0 1的子数组最长长度

4.  区间大于 0 的最长数组长度 （值只有 -1, 1）

- aim = sum[i] - sum[j] ≥ 0
- [ ] if sum[i] > 0 → ans = i
- [ ] if sum[i] ≤ 0 → sum[i] -1 最早出现的位置

5.  移除最短的数组子数组长度 sum 能被 p 整数

- 与 余数相关
- sum1 % p = a // sum2 % p = b
- if(a + b % p == 0) (sum1 + sum2) % p == 0
- 整体 aim = sum(总) % p → 看哪个区间的 的余数 (t + aim) % p == 0
- find = (t + p - aim) % p **(同余原理) → 与环也有关**
-

💡

单调队列 和 单调栈 一样，保存着对于答案的可能性，并且从栈中弹出的时候，进行计算，不进行后续的计算，一般应用于 区间问题。

**核心思想 : 越往后的 满足要求更好的选择 更好**

## 单调队列

单调队列基本用法 → 用来维护一个**窗口里面的最值（左闭右开）**

<aside>
💡
因为从左弹出的时候，这个队列无论如何是没有过期下标的（要不一开始被最值从右边顶出去了，要不越界被左边弹出去了）

```cpp
deque<int> q;
    for (l = r = 0; r < n; r++)
    {
        while (!q.empty() && a[r] >= a[q.back()])
        {
            q.pop_back();
        }
        q.push_back(r);
        if (q.size() == limit + 1)
        {
            if (l++ == q.front())
            {
                q.pop_front();
            }
        }
    }
```

### 优先队列扩展

1. 区间和 小于 定值的 最短长度

```cpp
 int shortestSubarray(vector<int>& nums, int k) {
    int n = nums.size();
    vector<long long> sum(n + 1, 0);
    deque<int> q; // 小 -> 大
    for(int i = 1; i <= n; i++){
        sum[i] = sum[i-1] + nums[i-1];
    }
    int ans = INT_MAX;
    q.push_back(0);
    for(int i = 1; i <= n; i++){
        while(!q.empty() && sum[i] - sum[q.front()] >= k){
            //cout << ans << " " << i - q.front() << endl;
            ans = min(ans,i - q.front());
            q.pop_front();
        }
        while(!q.empty() && sum[i] <= sum[q.back()]){
            q.pop_back();
        }
        q.push_back(i);
    }
    return ans == INT_MAX ? -1 : ans;
    }
```

### 双端队列吃药任务安排

```cpp

    int n, s;
    cin >> n >>s;
    vector<int> a(n);
    vector<int> b(n);
    for(int i = 0; i < n; i++) cin >> a[i]; // 人的体力
    for(int i = 0; i < n; i++) cin >> b[i]; // 任务的需求
    sort(a.begin(),a.end());
    sort(b.begin(),b.end());
    int ans = 0; // 最少的药丸次数
    deque<int> q;
    /*
          先看每一个的力所能及 放入队列中
      */

    for(int i = 0, p = 0; i < n; i++){
        while(p < n && b[p] <= a[i]){
            q.push_back(b[p++]);
        }
        if(!q.empty() && a[i] >= q.front()){
           q.pop_front();
        }else {
            while(p < n && b[p] < a[i] + s){
                q.push_back(b[p++]);
            }
            if(q.empty()){
                cout << "can't do it" << endl;
                return 0;
            }else{
                ans++;
                q.pop_back(); // 吃药取最大
            }
        }
    }
    cout << ans << endl;
    return 0;
```

## 单调栈

- 基本使用方法 维护 **左右侧** 比 当前元素 **大或者小** 的最近位置

<aside>
💡

构建一个 栈 → 越后出现的值 有更大的**影响力**

**找出 以某个值为最值的 子数组（最长 或者 对这个子数组进行一些计算）**

**同时间维护左右的 最近的 最值**

```cpp
    stack<int> s; // 记录下标
    for(int i = 0; i < n; i++){
        while(!s.empty() && a[s.top()] >= a[i]){
            // i 为右边
            int cur = s.top(); s.pop(); // 中间
            int l = s.empty() ? -1 : s.top(); // 左边
        }
        s.push(i);
    }
    while(!s.empty()){
        int cur = s.top(); s.pop();
        int l = s.empty() ? -1 : s.top();
        ans += (cur - l) * (n - cur) * a[cur];
    }
```

创新 :

求 **子数组中的最小值的和**

<aside>
💡

用 单调栈 → 求出左右两边 小于(大于) 这个值的位置 → 在这个中间 i位置的值便是最值

```cpp
#include<bits/stdc++.h>
using namespace std;
int main(){
    int n;
    cin >> n;
    vector<int> a(n);
    for(int i = 0; i < n; i++){
        cin >> a[i];
    }

    // 在子数组中 cur 位置为最小 i 为 右边
    stack<int> s; // 记录下标
    long long ans = 0;
    for(int i = 0; i < n; i++){
        while(!s.empty() && a[s.top()] >= a[i]){
            int cur = s.top(); s.pop(); // 中间
            int l = s.empty() ? -1 : s.top(); // 左边
            ans += (cur - l) * (i - cur) * a[cur];
        }
        s.push(i);
    }
    while(!s.empty()){
        int cur = s.top(); s.pop();
        int l = s.empty() ? -1 : s.top();
        ans += (cur - l) * (n - cur) * a[cur];
    }
    return 0;
}
```

### 实现最小字典序（单调栈）

<aside>
💡

利用单调栈来维护一个从小到大的 stack

```cpp
   for(int i = 0; i < a.size(); i++){
        in[a[i] - 'a']++;
    }

    stack<pair<char,int>> s;
    vector<bool> vis(26,false);

    for(int i = 0; i < a.size(); i++){
    if(!vis[a[i] - 'a']){
    while(!s.empty() && s.top().first > a[i] && in[s.top().first - 'a'] >= 1){
            vis[s.top().first- 'a'] = false;
            s.pop();
        }
    vis[a[i] - 'a'] = true;
    s.push({a[i], i});
    }
    in[a[i] - 'a']--;
    }
    string ans = "";

    while(!s.empty()){
        ans = s.top().first + ans;
        s.pop();
    }
```

## 滑动窗口 + 双指针（视频）

# 数据结构

## 前缀树（字典树）

<aside>
💡

前缀树有点像链式前向星，是一个用静态数组来连接。

**重点部分**

**cnt:用序号表示连接，如果这个节点没有使用过，他把这个节点用cnt来编号，然后cur会使用它来跳转，会到达一个没有去过的层次。**

```cpp
int cnt = 1; // 层次编号
// 插入单词
void insert(const string& word) {
    int cur = 1;
    pass[cur]++;
    for (char ch : word) {
        int path = ch - 'a';
        if (tree[cur][path] == 0) {
            tree[cur][path] = ++cnt;
        }
         cur = tree[cur][path];
        pass[cur]++;
    }
    end[cur]++;
}
// 查询前缀的数量
int prefixNumber(const string& prefix) {
    int cur = 1;
    for (char ch : prefix) {
        int path = ch - 'a';
        if (tree[cur][path] == 0) {
            return 0;
        }
        cur = tree[cur][path];
    }
    return pass[cur];
}
// 删除单词
void deleteWord(const string& word) {
    if (prefixNumber(word) > 0) {
        int cur = 1;
        for (char ch : word) {
            int path = ch - 'a';
            if (--pass[tree[cur][path]] == 0) {
                tree[cur][path] = 0;
                return;
            }
            cur = tree[cur][path];
        }
        end[cur]--;
    }
}
// 清空前缀树
void clear() {
    memset(tree, 0, sizeof(tree));
    memset(pass, 0, sizeof(pass));
    memset(end, 0, sizeof(end));
    cnt = 1;
}
```

### 以下是关于 **字典树 + 二进制**运算:

```cpp
const int N = 1e3+10;
const int M = 2;

int pass[N];
int End[N];
int tree[N][M];
int cnt = 1;

void insert(int s){
     int cur = 1;
     for(int i = 63; i >= 0; i--){
         int temp = ((1 << i) & s) >>i;
         //cout << temp << endl;
        if(tree[cur][temp] == 0){
            tree[cur][temp] = ++cnt;
        }
        cur = tree[cur][temp];
     }
     // 我如何取到这个二进制上面的值
}

int exam(int t){
    int cur = 1;
    int Max = 0;
    for(int i = 63; i >= 0; i--){
        int temp = (t >> i) & 1;
        // 最好 temp ^ aim == 1 aim == 1 ^ temp
        int aim = 1 ^ temp;
        if(tree[cur][aim] == 0){
           aim ^= 1;
        }
        Max |= ((temp ^ aim) << i);
        cur = tree[cur][aim];
    }
    return Max;
}
```

## 单调栈 + 单调队列

stack<int> st 便是单调栈的形式，只是栈中的元素是单调的。

priority_queue<int> q 便是单调队列（优先队列）的形式，在优先队列中的元素是单调的。

## 并查集（模版）

```cpp
const int N = 1e5 + 10;
int father[N];
// 初始化并查集
void build(int n) {
    for (int i = 0; i < n; i++) {
        father[i] = i;
    }
}
// 查找元素的根，并进行路径压缩
int find(int i) {
    if (i != father[i]) {
        father[i] = find(father[i]);
    }
    return father[i];
}
// 判断两个元素是否属于同一个集合
bool isSameSet(int x, int y) {
    return find(x) == find(y);
}
// 合并两个集合
void unite(int x, int y) {
    father[find(x)] = find(y);
}

```

### 基本建图方法

- vector **数组建图**

```cpp
vector<pair<int,int>>a[10005];
```

- **链式前向星**

<aside>
💡     **初始的 cnt 是没有使用过的
    然后将这个 cnt 对应 v节点
    next 表示 下一条边的编号
    head[u] 节点的 头部边的编号**
---

**u -> new -> old
一开始的 head[u] -> old
现在将 head[u] -> new 将 new 的 next -> old**

```cpp
const int N = 1e5+10;

int cnt = 0;
int head[N];
struct{
    int to, next, w;
}edge[N];

void init(){
    for(int i = 0; i < N; i++){
        head[i] = -1;
        edge[i].next = -1;
    }
    cnt = 1;
}

void add(int u, int v, int w){
    edge[cnt].to = v;
    edge[cnt].w = w;
    edge[cnt].next = head[u];
    head[u] = cnt++;
}
// 遍历方法
void ex(){
    int u ;
    for(int e = head[u]; e > 0; e = edge[e].next){
        int v = edge[e].to;
     }
}
```

## 拓扑排序

<aside>
💡 所谓的拓扑排序，其实是图论里面的一个常见手段，常用于有前后关系的节点状态问题。

常从 **入度为0** 的节点开始访问**。（与 priority_queue<int> 小根堆结合应用）**

_如果无法把所有的点都删掉，说明有向图里有环_

```cpp
const int N = 1e5+10;
int queue[N]; // 可以用 STL 代替 （queue）
int indegree[N];
```

### 拓扑排序扩展知识（类似树型dp）

<aside>
💡

将 上游节点的信息 → 推送到下游节点

## 倍增算法 + ST表（用于区间查询最值，gcd）(先看 基础dp )

<aside>
💡

原理:**每一个数字 都能用 二进数 来表示 // 尽量逼进 目标值**

应用: 可重复贡献问题

前提:后面的点 跳的距离 会 大于等于 前面的点

跳跃公式:**ST[ i ][ p ] = ST[ ST[ i ][ p-1 ] ][ p-1]** p → 跳 2 的 p 次方

从 **大 → 小** 尝试

仅需 初始化 ST[ i ][ 0 ] ，其余 可以用 跳跃公式 解决 // 从列开始填

<aside>
💡

```cpp
 ST[i][p] = max(ST[i][p-1], ST[i + 2 ^ p-1][p-1])
 ST[i][p] = min(ST[i][p-1], ST[i + 2 ^ p-1][p-1])
 ST[i][p] = gcd(ST[i][p-1], ST[i + 2 ^ p-1][p-1])

 (i , j) -> max(ST[i][p], ST[j - 2 ^ p + 1][p])
         // p == log2(i - j + 1)
```

</aside>

Max，Min的基本代码

```cpp

const int N = 1e3 + 10;
int Log2[N];
int stmax[N][N];
int stmin[N][N];
int num[N];
void bulid(int n){
    Log2[0] = -1;
    for(int i = 1; i <= n; i++){
        Log2[i] = Log2[i >> 1] + 1;
        stmax[i][0] = num[i];
        stmin[i][0] = num[i];
    }

    for(int p = 1; p <= Log2[n]; p ++){
        for(int i = 1; i <= n; i++){
            stmax[i][p] = max(stmax[i][p-1],stmax[i + (1 << (p-1))][ p-1 ]);
            stmin[i][p] = min(stmin[i][p-1],stmin[i + (1 << p-1)][p-1]);
        }
    }
}
```

扩展的可重复贡献区间问题:

**区间与 区间或 (两个相同的数字 与 或 不会影响结果)**

## 树上问题

### 树上倍增 + LCA

1. tarjian算法

<aside>
💡

批量 离线 查询

如果访问的 ans -> u 的对应节点v 访问过 ans = v 的代表节点

理解:

          因为 你到这个节点的时候，对应的节点访问过了的话，那些节点是在一个集合里面的，然后 节点遍历是 属于 DFS，所以都是 分支访问，访问完这个 分支， 节点进行汇总集合。

</aside>

```cpp
void tarjan(int u, int f){
    vis[u] = true;
    for(int e = head[u]; e != 0; e = ed[e].next){
        int v = ed[e].to;
        if(v != f){
            tarjan(v, u);
            father[v] = u;
        }
    }

    for(int e = q_head[u]; e != 0; e = que[e].next){
        int v = que[e].to;
        if(vis[v]){
            ans[que[e].w] = find(v);
        }
    }
}
```

1. ST表

<aside>
💡

当 Deep 深度数组 到达同一层的时候 所对应的 节点 是否相同

相同 : LCA = Deep 小的

不相同:

再次同时间跳（only 不跳到同一节点我们才跳）

ST表实现的问题 : 加快 Deep数组的跳跃过程

```cpp

int LCA(int u, int v){
    /*
        u在下面
     */
    if(Deep[u] < Deep[v]){
        int t = u;
        u = v;
        v = t;
    }
    for(int i = power; i >= 0; i--){
        if(Deep[ST[u][i]] >= Deep[v]){
            u = ST[u][i];
        }
    }

    if(u == v){
        return v;
    }

    for(int i = power; i >= 0; i--){
        if(ST[u][i] != ST[v][i]){
            u = ST[u][i];
            v = ST[v][i];
        }
    }
    return ST[v][0];

}
```

### 树的重心（有一个或者两个）

树的重心的基本定义:

- 最大子树的节点数 足够小
- 每棵子树的节点数 不超过 总节点数的一半
- 所有节点 汇聚到 重心的 步数最少

补充性质:

- 一棵树最多有两个重心，两个重心一定相邻
- 如果树上增加或者删除一个叶节点，重心最多移动一条边
- 将两棵树连起来，新树的重心一定在两个原来重心的连线上
- 如果边权为正，所有节点走向重心的 总距离和 最小

1. 求法一 : 最大子树 足够小

```cpp
int ans = 0, best = INT_MAX;
/*
  重心:
   以当前节点为 重心，所有子树中 最大数量的子树的 数量足够小
*/
int dfs(int u, int f){
    Size[u] = 1;
    int mx = 0;
    for(int v = head[u]; v != 0; v = edge[v].next){
        int e = edge[v].to;
        if(e != f){
            dfs(e,u);
            Size[u] += Size[e];
            mx = max(mx, Size[e]);
        }
    }
    mx = max(mx, n - Size[u]);
    if(mx < best || (mx  == best && u < ans)){
        ans = u;
        mx = best;
    }

}
```

1. 求法二 :每棵子树的节点数 不超过总节点的一半

```cpp
int Size[N];
vector<int> ans;
void dfs(int u, int f){
    Size[u] = 1;
    int Mx = 0;
    for(int e = head[u]; e != 0; e =edge[e].next){
        int v = edge[e].to;
        if(v != f){
            dfs(v,u);
            Size[u] += Size[v];
            Mx = max(Size[v], Mx);
        }
    }
    Mx = max(Mx, n - Size[u]);
    if(Mx <= n / 2){
        ans.push_back(u);
    }
}
```

扩展: 带 点权的树 如何求重心

仅 修改一个 → Size[u] 的初始值 变成了 点权重 56分以上

<aside>
💡

首先:重心 是与 边权 没有关系的，所谓的点权，可以理解为一个独立的树，树中的节点数量 就是 点的权重

```cpp
int Size[N];
int a[N];
vector<int> ans;
int sum; // sum 是总点权和
void dfs(int u, int f){
    Size[u] = a[u];
    int Mx = 0;
    for(int e = head[u]; e != 0; e =edge[e].next){
        int v = edge[e].to;
        if(v != f){
            dfs(v,u);
            Size[u] += Size[v];
            Mx = max(Size[v], Mx);
        }
    }
    Mx = max(Mx, sum - Size[u]);
    if(Mx <= sum / 2){
        ans.push_back(u);
    }
}
```

### 树的直径

**树上的最长路径**

- 两次 DFS（仅使用没有 负边权）

<aside>
💡能得到路径信息
1. 从根节点 找离根节点最远的点
2. 在从 这个节点找离这个节点最远的点

```cpp
/*
  法一: 两次dfs
  优点:能得到路径信息
*/
int start, End;

int di[N]; // 记录从规定节点到 当前节点到距离
int la[N]; // 记录路径

void dfs(int u, int f, int w){
      la[u] = f;
      di[u] = di[f] + w;
      for(int e = head[u]; e != 0; e = ed[e].next){
        int v = ed[e].to;
        if(v != f){
            dfs(v, u, ed[e].w);
        }
      }
}
pair<int,int> find_road(int n){
    dfs(1, 0, 0);
    start = 1;
    for(int i = 1; i <= n; i++){
        if(di[i] > di[start]){
            start = i;
        }
    }
    dfs(start, 0, 0);
    End = 1;
    for(int i = 1; i <= n; i++){
        if(di[i] > di[End]){
           End = i;
        }
    }
    return {start, End};
}

```

- 树型dp

<aside>
💡

只能得到 直径长度

```cpp
int Max_dia = INT_MIN;
void dp(int u, int f){
    for(int e = head[u];  e != 0; e = ed[e].next){
        int v = ed[e].to;
        if(v != f){
            dp(v, u);
            Max_dia = max(Max_dia, dist[u] + dist[v] + ed[e].w);
            dist[u] = max(dist[u], dist[v] + ed[e].w);
        }
    }
}
```

相关结论（边权为正）

1. 如果有 多条直径，这多条直径一定 有一个 **公共路段**
2. 树上任意一点，相隔最远的点的集合，**直径的两端点至少有一个在其中。**

### 树上差分

1. 点差分

<aside>
💡

**1.计算公式** （子节点的 变化 会**向上传递**)

(x → y) + v

    x += v

    y += v

LCA -= v

LCA_father -= v

**2.合并**

num[i] += num[所有孩子]

</aside>

1. 边差分

<aside>
💡

1.  计算公式
    点权变化:

           (x → y) + v

            x += v

            y += v

            LCA -=  2*v

2.  更新权重

num[ i → j 边] += weight[ j ]（点权）

weight[ i ] += weight[ 所有子节点 ]

## 树状数组（视频）

树状数组 是 处理区间查询 的方法。

- 一般处理 **可差分信息 （总体 是 由部分构成的）| 下标一定从 1 开始**
- 怎么得到 最右边的 1 → i & -i

**常见有以下四种查询类型**

- 单点增加 + 范围查询

管理范围 (去除最右边的 1（ lowbit(i) ） + 1， 自己)

<aside>
💡

输入的时候 tree数组 用add 方法进行添加

```cpp
int tree[N];
// 单点增加  区间查询
int n; //数组长度
int lowbit(int i){
    // 取最右边的 1
    return i & -i;
}
void add(int i, int w){
     // 下标 + 最右边的 1 的地方 + w
     while(i <= n){
        tree[i] += w;
        i += lowbit(i);
     }
}
// 1 -- r 的范围和
int sum(int r){
    // sum = tree[x] 自己 然后不断去除最右边的 1
    int ans = 0;
    while(r > 0){
        ans += tree[r];
        r -= lowbit(r);
    }
    return ans;
}
```

- 范围增加 + 单点查询 （改成差分数组）

<aside>
💡

原数组 a[i] = sum(delat[1] + …+ delat[i])

delat[i] = a[i] - a[i - 1]

差分数组 可以 实现 原数组的 区间增减

delat[l] + w, delat[r + 1] - w.

> 构建 tree数组的时候, add_sum( i , w);

```cpp
int tree[N];
// 单点增加  区间查询
int n; //数组长度
int lowbit(int i){
    // 取最右边的 1
    return i & -i;
}
void add(int i, int w){
     // 下标 + 最右边的 1 的地方 + w
     while(i <= n){
        tree[i] += w;
        i += lowbit(i);
     }
}
// 查询 r 位置的值
int sum(int r){
    // sum = tree[x] 自己 然后不断去除最右边的 1
    int ans = 0;
    while(r > 0){
        ans += tree[r];
        r -= lowbit(r);
    }
    return ans;
}
// 增加 l -> r 的值
void add_sum(int l, int r)
{
  add(l, w),add(r + 1, -w);
}
```

- 范围增加 + 范围查询

<aside>
💡

sum(1 → r)

= r _ Sum( delat[1 → r] ) - sum(1 → r)[(i - 1) _ delat[i] ]\

### 维护 两个差分数组 Di + （i - 1) \* Di

```cpp

const int N = 1e5 + 10;
// Di
int tree1[N];
// (i - 1) * Di
int tree2[N];

int n;
int lowbit(int i){
    return i & -i;
}
void add(int i, int w){
    int t = i;
    while(t <= n){
        tree1[t] += w;
        t += lowbit(t);
    }
    t = i;
    int W = (i - 1) * w;
    while(t <= n){
        tree2[t] += W;
        t += lowbit(t);
    }
}
void Add(int l, int r, int w){
    add(l, w); add(r + 1, -w);
}
// 1 -> i 的和
int sum(int i){
    int ans = 0, t = i;
    while(t > 0){
        ans += (tree1[t] * i);
        ans -= tree2[t];
        t = t - lowbit(t);
    }
    return ans;
}
```

- 二维的单点增加 + 范围查询

要从 1 1开始

```cpp
const int N = 1e3 + 10;
const int M = 1e3 + 10;
int tree[N][M];

int n, m;
int lowbit(int i){
    return i & -i;
}
void add(int x, int y, int w){
    for(int i = x; i += lowbit(i); i <= n){
       for(int j = y; j += lowbit(j); j <= m){
        tree[i][j] += w;
       }
    }
}
// 1 -> x 1 -> y
int sum(int x, int y){
     int ans = 0;
     for(int i = x; i > 0; i -= lowbit(i)){
        for(int j = y; j > 0; j-= lowbit(j)){
            ans += tree[i][j];
        }
     }
     return ans;
}
```

- 二维数组的 范围增加 + 范围查询

<aside>
💡

delat[i] = a[i][j] - a[i-1][j] - a[i][j-1] + a[i-1][j-1]

a[i][j] = (1, 1) → (i, j) 的 delat 累加和

</aside>

### 逆序队问题

## 线段树

基本线段树

# 动态规划（先做题目）

## 背包dp （66 - 75）

## 区间dp

将大范围 划分为 若干个 小范围 的问题

<aside>
💡

可能性展开:

基于 **两侧端点** 讨论

基于 **范围划分** 讨论

## 状态dp

利用 二进制 的 0 1 来表示 节点 状态

## 树型dp

将 子树的 信息 返回给父亲

<aside>
💡

父亲节点的 ans **依赖于 子树的信息**

</aside>

## 数位dp

判断 **数字的 可能性**

<aside>
💡

大部分都是 从左 向 右 进行尝试（线性展开）

## 换根dp

将 根节点 互换，要求值的变化

## 轮廓线dp

## 三进制状压dp

## dp优化

# 字符串

## KMP

**前缀函数**

<aside>
💡

NEXT 函数构建

     前后缀 匹配长度

```cpp
int Next[N];
void get_next(string s){
    Next[0] = -1;
    Next[1] = 0;
    int i = 2, cn = 0;
    // Next[i] 表示的是 1 - i-1 的最长前后缀匹配长度
    while(i < s.size()){
        if(s[i - 1] == s[cn]){
            Next[i++] = ++cn;
        }else if(cn > 0){
            cn = Next[cn];
        }else{
            Next[i++] = 0;
        }
    }
}
```

<aside>
💡

KMP 是依靠这个 前缀函数来实现的

如果当前 的字符不匹配

需要检测的 字符，根据 NEXT 数组 向前跳转

### 扩展 KMP （Z数组）前缀匹配问题

动态图展示 🔗:[https://personal.utdallas.edu/~besp/demo/John2010/z-algorithm.htm](https://personal.utdallas.edu/~besp/demo/John2010/z-algorithm.htm)

<aside>
💡

**Z[i] 表示 s[0 - n-1] 和 s[i - n-1] 的最长匹配长度**

线性加速过程:

       如果在最右的最长前缀匹配区间中，会加速前缀加速匹配过程

```cpp

const int N = 2e6 + 10;
int z[N];
void Z(string s){
     z[0] = 0;
     int n = s.size();
     for(int i = 0, r = 0, l = 0; i < n;i++){
         if(i <= r && z[i - l] < r - i + 1){
            z[i] = z[i - l];
         }else{
            z[i] = max(0, r - i + 1);
            while(i + z[i] < n && s[z[i]] == s[i + z[i]]) z[i]++;
            if(i + z[i] - 1 > r){
                r = i + z[i] - 1;
                l = i;
            }
     }
     }
}
```

## Manacher

<aside>
💡

**P[i] 数组是保留了更新的数组的回文串长度**

**# a # a # a # 总长度 为 2 \* n + 1**

**1 2 3 4 3 2 1**

```cpp
const int N = 3e7;
int p[N];
int Max = 0;
string c(string s){
    string s1 = "#";
    for(auto x : s){
       s1 += x;
       s1 += '#';
    }
    return s1;
}
void manacher(string s){
     int n = s.length();
     int c = 0, r = 0;
     for(int i = 0, len; i < n; i++){
        len = r > i ? min(p[2 * c - i], r - i) : 1; // 至少的回文半径区域
        while(i  + len < n && i - len >= 0 && s[i + len] == s[i - len] ){
            len ++;
        }
        if(i + len > r){
            c = i;
            r = i + len;
        }
        Max = max(Max, len);
         p[i] = len;
     }
}
```

## AC自动机

## 字符串哈希

# 数学

## 埃式筛

<aside>
💡

如果这个 元素 没有访问过，便是质数，并且 **这个质数的所有倍数的值 就不是质数**

```cpp
void ehrlich(int n){
    vector<bool> vis(n + 1, false);
    for(int i = 2; i * i <= n; i++){
        if(!vis[i]){
            for(int j = i * i; j <= n; j +=i){
                vis[j] = true;
            }
        }
    }

    int cnt = 0; // 质数 记数 vis 未访问过的 便是质数字
    for(int i = 1; i <= n; i++){
        if(!vis[i]){
            cnt ++;
            cout << i << " ";
        }
    }cout << endl;
    }
```

## 乘法逆元

逆元含义:

$$
x\rightarrow \frac{1}{x}
$$

**法一 :扩展欧几里得 求逆元**

```cpp
typedef long long LL;
LL ExGCD(LL a, LL mod, LL &x, LL &y){
    if(mod == 0){
        x = 1; y = 0;
        return a;
    }
    LL d = ExGCD(mod, a % mod, x, y), t = x;
    x = y; y = t - a / mod * x;
    return d;
}
int ExGcdInv(int a, int mod){
    LL x, y;
    ExGCD(a, mod, x, y);
    return (x + mod) % mod;
}

```

**法二 : 快速幂 求逆元**

```cpp
LL fastpow(int a, int b, int mod){
    LL ret = 1;
    while(b){
        if(b & 1) ret = ret * a % mod;
        a = a * a % mod;
        b >>= 1;
    }
    return ret;
}
LL FermatInv(int a, int mod){
    return fastpow(a, mod - 2, mod);
}
```

**法三 : 费马小递推 求逆元**

$$
\text{inv}[i] = ( \text{mod} - (\text{mod} \div i) ) \times \text{inv}[\text{mod} \% i] \% \text{mod}
$$

```cpp
int invList[mod+ 10];
voidGetInv(int mod)
{
    invList[1]= 1;
for(int i= 2; i< mod; i++)
        invList[i]= 1LL* (mod- mod/ i)* invList[mod% i]% mod;
}
```

## 容斥原理

**奇 ➕ 偶 ➖**
两个集合:

$$
|A \cup B| = |A| + |B| - |A \cap B|
$$

三个集合:

$$
|A \cup B \cup C| = |A| + |B| + |C|
- |A \cap B| - |A \cap C| - |B \cap C|
+ |A \cap B \cap C|
$$

n个集合:

$$
\quad
\left| \bigcup_{i=1}^{n} A_i \right|
= \sum_{k=1}^{n} (-1)^{k+1}
\sum_{1 \leq i_1 < i_2 < \dots < i_k \leq n}
\left| A_{i_1} \cap A_{i_2} \cap \dots \cap A_{i_k} \right|
$$

相关题目:

- 计算区间 [1,n] 内不被给定质数整除的整数个数

<aside>
💡

因为 需要随机选 a0 → an 中的任意几个数的组合，所以用 **二进制的形式** 来计算

```cpp
typedef long long LL;

int lcm(int a, int b){
    return a / __gcd(a, b) * b;
}
int main(){
    int k, n;
    cin >> k >> n;
    vector<int> a(k);
    for(auto& x : a){
        cin >> x;
    }
    LL t = 1 << k;
    LL result = 0;
    for(int i = 1; i <= t; i++){
        int l = 1, bits = 0;
        for(int j = 0; j < k; j++){
           if(i & (1 << j)){
             bits++;
             if(l > n / a[i]){
                l = n + 1;
                // 相当于 没必要进行后续计算 因为 n / l == 0
                break;
             }
             l = lcm(l, a[i]);
           }
        }
        if(bits % 2) result += n / l;
        else result -= n / l;
    }
    cout << n - result << endl;
    return 0;
}
```

- 计算非互质整数对的个数
- 计算符合排列条件的方案数（n！的排列中，至少有 k 个字符 在原位上的 个数）

## 快速幂

- 基本快速幂

```cpp
typedef long long LL;
const int mod = 1e9 + 7;
LL fastpow(int a, int b){
    LL ant = 1;
    while(b){
        if(b & 1){
            ant = ant * a %mod;
        }
        a = a * a %mod;
        b >>= 1;
    }
    return ant % mod;
}
```

- 矩阵快速幂

<aside>
💡

矩阵快速幂 常用于 DP（固定线性递归）问题

1. **一维 k阶**（k 个式子） **时间复杂度 :O(logn \* 2^k)**

$$
f(n) = c_1 f(n-1) + c_2 f(n-2) + … + c_k f(n-k)
$$

1. **k维一阶**

$$
\mathbf{X}n = A \mathbf{X}{n-1}
$$

<aside>
💡

相当于 第 i 位置的 ans 需要第 i-1 位置的 ans（可能是二维的，以为着需要 i-1 位置的多个答案）

### 矩阵快速幂的基本伪代码

```cpp
vector<vector<int>> multiply(vector<vector<int>> a, vector<vector<int>> b){
    int n = a.size();
    int m = b[0].size();
    int k = a[0].size();
    vector<vector<int>> ans(n, vector<int>(m));
    // ans[i][j] == a的 第i行 * b的 第j列
    for(int i = 0; i < n; i++){
        for(int j = 0; j < m; j++){
            int temp = 0;
            for(int t = 0; t < k; t++){
                ans[i][j] +=a[i][t] * b[t][j];
            }

        }
    }
    return ans;
}

vector<vector<int>> power(vector<vector<int>> a, int t){
    int n = a.size();
    vector<vector<int>> ans(n, vector<int> (n, 0));
    for(int i = 0; i < n; i++) ans[i][i] = 1;
    while(t){
        if(t & 1) ans = multiply(ans, a);
        a = multiply(a, a);
        t >>= 1;
    }
    return ans;
}

```
