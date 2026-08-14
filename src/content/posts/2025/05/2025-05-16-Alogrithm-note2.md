---
slug: "2025-05-16-alogrithm-note2"
title: 算法笔记2.0
commentSlug: '2025-05-16-Alogrithm-note2'
published: 2025-05-16T00:00:00.000Z
draft: false
description: 本文章是 基于 左神课程 + 牛客课程 进行算法系统式学习的知识汇总。
image: /post-covers/2025-05-16-alogrithm-note2.jpg
tags:
  - 算法
  - 热爱
category: 算法
lang: zh-CN
---
## 相关学习方向思考

### 2025.8.18

1. 针对于学习的路径,由于前面学习的很多知识并没有打下坚实的基础,然后那时候刷题也没有跟上,所以现在针对于相关学习,是看一节左神的课+自己补前面的一个知识点,我感觉可以先补前面的知识点,然后再看一节后面相关的课

### 2025.8.21

1. 如果遇到一些题目超时了,有两个原因,第一种就是你这种方法本来就是不可行,第二种就是你被卡常了,就是有一个特判没有设置,你可以去尝试去用一个固定的常数去卡住他的超时线😄(亲试有效)

### 2025.8.27

1. 有一些问题,如果有明确的思路去解决,但是从正面去解决的话感觉难以实现的话,可以尝试反着去思考这个问题,比如,如果让你去解决不递减序列的相关问题,试着看可不可以转化为不递增序列去解决😄

## 基础算法

### 单调队列

> [!NOTE]
> 这是一次尝试

### 单调栈

### 逆序对

1. 树状数组

> 使用树状数组来求逆序队，主要要进行离散化，应为可以 a[i] 的值很大，但是 数组大小有限，不离散化的话，可能树状数组的 tree数组存不下。

思路:
从数组的右边开始便利，访问到当前元素的时候，检查树状数组中求和（比当前元素小的元素），因为是从右往左便利，如果有比当前元素小的，肯定在数组中是在当前元素的右边。

```c++
##include<bits/stdc++.h>
using namespace std;
const int N = 1e5 + 10;
int n;
int tree[N];
int lowbit(int i){
    return i & -i;
}
void add(int i, int w){
    while(i <= n){
        tree[i] += w;
        i += lowbit(i);
    }
}
// 1 - r
int sum(int r){
    int ans = 0;
    while(r > 0){
        ans += tree[r];
        r-= lowbit(r);
    }
    return ans;
}

signed main(){
    cin >> n;
    vector<int> a(n);
    for(int i = 0; i < n; i++)    cin >> a[i];
    // 离散化
    vector<int> b(n);
    b = a
    sort(b.begin(), b.end());
    map<int, int> mp;
    for(int i = 0; i < n; i++) mp[b[i]] = i + 1;
    // 求逆序队
    int ans = 0;
    for(int i = n - 1; i >= 0; i--){
        int r = sum(mp[a[i]] - 1);
        ans += r;
        add(mp[a[i]], 1);
    }
    cout << ans << endl;
    return 0;
}
```

### 归并分治

> 分治的含义是 整体的答案 $?=$ 左边的答案 + 右边的答案

1. 归并排序

> 归并排序是一个稳定的排序

- 整体的有序 是 **左边有序 + 右边有序 + 合并过程**

```c++
void merge(int l, int r){
    int mid = (l + r) >> 1;
    int i = l, j = mid + 1, t1 = 0;
    while(i <= mid && j <= r){
        help[t1++] = (a[i] <= a[j]) ? a[i++] :a[j++];
    }
    while(i <= mid) help[t1++] = a[i++];
    while(j <= r) help[t1++] = a[j++];
    for(int i = r; i >= l; i--){
        a[i] = help[--t1];
    }
}

void guibin(int l, int r){
    if(l >= r) return;
    int mid = (l + r) >> 1;
    guibin(l, mid);
    guibin(mid + 1, r);
    merge(l, r);
}
```

分治题目:
[leetcode-分治](https://leetcode.com/problem-list/divide-and-conquer/)

### 随机快排

$$


$$

### 离散化

> 如果数据规模大，但是数据量小的话，我们可以进行离散化处理。

- 给每一个值一个编号
- 法一

```cpp
vector<int> b(n);
b = a;
sort(b.begin(), b.end());
b.erase(unique(b.begin(), b.end()), b.end());
map<int, int> mp;
for(int i = 0; i < b.size(); i++){mp[b[i]] = i;}
```

### 类并查集

> 如果是分联通块进行计算，我们可以不使用并查集，使用一个简单的思路，给每一个联通块**编号**，从而来考虑每一个联通块之间的关系。

- [E. Graph Composition(div3)](https://codeforces.com/problemset/problem/2060/E)

  ```c++
  ##include<bits/stdc++.h>
  using namespace std;

  ##define int long long

  void __(){
      int n, m1, m2;
      cin >> n >> m1 >> m2;
      vector<vector<int>> a1(n + 1);
      vector<vector<int>> a2(n + 1);

      for(int i = 0; i < m1; i++){
          int u, v;
          cin >> u >> v;
          a1[u].push_back(v);
          a1[v].push_back(u);
      }

      for(int i = 0; i < m2; i++){
          int u, v;
          cin >> u >> v;
          a2[u].push_back(v);
          a2[v].push_back(u);
      }
      // 进行编号
      vector<int> col1(n + 1,0);
      vector<int> col2(n + 1, 0);
      auto dfs2 = [&](auto f,int u, int k) -> void{
          col2[u] = k;
          for(auto x : a2[u]){
              if(col2[x] == 0){
                  f(f,x,k);
              }
          }
      };
      auto dfs1 = [&](auto f, int u, int k) -> int{
          int cnt = 0;
          col1[u] = k;
          for(auto x : a1[u]){
              if(col1[x] == 0){
              if(col2[x] != k) cnt++;
              else cnt += f(f,x,k);}
          }
          return cnt;
      };
      int ans = 0;
      for(int i = 1; i <= n; i++){
          if(col2[i] == 0){
              dfs2(dfs2,i,i);
          }
          if(col1[i] == 0){
              ans += dfs1(dfs1,i,col2[i]);
              if(col2[i] < i) ans ++; // 在前面有代表节点的时候便已经访问过这个节点，但是在F图中这个 i 节点并没有被 初始化，说明前面的代表节点和这个节点之间应该要增加一条边
          }
      }
      cout << ans << endl;
  }
  signed main(){
      int _;
      cin >> _;
      while(_--) __();
  }
  ```

### 快速幂

#### 无 mod

```c++
int fpw(int a, int b){
    int res = 1;
    while(b){
        if(b & 1) res *= a;
        a *= a;
        b >>= 1;
    }
    return res;
}
```

#### 有mod

```c++
int fpw(int a, int b, int mod){
    int res = 1;
    while(b){
        if(b & 1){
            res = res * a % mod;
        }
        a = a * a % mod;
        b >>= 1;
    }
    return res % mod;
}
```

### 乘法逆元

#### 线性

```c++
inv[1] = 1;
for (int i = 2; i <= n; ++i) {
  inv[i] = (long long)(p - p / i) * inv[p % i] % p;
}
```

#### 扩展欧几里得

#### 费马小

$$
ax \equiv 1(mod \; b) and
x = a^{b - 2}(mod \; b)
$$

```c++
x = fpw(a, b-2,b)
```

## 数据结构

### 折半搜索

[OI WIKI - Meet in the middle](https://oi-wiki.org/search/bidirectional/)

### 并查集

#### 基础并查集

```c++
int father[N];
void init(){ for(int i = 0; i < N; i++) father[i] = i; }
int find(int x){
    if(x != father[x]){
        father[x] = find(father[x]);
    }
    return x;
}
void un(int x, int y){
    int fx = find(x), fy = find(y);
    if(fx != fy){
        father[fx] = fy;
    }
}
```

#### 带权并查集

> 个人感觉带权并查集有点类似于 树形DP，后续补充

'hello'

### 前缀和 + 差分

#### 前缀和

##### 一维

$$
sum[i] = sum[i - 1] + a[i]
$$

##### 二维

$$
sum[i][j] = a[i][j] + sum[i - 1][j] + sum[i][j - 1] - sum[i - 1][j - 1]
$$

##### 树上前缀和

- 点权

$$
x\rightarrow y = sum_x + sum_y - sum_{lca} - sum_{f_{alca}}
$$

- 边权

$$
x \rightarrow y = sum_x + sum_y - 2 * sum_{lca}
$$

#### 差分

> 用于快速解决区间修改问题

##### 一维

$$
b_i = a_i - a_{i - 1}
$$

如果存在 [l, r] 区间内的值进行范围修改,在差分数组上面 $b_l + d,b_{r + 1} - d$

##### 二维

$$
diff[i][j] = a[i][j] - a[i - 1][j] - a[i][j - 1] + a[i - 1][j - 1]
$$

$$
a[i][j] = \sum_{t1 = 1}^{i}\sum_{t2 = 1}^{j} diff[t1][t2]
$$

##### 树上差分

- 点差分

> 如查询一棵树上 节点被访问的次数

Ex: s 到 t 路径节点的访问修改

$$
d_s = d_s + 1 ,d_{lca} = d_{lca} - 1 ,d_t = d_t + 1 ,d_{f(lca)} = d_{f(lca)} - 1
$$

当前节点的权重,由于当前节点的权重与子节点有关，便可以很好的解释 上面这个差分访问修改

$$
a[i] = \sum^{children_{i}}diff[t]
$$

- 边差分

Ex: s 到 t 路径的边的访问修改

$$
d_s = d_s + 1,d_t = d_t + 1,d_{lca} = d_{lca} - 1
$$

当前节点的权重,由于当前节点的权重与子节点有关，便可以很好的解释 上面这个差分访问修改

$$
a[i] = \sum^{children_{i}}diff[t]
$$

### 线段树

#### 基础线段树

> 懒更新的意义是，如果这个大区间进行了修改，当访问到这个大区间的子区间时我们再去下发大区间的修改信息。

##### 区间查询，区间变化，区间重置

```c++
##include<bits/stdc++.h>
using namespace std;

##define int long long
##define endl '\n'
##define fr first
##define sc second

const int N = 1e5 + 10;
int sum[4 * N];
int ad[4 * N];
int a[N];
int change[4 *N];
bool vis[4 * N];
/*
  区间查询，区间变化，区间重置
*/
void build(int l, int r, int i){
    if(l == r){
       sum[i] = a[r];
       return;
    }
    int mod = (l + r) >> 1;
    build(l, mod, i << 1);
    build(mod + 1, r, i << 1 | 1);
    sum[i] = sum[i << 1] + sum[i << 1 | 1];
    ad[i] = 0;
    change[i] = 0;
    vis[i] = false;
}
void down(int i, int ln, int rn){
    if(vis[i]){
      sum[i << 1] = change[i] * ln;
      change[i << 1] = change[i];
      vis[i << 1] = true;
      sum[i << 1 | 1] = change[i] * rn;
      change[i << 1 | 1] = change[i];
      vis[i << 1 | 1] = true;
      vis[i] = false;
    }
    if(ad[i] != 0){
        sum[i << 1] += (ln * ad[i]);
        ad[i << 1] += ad[i];
        sum[i << 1 | 1] += (rn * ad[i]);
        ad[i << 1 | 1] += ad[i];
        ad[i] = 0;
    }
}
void add(int wol, int wor, int wov, int l, int r, int i){
    if(l >= wol && r <= wor){
        sum[i] += (r - l + 1) * wov;
        ad[i] += wov;
        return;
    }

    int mid = (l + r) >> 1;
    /*
      l -> mid mid + 1-> r
    */
    down(i, (mid - l + 1), (r - mid));
    if(wol <= mid){
        add(wol, wor, wov, l, mid, i << 1);
    }
    if(wor >= mid + 1){
        add(wol, wor, wov, mid + 1, r, i << 1 | 1);
    }
    sum[i] = sum[i << 1] + sum[i << 1 | 1];
}
void cha(int wol, int wor, int wov, int l, int r, int i){
    if(l >= wol && r <= wor){
        sum[i] = (r - l + 1) * wov;
        change[i] = wov;
        vis[i] = true;
        return;
    }
    int mid = (l + r) >> 1;
    down(i, (mid - l + 1), (r - mid));
    if(wol <= mid){
        cha(wol, wor, wov, l, mid, i << 1);
    }
    if(wor >= mid + 1){
        cha(wol, wor, wov, mid + 1, r, i << 1 | 1);
    }
    sum[i] = sum[i << 1] + sum[i << 1 | 1];
}
int query(int wol, int wor, int l, int r, int i){
    if(wol <= l && r <= wor){
        return sum[i];
    }
    int mid = (l + r) >> 1;
    down(i, (mid - l + 1), (r - mid));
    int ans = 0;
    if(wol <= mid){
        ans += query(wol, wor, l, mid, i << 1);
    }
    if(wor >= mid + 1){
        ans += query(wol, wor, mid + 1, r, i << 1 | 1);
    }
    return ans;
}
signed main(){
    /*
      1 1 1 1 6
    */
       int n;
       cin >> n;
       for(int i = 1; i <= n; i++) cin >> a[i];
       build(1, n, 1);
       int q1,q2;
       cin >> q1;
       while(q1--){
           int t1, t2, t3;
           cin >> t1 >> t2 >> t3;
           add(t1, t2, t3,1,n,1);
       }
       int chl, chr, chv;
       cin >> chl >> chr >> chv;
       cha(chl, chr, chv, 1, n, 1);
       cin >> q2;
       while(q2--){
           int l,r;
           cin >> l >> r;
           cout << query(l , r, 1, n, 1) << endl;
       }
}
```

##### 区间重置 + 范围查询

```cpp
##include<bits/stdc++.h>
using namespace std;

##define int long long
##define endl '\n'
##define PII pair<int,int>
##define fr first
##define sc second
/*
  范围重置 + 范围查询（线段树）

*/
const int N = 1e5 + 10;
int Max[4 * N]; // 需要 4 * N
int a[N];
// 懒更新 (访问才往下推)
int change[4 * N];
bool update[4 * N];

/*
  ad 表示当前需要下发的信息，当前节点已经修正
*/
// O(n)
void build(int l, int r, int i){
    if(l == r){
        Max[i] = a[r];
        return;
    }
    int mid = (l + r) >> 1; // 最后一定会达到相等，不会出现越界情况
    build(l, mid, i << 1);
    build(mid + 1, r, i << 1 | 1);
    Max[i] =max( Max[i << 1],Max[i << 1 | 1]);
    change[i] = 0, update[i] = false;
}
// 懒信息下发

void down(int i, int ln, int rn){
    if(update[i]){
        update[i << 1] = true;
        change[i << 1] = change[i];
        Max[i << 1] = change[i];
        update[i << 1 | 1] = true;
        change[i << 1 | 1] = change[i];
        Max[i << 1 | 1] = change[i];
        update[i] = false;
    }
}

// O(nlog(n)) 范围查询
int query(int wol, int wor, int l, int r, int i){
    if(l >= wol && r <= wor){
       return Max[i];
    }
    int ans = 0;
    int mid = (l + r) >> 1;
    down(i, mid - l + 1, r - mid);
    if(mid >=wol){
        ans =max(ans,query(wol, wor, l, mid, i << 1));
    }
    if(mid + 1<= wor){
        ans = max(ans,query(wol, wor, mid + 1, r, i << 1 | 1));
    }
    return ans;
}

// 范围i增加


void up(int wol, int wor, int wov, int l, int r, int i){
       if(wol <=  l && r <= wor){
           change[i] = wov;
           update[i] = true;
           Max[i] = wov;
           return;
       }
       int mid = (l + r) >> 1;
       down(i, mid - l + 1, r - mid);
       if(wol <= mid){
           up(wol, wor, wov, l, mid, i << 1);
       }
       if(wor >= mid + 1){
           up(wol, wor, wov, mid + 1, r, i << 1 | 1);
       }
       Max[i] = max(Max[i << 1], Max[i << 1 | 1]);
       // cout << i << " " << Max[i] << endl;
}
signed main(){
       int n;
       cin >> n;
       for(int i = 1; i <= n; i++) cin >> a[i];
       build(1, n, 1);
       int q1;
       cin >> q1;
       while(q1--){
           int l, r, v;
           cin >> l >> r >> v;
           up(l, r, v, 1, n, 1);
       }
       int q;
       cin >> q;
       while(q --){
           int l, r;
           cin >> l >> r;
           cout << query(l, r, 1, n, 1) << endl;
       }
}
```

##### 范围修改 + 范围查询

```c++
##include<bits/stdc++.h>
using namespace std;

##define int long long
##define endl '\n'
##define PII pair<int,int>
##define fr first
##define sc second
/*
  范围修改 + 范围查询（线段树）

*/
const int N = 1e5 + 10;
int sum[4 * N]; // 需要 4 * N
int a[N];
int ad[4 * N]; // 懒更新 (访问才往下推)
/*
  ad 表示当前需要下发的信息，当前节点已经修正
*/
// O(n)
void build(int l, int r, int i){
    if(l == r){
        sum[i] = a[r];
        return;
    }
    int mid = (l + r) >> 1; // 最后一定会达到相等，不会出现越界情况
    build(l, mid, i << 1);
    build(mid + 1, r, i << 1 | 1);
    sum[i] = sum[i << 1] + sum[i << 1 | 1];
    ad[i] = 0;
}

// 懒信息下发

void down(int i, int ln, int rn){
    if(ad[i] != 0){
        sum[i << 1] += ln * ad[i];
        ad[i << 1] += ad[i];
        sum[i << 1 | 1] += rn * ad[i];
        ad[i << 1 | 1] += ad[i];
        ad[i] = 0;
    }
}


// O(nlog(n)) 范围查询
int query(int wol, int wor, int l, int r, int i){
    if(l >= wol && r <= wor){
       return sum[i];
    }
    int ans = 0;
    int mid = (l + r) >> 1;
    down(i, mid - l + 1, r - mid);
    if(mid >=wol){
        ans += query(wol, wor, l, mid, i << 1);
    }
    if(mid + 1<= wor){
        ans += query(wol, wor, mid + 1, r, i << 1 | 1);
    }
    return ans;
}

// 范围i增加

void add(int wol, int wor, int wov, int l, int r, int i){
       if(wol <=  l && r <= wor){
           ad[i] += wov; // 往下传递
           sum[i] += wov*(r - l + 1);
           return;
       }
       int mid = (l + r) >> 1;
       down(i, mid - l + 1, r - mid);
       if(wol <= mid){
           add(wol, wor, wov, l, mid, i << 1);
       }
       if(wor >= mid + 1){
           add(wol, wor, wov, mid + 1, r, i << 1 | 1);
       }
       sum[i] = sum[i << 1] + sum[i << 1 | 1];
}
signed main(){
       int n;
       cin >> n;
       for(int i = 1; i <= n; i++) cin >> a[i];
       build(1, n, 1);
       int q1;
       cin >> q1;
       while(q1--){
           int l, r, v;
           cin >> l >> r >> v;
           add(l, r, v, 1, n, 1);
       }
       int q;
       cin >> q;
       while(q --){
           int l, r;
           cin >> l >> r;
           cout << query(l, r, 1, n, 1) << endl;
       }
}
```

##### 线段树的势能分析

##### 线段树区间合并

> 处理 子串 子数组(相互连接) 的信息

- [序列操作](https://www.luogu.com.cn/problem/P2572)

```cpp
##include <bits/stdc++.h>
using namespace std;

##define int long long
##define fr first
##define sc second
using PII = pair<int, int>;

const int N = 1e5;

int a[N];
int sum[N << 2];
int tree0[N << 2];
int pre0[N << 2];
int la0[N << 2];
int tree1[N << 2];
int pre1[N << 2];
int la1[N << 2];
bool update[N << 2];
int up_data[N << 2];
bool reversed[N << 2];

void up(int i, int ln, int rn) {
    pre0[i] = (pre0[i << 1] == ln) ? (pre0[i << 1] + pre0[i << 1 | 1]) : pre0[i << 1];
    pre1[i] = (pre1[i << 1] == ln) ? (pre1[i << 1] + pre1[i << 1 | 1]) : pre1[i << 1];
    la0[i] = (pre0[i << 1 | 1] == rn) ? (la0[i << 1] + pre0[i << 1 | 1]) : la0[i << 1 | 1];
    la1[i] = (pre1[i << 1 | 1] == rn) ? (la1[i << 1] + pre1[i << 1 | 1]) : la1[i << 1 | 1];
    tree0[i] = max({tree0[i << 1], tree0[i << 1 | 1], la0[i << 1] + pre0[i << 1 | 1]});
    tree1[i] = max({tree1[i << 1], tree1[i << 1 | 1], la1[i << 1] + pre1[i << 1 | 1]});
    sum[i] = sum[i << 1] + sum[i << 1 | 1];
}

void build(int l, int r, int i) {
    reversed[i] = false;
    update[i] = false;
    if (l == r) {
        tree0[i] = (a[r] == 0) ? 1 : 0;
        tree1[i] = (a[r] == 1) ? 1 : 0;
        sum[i] = a[r];
        la0[i] = pre0[i] = tree0[i];
        la1[i] = pre1[i] = tree1[i];
        return;
    }
    int mid = (r + l) >> 1;
    build(l, mid, i << 1);
    build(mid + 1, r, (i << 1 | 1));
    up(i, mid - l + 1, r - mid);
}

void down(int i, int ln, int rn) {
    if (update[i]) {
        if (up_data[i] == 1) {
            pre1[i << 1] = la1[i << 1] = tree1[i << 1] = ln;
            pre0[i << 1] = la0[i << 1] = tree0[i << 1] = 0;
            pre1[i << 1 | 1] = la1[i << 1 | 1] = tree1[i << 1 | 1] = rn;
            pre0[i << 1 | 1] = la0[i << 1 | 1] = tree0[i << 1 | 1] = 0;
            sum[i << 1] = ln;
            sum[i << 1 | 1] = rn;
            update[i] = false;
            update[i << 1] = update[i << 1 | 1] = true;
            up_data[i << 1] = up_data[i << 1 | 1] = 1;
        } else {
            pre0[i << 1] = la0[i << 1] = tree0[i << 1] = ln;
            pre1[i << 1] = la1[i << 1] = tree1[i << 1] = 0;
            pre0[i << 1 | 1] = la0[i << 1 | 1] = tree0[i << 1 | 1] = rn;
            pre1[i << 1 | 1] = la1[i << 1 | 1] = tree1[i << 1 | 1] = 0;
            sum[i << 1] = 0;
            sum[i << 1 | 1] = 0;
            update[i] = false;
            update[i << 1] = update[i << 1 | 1] = true;
            up_data[i << 1] = up_data[i << 1 | 1] = 0;
        }
        reversed[i << 1] = reversed[i << 1 | 1] = false;
    }
    if (reversed[i]) {
        swap(pre1[i << 1], pre0[i << 1]);
        swap(la1[i << 1], la0[i << 1]);
        swap(tree0[i << 1], tree1[i << 1]);
        swap(pre1[i << 1 | 1], pre0[i << 1 | 1]);
        swap(la1[i << 1 | 1], la0[i << 1 | 1]);
        swap(tree0[i << 1 | 1], tree1[i << 1 | 1]);
        sum[i << 1] = ln - sum[i << 1];
        sum[i << 1 | 1] = rn - sum[i << 1 | 1];
        reversed[i << 1] = !reversed[i << 1];
        reversed[i << 1 | 1] = !reversed[i << 1 | 1];
        reversed[i] = false;
    }
}

void change(int jobl, int jobr, int w, int l, int r, int i) {
    if (jobl <= l && r <= jobr) {
        if (w == 0) {
            pre0[i] = la0[i] = tree0[i] = (r - l + 1);
            sum[i] = 0;
            pre1[i] = la1[i] = tree1[i] = 0;
            update[i] = true;
            up_data[i] = w;
        } else {
            pre1[i] = la1[i] = tree1[i] = (r - l + 1);
            sum[i] = (r - l + 1);
            pre0[i] = la0[i] = tree0[i] = 0;
            update[i] = true;
            up_data[i] = w;
        }
        reversed[i] = false;
        return;
    }
    int mid = (l + r) >> 1;
    down(i, mid - l + 1, r - mid);
    if (jobl <= mid) {
        change(jobl, jobr, w, l, mid, i << 1);
    }
    if (jobr >= mid + 1) {
        change(jobl, jobr, w, mid + 1, r, i << 1 | 1);
    }
    up(i, mid - l + 1, r - mid);
}

int query1(int jobl, int jobr, int l, int r, int i) {
    if (jobl <= l && r <= jobr) {
        return sum[i];
    }
    int ans = 0;
    int mid = (l + r) >> 1;
    down(i, mid - l + 1, r - mid);
    if (jobl <= mid) {
        ans += query1(jobl, jobr, l, mid, i << 1);
    }
    if (jobr >= mid + 1) {
        ans += query1(jobl, jobr, mid + 1, r, i << 1 | 1);
    }
    return ans;
}
//  返回 [l, r] 范围上 被 [jobl, jobr] 影响的区域 的 信息
vector<int> query2(int jobl, int jobr, int l, int r, int i) {
    if (jobl <= l && r <= jobr) {
        return {tree1[i], pre1[i], la1[i]};
    }
    int mid = (l + r) >> 1;
    down(i, mid - l + 1, r - mid);
    vector<int> a1 = {0, 0, 0};
    vector<int> a2 = {0, 0, 0};
    if (jobl <= mid) {
        a1 = query2(jobl, jobr, l, mid, i << 1);
    }
    if (jobr >= mid + 1) {
        a2 = query2(jobl, jobr, mid + 1, r, i << 1 | 1);
    }
    int max_len = max(a1[0], a2[0]);
    if (jobl <= mid && jobr >= mid + 1) {
        max_len = max(max_len, a1[2] + a2[1]);
    }
    int prefix_len = (jobl <= l) ? a1[1] : 0;
    /*
      [l, r]
      [jobl,jobr]
      返回 [l, r] 范围上 被 [jobl, jobr] 影响的区域 的 信息
    */
    if (jobl <= l && a1[1] == (mid - l + 1) && jobr >= mid + 1) {
        prefix_len += a2[1];
    }
    int suffix_len = (jobr >= r) ? a2[2] : 0;
    if (jobr >= r && a2[1] == (r - mid) && jobl <= mid) {
        suffix_len += a1[2];
    }
    return {max_len, prefix_len, suffix_len};
}

void reverse(int jobl, int jobr, int l, int r, int i) {
    if (jobl <= l && r <= jobr) {
        reversed[i] = !reversed[i];
        swap(pre1[i], pre0[i]);
        swap(la1[i], la0[i]);
        swap(tree0[i], tree1[i]);
        sum[i] = (r - l + 1) - sum[i];
        return;
    }
    int mid = (l + r) >> 1;
    down(i, mid - l + 1, r - mid);
    if (jobl <= mid) {
        reverse(jobl, jobr, l, mid, i << 1);
    }
    if (jobr >= mid + 1) {
        reverse(jobl, jobr, mid + 1, r, i << 1 | 1);
    }
    up(i, mid - l + 1, r - mid);
}

signed main() {
    int n, m;
    cin >> n >> m;
    for (int i = 1; i <= n; i++) cin >> a[i];
    build(1, n, 1);
    while (m--) {
        int pos, l, r;
        cin >> pos >> l >> r;
        l++; r++;
        if (pos == 0) {
            change(l, r, 0, 1, n, 1);
        } else if (pos == 1) {
            change(l, r, 1, 1, n, 1);
        } else if (pos == 2) {
            reverse(l, r, 1, n, 1);
        } else if (pos == 3) {
            cout << query1(l, r, 1, n, 1) << endl;
        } else if (pos == 4) {
            cout << query2(l, r, 1, n, 1)[0] << endl;
        }
    }
    return 0;
}
```

#### 开点线段树

1. 问题

- 支持很大的范围，但是查询次数少，查询区间小

> 时间复杂度 2 _ m _ log(n)，用 cnt 来记录编号，看节点分支是否访问过。

#### 线段树历史最值操作

> 标签回收 &rarr; 进行剪枝

### 笛卡尔树

### 倍增算法 + ST表

倍增算法其实是常用来树上向上跳转的,因为每一个节点的父亲节点是唯一的
ST表
核心公式:

$$
ST[i][j] = ST[ST[i][j - 1]][j - 1]
$$

表示 i 节点向上走 $2^j$ 次方步的位置

倍增算法其实讲究的是逼近: 逼近某一个目标,然后在向前走ST[x][0]就是目标范围
[牛客多校3-H](https://ac.nowcoder.com/acm/contest/108300/H)
这道题目就很好的描述来逼近这种效果.

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long
#define fr first
#define sc second
#define endl '\n'
using PII = pair<int,int>;

signed main(){
    ios::sync_with_stdio(false);
    cin.tie(0);
    int n, k;
    cin >> n >> k;
    vector<int> fath(n + 1, 0);
    vector<vector<int>> dj(n + 1);
    for(int i = 2; i <= n; i++){
        cin >> fath[i];
        dj[fath[i]].push_back(i);
    }
    vector<array<int,3>> t(k);
    for(int i = 0; i < k; i++){
        cin >> t[i][2] >> t[i][0] >> t[i][1];
    }
    vector<bool> vis(n + 1, 0);
    vis[1] = 1;
    int h = 30;
    // cout << "h:" << h << endl;
    vector st(n + 1, vector<int>(h + 1, 0));
    vector<int> deep(n + 1, 0);
    auto dfs = [&](auto ff, int u, int f) -> void{
        deep[u] = deep[f] + 1;
        for(auto x : dj[u]){
            ff(ff, x, u);
        }
    };
    dfs(dfs, 1, 0);
    for(int i = 1; i <= n; i++){
        st[i][0] =  fath[i];
    }
    for(int i = 1; i <= n; i++){
        for(int j = 1; j <= h; j++){
            st[i][j] = st[st[i][j - 1]][j - 1];
        }
    }
    auto get = [&](int x) -> int{
        int p = x;
        for(int i = h; i >= 0; i--){
            if(!st[p][i]) continue;
            if(!vis[st[p][i]]) p = st[p][i];
        }
        return st[p][0];
    };
    auto start = [&](int x, int f, int l, int r) -> void{
        int p = x;
        for(int i = h; i >= 0; i--){
            if(!st[p][i]) continue;
            if(deep[st[p][i]] - deep[f] > r - l + 1) x = st[p][i];
        }
        int tt = st[p][0];
        while(tt != f && !vis[tt]){
            vis[tt] = 1;
            tt = st[tt][0];
        }
    };
    for(int i = 0; i < k; i++){
        auto x = t[i];
        if(vis[x[2]]){
            cout << x[0] << endl;
            return 0;
        }
        int len = (x[1] - x[0] + 1);
        int p1 = get(x[2]);
        // cout << "p1:" << p1 <<  "\n";
        int h = deep[x[2]] - deep[p1];
        if(h <= len){
            cout << x[0] + h - 1 << endl;
            return 0;
        }
        start(x[2], p1, x[0], x[1]);
    }
    cout << -1 << "\n";
    return 0;
}

```

## 图论

### 最短路问题

> 遇见过很多 最短路 问题，题目的意思一般都指向明确，就是(i $\rightarrow$ j)的路径最小。

> [!NOTE]
> 但是一般都是 **最短路的扩展**， ex:到达终点时候需要满足什么样的状态

题目链接:

- [扩展迷宫问题](https://acm.hdu.edu.cn/contest/problem?cid=1159&pid=1006)

  > 个人认为这道题非常的典，题中还应用了一类 **自定义点**，来管理相同类别的点之间的跳转。

```c++
##include<bits/stdc++.h>
using namespace std;
##define int long long
##define fr first
##define sc second
##define endl '\n'
using PII = pair<int,int>;

void slove(){
int n, m, x;
cin >> n >> m >> x;
vector<int> a(n + 1, 0);
vector<array<int, 3>> g[2 * n + 1];
for(int i = 1; i <= n; i++) cin >> a[i];
for(int i = 1; i <= n; i++){
    g[a[i] + n].push_back({i,0,0});
    g[i].push_back({a[i] + n, x, 1 });
}
for(int i = 0; i < m; i++){
    int u, v, w;
    cin >> u >> v >> w;
    g[u].push_back({v,w,1});
}

priority_queue< array<int,3>, vector<array<int,3>>, greater<array<int,3>>> q;
q.push({0,1,0});
vector<vector<int>> dist(2 * n + 1, vector<int>(3, INT_MAX));
vector<vector<bool>> vis(2 * n + 1,vector<bool>(3,false));
dist[1][0] = 0;
while(!q.empty()){
    auto temp = q.top();
    q.pop();
    int v = temp[1],step = temp[2];
    if(vis[v][step]) continue;
    // cout << v << " " << w << endl;
    vis[v][step] = 1;
    for(auto[u, w, l] : g[v]){
    // cout << u << " " << w << endl;
    int op = (step + l) % 3;
    if(dist[u][op] > dist[v][step] + w){
        dist[u][op] = dist[v][step] + w;
        q.push({dist[u][op],u, op});}}
    }
    if(dist[n][0] == INT_MAX){
    cout << "-1" << endl;
    }else{
    cout << dist[n][0] << endl;
    }
}
signed main(){
    ios::sync_with_stdio(false);
    cout.tie(0);
    int t;
    cin >> t;
    while(t--) slove();
    return 0;
}
```

### 拓扑排序

> 适用于那些 节点状态有先后性的问题。

- 如果需要求 最大/最小的拓扑排序的话，可以将存储的 deque 改成 优先队列

```c++
signed main(){
    int n;
    cin >> n;
    vector<vector<int>> a(n + 1);
    vector<int> in(n + 1);
    for(int i = 0; i < n; i++){
        int u, v;
        cin >> u >> v;
        a[u].push_back(v);
        in[v]++;
    }
    deque<int> q;
    for(int i = 1; i <= n; i++){
        if(in[i] == 0){q.push_back(i);}
    }
    while(!q.empty()){
        int x = q.front(); q.pop_front();
        cout << x << endl;
        for(auto t : a[x]){
            in[t]--;
            if(in[t] == 0) q.push_back(t);
        }
    }
    return 0;
}
```

- 板子题:[P1347](https://www.luogu.com.cn/problem/P1347)

### ford + Bellman-Ford

1. ford 算法
   核心实现公式:
   $$
   dist(u, v) = min(dist(u,v), dist(u,k) + dist(k, v))
   $$
   时间复杂度: O($n^3$)

```cpp
for(int u = 0; u < n; u++){
    for(int v = 0; v < n; v++){
        for(int k = 0; k < n; k++){
            dist[u][v] = min(dist[u][v], dist[u][k] + dist[k][v]);
        }
    }
}
```

相关问题:

- 求图的传递闭包: `IMPORTANT`

2. Bellman-ford(SPFA)
   为了解决Ford的时间复杂度过高的问题,提出了一个松弛操作
   $$
   S \rightarrow u \rightarrow v
   $$
   通过不断优化 dist(v) 的路径最小值,时间复杂度: O(mn)
   $S \rightarrow u$ 的路径取最短路,但是你这个只能是以一个源点进行
   > [!WARNING]
   > 由于你是从一个源点开始进行的,通过这个点检测点时候发现没有负环,只能说明从 S这个点出发不能抵达一个负环, 所以你要判断整个图上是否存在负环一般的手段都是建立**超级源点**

本文只介绍队列优化的Bellman-ford: SPFA

```cpp
vector<vector<pair<int, int>>> g(n + 1);
vector<int> dist(n + 1, 0);
vector<int> cnt(n + 1, 0);
vector<bool> vis(n + 1, false); // 用来标记节点是不是在队列中,防止重复
bool spfa(int n, int s){
    memset(dist, 0x3f, dist.size());
    memset(cnt, 0, cnt.size());
    dist[s] = 0; vis[s] = 1;
    deque<int> q;
    q.push(s);
    while(!q.empty()){
        int u = q.front(); q.pop_front();
        vis[u] = 0;
        for(auto {x, y} : g[u]){
            if(dist[x] > dist[u] + y){
                dist[x] = dist[u] + y;
                cnt[x] = cnt[u] + 1;
                if(cnt[x] >= n) return false;
                if(!vis[x]) q.push_back(x), vis[x] = 1;
            }
        }
    }
    return true;
}
```

> [!TIP]
> 节点松弛 n - 1次就是极限了:因为相当于每一个节点都对这个节点进行了dist更新,不可能会有更多了.

### 负环 差分约束

形式

1. $x_i - x_j \leq C_i$ 找到一组满足这种式子的解

> 根据 小于号 的不等式来建图

$$
x_i \leq x_j + C_i
$$

建图方式:

1. 边权重更新: $x_j \rightarrow x_i,weight+C_i$
2. 点权重更新: $dist(x_i) = min(dist(x_i), dist(C_i))$
   从那个节点出发,这个节点的权重设置为 0
   将这个式子应用到 **图**中,如果图中存在负环就不存在满足的解。

- 负环判断: 如果这个节点进队列 $\geq$ 所有节点的 个数 - 1
- 如果队列为空，dist[n] 便是一组解
- 一般设置一个 **超级源点** 来解决图中不连通问题
- 如果存在变量是定值,设置一个**限制源点**

### 最小环问题

### 同余最短路

介绍:
n 个数字,用最小的数字作为基准,用它的余数来进行划分建图,然后跑最短路,将余数作为节点,除了基准的数字其他数字作为边权重,如果 (i + $W_t$) == j,说明 i, j之间有一条边

> [!CAUTION]
> 思考: 同余最短路是用来解决什么问题?

常见问题:

1. 有n个数字,每个数字有无限个,能组成 $\leftarrow$ x(很大)的个数

2.

## 数学

### 基础数论

- 任何一个整数 都可以分解为 有限个质数的乘积

$$
N = p_1^{c_1} * p_2^{c_2} \dots p_x^{c_x}
$$

则 N 的约数集合为

$$
\{p_1^{b_1} * p_2 ^ {b_2} \dots p_x^{b_x}\} and 0\le b_i \le c_i
$$

正约数的个数 :$\prod_{i=1}^{m}{(c_i +1)}$

- 质数筛的算法只需要 $log{(n)}$

### 高斯消元

> 高斯消元 有三种类别，我们会逐一补充，目前先补充 异或消元，但是其实本质是不变的。

### 线性基

> 给出一个数组，请找出这个 数组的任意元素进行异或，可以得到多少种情况。
>
> 线性基的大小便决定了 能异或的多少种情况 （2 ^ n - 1)

```c++
##include<bits/stdc++.h>
using namespace std;

##define int long long
##define fr first
##define sc second
##define endl '\n'
using PII = pair<int,int>;
/*
  线性基
*/
void _1(){
    int n;
    cin >> n;
    vector<int> a(n + 1, 0);
    for(int i = 1; i <= n; i++) cin >> a[i];
    /*
      查找每一位的 基
      首先 从 每一个数 开始遍历，然后枚举 每一个位置，如果这个位置有 基，将这个数 变成 两者的异或值
    */
    int h = 61;
    bool zero = false;
    vector<int> ans;
    vector<int> base(h + 1, 0);
    for(int i = 1; i <= n; i++){
        for(int j = h; j >= 0; j--){
            if(((a[i] >> j) & 1) == 1){
                if(base[j] == 0){
                    base[j] = a[i];
                    ans.push_back(a[i]);
                    break;
                }else a[i] = a[i] ^ base[j];
            }
            if(a[i] == 0) zero = true;
        }
    }

    for(auto x : ans) cout << x << " ";
    cout << endl;
    if(zero) cout << "yes" << endl;
    else cout << "no" << endl;
}
```

- 高斯消元

```cpp
void _2(){
    int n;
    cin >> n;
    vector<int> a(n + 1, 0);
    for(int i = 1; i <= n; i++) cin >> a[i];

    int len = 1, h = 61; // 上面是确定的
    bool zero = false;
    vector<int> base(1,0);
    for(int i = h; i >= 0; i--){
        for(int j = len; j <= n; j++){
            if(((a[j] >> i) & 1) == 1){
                swap(a[len],a[j]);
                break;
            }
        }
        if(((a[len] >> i) & 1) == 1){
        for(int k = 1; k <= n; k++){
            if(k != len && ((a[k] >> i) & 1) == 1){
                a[k] = a[k] ^ a[len];
            }
        }
        len++;
        }
    }
    len --;
    if(len != n) zero = true;
    for(int i = 1; i <= len; i++) cout << a[i] << " ";
    cout << endl;
    if(zero) cout << "yes" << endl;
    else cout << "no" << endl;

}
```

#### 常见考点:

##### **求异或最大值**

> 从 最高位开始枚举，来进行更新最大值

```c++
##include<bits/stdc++.h>
using namespace std;

##define int long long
##define fr first
##define sc second
##define endl '\n'
using PII = pair<int,int>;

signed main(){
    int n;
    cin >> n;
    vector<int> a(n + 1, 0);
    for(int i = 1; i <= n; i++) cin >> a[i];
    vector<int> base(53,0);
    for(int i = 1; i <= n; i++){
        for(int k = 52; k >= 0; k--){
            if(((a[i] >> k) & 1) == 1){
                if(base[k] == 0){
                    base[k] = a[i];
                    break;
                }else{
                    a[i] ^= base[k];
                }
            }
        }
    }

    int mx = 0;
    for(int i = 52; i >= 0; i--){
        mx = max(mx, mx ^ base[i]);
    }
    cout << mx << endl;
    return 0;
}
```

##### **求 异或 第 k 小值**

```c++
##include<bits/stdc++.h>
using namespace std;

##define int long long
##define fr first
##define sc second
##define endl '\n'
using PII = pair<int,int>;
/*
  线性基
*/



signed main(){
    int n;
    cin >> n;
    vector<int> a(n + 1,0);
    for(int i = 1; i <= n; i++) cin >> a[i];
    auto swp = [&](int i, int j) -> void{
        int t = a[i];
        a[i] = a[j];
        a[j] = t;
    };
    int len = 1;
    for(int i = 53; i >= 0; i--){
        for(int j = len; j <= n; j++){
            if(((a[j] >> i) & 1) == 1){
                swp(j, len);
                break;
            }
        }
        if(((a[len] >> i) & 1) == 1){
        for(int j = 1; j <= n; j++){
            if(j != len && (((a[j] >> i) & 1) == 1)){
                a[j] ^= a[len];
            }
        }
        len ++;
    }
    }
    len --;
    // for(int i = 1; i <= len; i++) cout << a[i] << " ";
    // cout << endl;
    bool zero = (len != n);
    int m;
    cin >> m;
    int mx = (1 << len);
    // cout << mx << endl;
    for(int i = 0; i < m; i++){
        int t;
        cin >> t;
        if(zero) t--;
        if(t == 0 && zero) cout << "0" << "\n";
        else if(t == 0 || t >= mx) cout << "-1" << "\n";
        else{
            int ans = 0;
            // cout << t << endl;
            for (int i = len, j = 0; i >= 1; i--, j++) {
            if ((t & (1L << j)) != 0) {
                ans ^= a[i];
            }
        }
            cout << ans << "\n";
            // cout << endl;
        }

    }
    return 0;
}
```

### 二项式定理

基本公式:

$$
(a + b)^n = \sum_{k=0}^{n} \binom{n}{k} a^{n-k} b^k
$$

关键的组合公式:(杨辉三角)

$$
C(i,j) = C(i - 1,j) + C(i - 1, j - 1)
$$

**C(n, k)的模版**:

```cpp
const int N = 1e5 + 10;
const int mod = 1e9 + 7;
vector<int> fac(N, 0); // 阶乘表
vector<int> inv(N, 0); // 逆元表

void get_inv() {
    inv[1] = 1;
    for (int i = 2; i <= N; ++i) {
      inv[i] = (long long)(p - p / i) * inv[p % i] % p;
    }
}
void get_fac() {
    fac[1] = 1;
    for(int i = 2; i <= N; i++){
        fac[i] = i * fac[i - 1] % mod;
    }
}
int c(int n, int k) {
    return (((fac[n] * inv[k]) % mod) * inv[n - k]) % mod;
}
```

### 扩展欧几里得

#### 中国剩余定理

由扩展欧几里得算法（后续填完扩展欧几里得会补充）

### 鸽巢原理

## 动态规划

思考: 什么时候才是使用动态规划的时候呢?

### 区间DP

> 当实现 区间DP 的时候，如何将递归该迭代
>
> 1. 首先**枚举每一个长度的区间，然后在枚举每一个区间的开头**（这样可以避免判断边界条件），然后判断这个区间的扩展，因为当你枚举到这个长度的区间的时候，你是一定枚举完这个区间的子区间的。
> 2. 注意 子区间中存在一些特判的情况！

常用模版

```cpp
// 枚举区间长度
for(int len = 2; len <= n; len++){
    // 便利每一个该长度的区间
    for(int l = 1, r = l + len - 1; r <= n; l++,r++){
        // 区间分割点
        for(int k = l + 1; k < r; k++){

        }
    }
}

```

- [预测赢家](http://leetcode.cn/problems/predict-the-winner/submissions/626649392/)

## 计算几何

### 折尺定理

[题目](https://codeforces.com/contest/2119/problem/B)
<br>
[包子丸-algorithm-1.3.15](https://baoziwan.icu/algorithm.html#more)
条件: 给定 n 个木棒,判断这 n 根木棒能不能连接在两个点之间
需要满足条件:

$$
L \leq D \leq R
$$

相关概念:

1. $L = max(0,2 * a_max - R)$
2. $R = \sum_{i = 1}^{n}a_i$
3. D 表示两点之间的距离

### 博弈论

## 字符串

### 字符串哈希

> [!NOTE]
> 其实就是将字符串变成 整数来存储,将不定长的String类型变成定长的整数类型,可以在一些特殊场景减少内存

1. 基于一个 base进制的数字并且让其自然溢出
2. 转化的时候每一位的值从 1 开始

实现代码:

```cpp
const int base = 1e9 + 7;
int value(string s){
    // v[] 表示 s[i] 在新定义的string中的位置
    int ans = v[s[0]];
    for(int i = 1; i < s.size(); i++){
        ans = ans * base + v[s[i]];
    }
    return ans;
}
```

#### 获得子串hash

实现代码

```cpp
 int base = 499 // 基数
 int pow[N];
 int hash[N];
 void init(string s, int n){
    pow[0] = 1;
    for(int i = 1; i < n; i++){
        pow[i] = pow[i - 1] * base;
    }
    hase[0] = base * pow[0];
    // hash[i] = hash[i - 1] * base + (s[i] - 'a' + 1) * 1;
    for(int i = 1; i < n; i++){
        hash[i] = hash[i - 1] * base + (s[i] - 'a' + 1) * 1;
    }

    hase[l ... r] = hase[r] - hase[l] * base^(r - l + 1)
 }

```

## 杂项

### 数据

> 通过数据量的给出，可以大概的估计是一个什么时间复杂度的算法，从而来推演这个算法的类型。

### 或( | ) 和 与( & )

对于或和与的一些讨论

- 或 是只要有一个 1，或值 中这个位置就一定会存在一个 1

可以考虑 这个位置的 一是否需要存在来进行按位判断

- 与 是需要全部都是1，与值 中这个位置就一定存在 1

### 最大公约数 和 最小公倍数 的关系

- **预处理两个数字的最大公约数**

  > 这个 `g[y][x%y]` 其实就相当于一个 动规的转辗相除法的一个应用

```c++
for(int x = 0; x < N; x ++) g[x][0] = g[0][x] = g[x][x] = x;
for(int x = 1; x < N; x ++){
    for(int y = 1; y < x; y++){
        g[x][y] = g[y][x] = g[y][x % y];
    }
}
```

- 特殊性质
  对于任何正整数 a1​,a2​,…,an​ 和它们的 GCD g=gcd(a1​,a2​,…,an​)，如果我们定义一个新数组 ai′​=ai​/g，那么新数组 a1′​,a2′​,…,an′​ 的**最大公约数必然是 1**
- `lcm(a, b) * gcd(a, b) = a * b`

​ `a * b = 质数` &rarr; (`a = 1, b 为 质数`)

- 在进行 GCD 的过程中，随着 不断进行 GCD，GCD的值只可能不变或者变小

### 异或值

1. 遇到异或值可以考虑 枚举每一个位置，看是不是每一个位置的变化会对答案有影响（规律性）

[2094E](https://codeforces.com/problemset/problem/2094/E)

### 二进制

- 在二进制的位移中 **1**是会被默认当作 (int)类型的

需要 (1ll << j) 防止溢出

> 如 （1 << j) 会被默认为 **int** 类型

### 图的创新知识

- 存在多个 起点的时候，可以设置虚点。
- 遇到中位数（对顶堆）
- 树上的 两个节点之间 **只存在一条最短路径**

### 二分

- 二分是 x 值成立 $\leq or \geq$ x 的值都成立
- 二分具有单调性:
- **当 x 成立的 时候， 小于 x 的值都是一定成立的。**

  ### 对于数组中 不同位置的值 能否相互抵消，变成全是 0 的数组

如果当前 元素的个数大于了 数组的和的一半**肯定是不成立的**

### 区间异或问题

对于一个区间 [l, r] 来说, `l ^ r` 中的 最高位的 1，相当于 最高位后面的 1都可以由 [l, r] 中的值异或得到。

### **1**

**在计算机中会自动被默认设置为 int 型，所以如果有long long 的话，需要 改变 1 的类型, (long long)**

### 矩阵问题

#### 矩阵 行列异或

**矩阵构造**

- 通用思考:找一下 总的异或 的值的关系
- 尝试去构造矩阵

### 公约数 + 因子问题

经常遇到公约数和因子的问题,也存在一些常见的结论:

1. n个数字的公因子数量很少

2. $a_i$ 往前走100步以内,肯定有不是自己的因子的数字
