---
slug: "2025-06-10-on-time-nowcoder"
title: 牛客赛
commentSlug: '2025-06-10-On-time-Nowcoder'
published: 2025-06-10T00:00:00.000Z
draft: false
description: 统一记录牛客上的题目
image: /post-covers/2025-06-10-on-time-nowcoder.jpg
tags:
  - 学习
  - 热爱
category: 算法
lang: zh-CN
---
**状态: 牛客周赛111,史上最有意思的结论场**

<!--more -->

## 牛客周赛Round-93

### F

> 一个线性状态 DP

这个题目的思路比较简单，但是其实实现是有一点考验码量的，那个奇偶性的判断。
就是一个线性DP

> [!NOTE]
> 这个位置与只与上一个位置有关系，所以自然可以想到动态规划，但是这个题目的码量有一点要求，整体思维难度不大。

```c++
#include<bits/stdc++.h>
using namespace std;

#define int long long
const int mod = 1e9 + 7;

signed main(){
    int n;
    cin >> n;
    vector<vector<int>> a(n + 1, vector<int>(n + 1, -1));
    for(int i = 1; i <= n; i++){
        for(int j = 1; j <= i; j++){
            cin >> a[i][j];
        }
    }
	vector<vector<vector<int>>> dp(2, vector<vector<int>>(n + 3, vector<int>(n + 3, 0)));

	if(n % 2 == 0){
		int t1 = n / 2, t2 = n / 2 + 1;
		for(int i = 1; i <= t1; i++){
			if(a[t1][i] == a[t2][i]) dp[0][i][i]++;
			if(a[t1][i] == a[t2][i + 1]) dp[0][i][i + 1]++;
		}
		int temp = 1;
		for(int d = 1; d < n / 2; d++){
			for(int i = 1; i <= n; i ++){
				for(int j = 1; j <= n; j++){
					dp[d & 1][i][j] = 0;
				}
			}
			temp &= 1;
			for(int i = 1; i <= n; i++){
				for(int j = 1; j <= n; j++){
					if(a[t1 - d][i] == a[t2 + d][j]){
						dp[d & 1][i][j] = (dp[(d - 1) & 1][i][j]+dp[d & 1][i][j]) % mod;
                        dp[d & 1][i][j] = (dp[(d - 1) & 1][i + 1][j] +   dp[d & 1][i][j])% mod;
                        dp[d & 1][i][j] = (dp[(d - 1) & 1][i][j - 1] + dp[d & 1][i][j])% mod;
                        dp[d & 1][i][j] = (dp[(d - 1) & 1][i + 1][j - 1] + dp[d & 1][i][j])% mod;
					}
				}
			}
		}
		int ans = 0;
		for(int i = 1; i <= n; i++){
			ans = (ans + dp[(n + 1) / 2 - 1 & 1][1][i]) % mod;
		}
		cout << ans << endl;
	}else{
		int t1 = (n / 2) + 1;
		for(int i = 1; i <= t1; i++){
			dp[0][i][i] = 1;
		}
		int temp = 1;
		for(int d = 1; d <= n / 2; d++){
			for(int i = 1; i <= n; i++){
				for(int j = 1; j <= n; j++){
					dp[d & 1][i][j] = 0;
				}
			}
			temp &= 1;
			for(int i = 1; i <= n; i++){
				for(int j = 1; j <= n; j++){
					if(a[t1-d][i] == a[t1 + d][j]){
						dp[d & 1][i][j] = (dp[(d - 1) & 1][i][j]+dp[d & 1][i][j]) % mod;
                        dp[d & 1][i][j] = (dp[(d - 1) & 1][i + 1][j] +   dp[d & 1][i][j])% mod;
                        dp[d & 1][i][j] = (dp[(d - 1) & 1][i][j - 1] + dp[d & 1][i][j])% mod;
                        dp[d & 1][i][j] = (dp[(d - 1) & 1][i + 1][j - 1] + dp[d & 1][i][j])% mod;
					}
				}
			}
		}
		int ans = 0;
		for(int i = 1; i <= n; i++){
			ans = (ans +  dp[(n + 1)/2 - 1 & 1][1][i]) % mod;
		}
		cout << ans << endl;
	}

    }




```

## 牛客周赛Round-94

> 这一场我感觉偏推理场吧，主要被前面的题目唬到了，然后后面做起来有点害怕，看到了那个类似 成都赛场上面没做出来的一个签到题目，感觉心里很慌。

### [2024成都区域赛A-Arrow a Row](https://codeforces.com/gym/105486/problem/A)

> 这个好像不是一个拓扑排序的题目，是一个**构造题！**

最讨厌看到的显然成立
![](https://s3.bmp.ovh/imgs/2025/06/05/2c5d083b1ad86f3d.png)

```c++
#include<bits/stdc++.h>
using namespace std;

#define int long long
#define fr first
#define sc second
#define endl '\n'
using PII = pair<int,int>;

void slove(){
	string s;
	cin >> s;
	int n = s.size();
	/*
	 - 的位置要 小于倒数第三个位置 相近的 - 之间的距离必须大于 4
	  存储每一对的位置 - 的左右
	*/
	bool ex = true;
	for(int i = 0; i < n; i++){
		if(s[i] == '-'){
			ex = false;
			 break;
		}
	}
	if(ex){
		cout << "No" << endl;
		return;
	}
	int d[4] = {0, n - 1, n - 2, n - 3};
	for(int i = 0; i < 4; i++){
		if(s[d[i]] != '>'){
			cout << "No" << endl;
			return;
		}
	}

	vector<pair<int, int>> ans;
	int i;
	for( i = n - 3; i > 1; i--){
		if(s[i] == '>'){
			ans.push_back({0, i + 3});
		}else break;
	}
	for(int j = 1; j < i; j++){
		if(s[j] == '>'){
			ans.push_back({j, i + 3 - j + 1});
		}
	}
	cout << "Yes" << " " << ans.size() << endl;
	for(auto[x, y] : ans){
		cout << x + 1 << " " << y << endl;
	}
}

signed main(){
	int t;
	cin >> t;
	while(t--) slove();
	return 0;
}
```

### [E-小苯的数字操作](https://ac.nowcoder.com/acm/contest/110696/E)

> [!NOTE]
> 知识点:对于一个数字的**二进制形式**，$\times$ 2 相当于在二进制后面新增0，$\div$ 2 相当于删除二进制的最后一位

**有一个坑**:如果当 n 为 1的时候，是不要进行特判里面的，因为如果为 1 的时候，他的2 的倍数一定是早就出现过的

```c++
#include<bits/stdc++.h>
using namespace std;
#define int long long
#define fr first
#define sc second
#define endl '\n'
using PII = pair<int,int>;
signed main(){
	int t;
	cin >> t;
	while(t--){
		int n, k;
        cin >> n >> k;
        int ans = k + 1;
        for(int i = 1; i <= k; i++){
            if(n % 2 != 0 && n != 1){
                ans += (k - i);
            }
            ans ++;
            n /= 2;
            if(n == 0){
                break;
            }
        }
        cout << ans << endl;
	}
	return 0;
}



```

### [F-小苯的小球分组](https://ac.nowcoder.com/acm/contest/110696/F)

> [!TIP]
> 有一个结论

**结论**
定义小球集合$\Bbb S$的函数 $f(\Bbb S)$，表示将小球集合 $\Bbb S$ 分为若干组，满足以下**所有条件**的最少分组个数:

- 每组最多有 2 个球
- 组内有 2 个球的组，这 2 个球的颜色不同。
  **这个的最小分组个数为 :$max(a_{max},(sum/2)_{up})$**

思路: 这个题目最重要的一个点就是上面的结论,上面的结论是针对于一个固定的数组的时候的结果,显然可以见到就是 一个序列的分组个数就跟序列的绝对众数和数列的大小有关,所以有一个很新奇的思路:**首先我们将所有情况的答案都算作 (sum/2) 的情况处理,然后我们再去枚举 存在众数的情况,这样就可以减少复杂的思考,然后我们只需要知道什么情况才是 $a_{max}$ 的情况,根据 结论的式子可以得到,只有当当前数字作为这个序列的绝对众数($cnt*x > cnt*{last}$)的时候才是这个结果,所以我们可以枚举每一个数字作为绝对众数**

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long
const int mod = 998244353;
const int N = 5e3 + 20;
int power(int x, int n){
    int ans = 1;
    while(n){
        if(n & 1){
            ans = ans * x % mod;
        }
        x = x * x % mod;
        n >>= 1;
    }
    return ans;
}
vector<int> fac(N + 1); // 阶乘
vector<int> inv(N+ 1); // 逆元
void init(){
    fac[0] = 1;
    for(int i = 1; i <= N; i ++){
        fac[i] = fac[i - 1] * i % mod;
    }

    inv[N] = power(fac[N], mod - 2);
    for(int i = N - 1; i >= 0; i --){
        inv[i] = inv[i + 1] * (i + 1) % mod;
    }
}
int C(int n, int m){ // 组合数
    if(m > n){
        return 0;
    }
    return fac[n] * inv[m] % mod * inv[n - m] % mod;
}
void slove(){
    int n;
    cin >> n;
    map<int,int> mp1;
    for(int i = 0, t; i < n; i++){
        cin >> t;
        mp1[t]++;
    }
    int n1 = mp1.size();
    int ans = 0;
    for(int i = 1; i <= n; i++){
        ans = (ans + ((i + 1) / 2) * C(n, i) % mod) % mod;
    }
//     cout << "ans: " << ans << endl;
    vector<int> a(1);
    for(auto [x, y] : mp1){
        a.push_back(y);
    }
    for(int i = 1; i <= n1; i++){
        for(int j = 1; j <= a[i]; j++){
            for(int k = 0; k < j; k++){
                // x y
                int t1 = C(a[i], j), t2 = C(n - a[i], k), len = (j + k);
                int temp1 = (len + 1) / 2 * t1 % mod * t2 % mod;
                int add = (j * t1 % mod * t2 % mod);
                ans = (ans - temp1 + mod) % mod;
                ans = (ans + add) % mod;
            }
        }
    }
    cout << ans << endl;
}

signed main(){
    init();
    int t;
    cin >> t;
    while(t--) slove();
}

```

## 牛客周赛Round-103

### [快乐](https://ac.nowcoder.com/acm/contest/114593/F)

> [!TIP]
> 绝世好题,这个题目运用了很多算法,字典树,哈希,也提供的一个很好的思路去快速解决 前缀匹配的问题

收获: 已知N个字符串$s_i$,查询给定一个字符串$Q_s$,我现在需要查询 $Q_s$ 与这N个字符串的公共前缀和,
O(log(Q.size()))的解决办法
思路: 先预处理S的字典树(前缀树),然后用hash计数每一个前缀的出现个数(map<string,int> 的时间复杂度远远高于 map<int,int>),然后去二分这个 Q_s字符串的前缀,去找最长的匹配长度即可

易错点: 针对于 字典树 来说,字典树递归应该是 (u -> tree[u][k])

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long

const int base = 39127;
const int N = 1e5 + 10;
vector<int> power(N,1);
void slove(){
	int n, m;
	cin >> n >> m;
	string s;
	cin >> s;
	vector<int> hash1(n, 0);
	hash1[0] = (s[0] - 'a' + 1);
	for(int i = 1; i < n; i++){
		hash1[i] = hash1[i - 1] * base + (s[i] - 'a' + 1);
	}
	auto get = [&](int l, int r) -> int{
		if(l > 0){
			l = hash1[l - 1] * power[r - l + 1];
		}
		r = hash1[r];
		return r - l;
	};
	vector<string> t(m);
	int mx = 0, sum = 0;
	for(int i = 0; i < m; i++){
		cin >> t[i];
		int len = t[i].size() + 1;
		sum += len;
	}
	vector tree(sum + 1, vector<int>(27, 0));
	vector<int> pa(sum + 1, 0);
	int cnt = 1;
	auto insert = [&](string s1) -> void{
		int cur = 1;
		pa[cur]++;
		for(int i = 0; i < s1.size(); i++){
			int path = s1[i] - 'a';
			if(tree[cur][path] == 0){
				tree[cur][path] = ++cnt;
			}
			cur = tree[cur][path];
			pa[cur]++;
		}
	};
	for(int i = 0; i < m; i++) insert(t[i]);
	map<int, int> mp1;
	auto dfs = [&](auto ff, int layer, int h, int now) -> void{
		for(int k = 0; k < 27; k++){
			if(tree[layer][k] == 0) continue;
			// cout << layer << " " << k << " " << pa[tree[layer][k]] << endl;
			int h1 = h * base + (k + 1);
			int cost = pa[tree[layer][k]] + now;
			mp1[h1] = cost;
			ff(ff, tree[layer][k], h1, cost);
		}
	};
	dfs(dfs, 1, 0, 0);
	// for(auto [x, y] : mp1){
	// 	cout << x << " " << y << endl;
	// }
	int ans = 0;
	for(int i = 0; i < n; i++){
		int l = i, r = n - 1;
		while(l <= r){
			int mid = (l + r + 1) >> 1;
			int t1 = get(i, mid);
			if(mp1.count(t1)){
				l = mid + 1;
				ans = max(ans, mp1[t1]);
			}else r = mid - 1;
		}
// 		if(mp1.count(get(i, r + 1))){
// 			ans = max(ans, mp1[get(i, r + 1)]);
// 		}
	}
	cout << ans << endl;
}

signed main(){
	ios::sync_with_stdio(false);
	cin.tie(0);
	for(int i = 1; i < power.size(); i++) power[i] = power[i - 1] * base;
	int t;
	cin >> t;
	while(t--) slove();
}
```

## 牛客周赛Round-104

### [小红的树不动点]

针对于这个问题,首先我们应该观察贡献是怎么来的,比如 i 的贡献是要基于 i-1 的贡献之上的,只有包括 i-1 的子树再包括 i,i才会有贡献,我们可以**应用 dfn 序来判断当前节点是不是在 K 这个节点的子树下面**

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long

/*
	dfn 序: 将 一个树 变成 区间
	{dfn[i], dfn[i] + sz[i] - 1}
*/


signed main(){
	int n;
	cin >> n;
	vector dj(n + 1, vector<int>());
	for(int i = 0; i < n - 1; i++){
		int u, v;
		cin >> u >> v;
		dj[u].push_back(v);
		dj[v].push_back(u);
	}
	vector<int> dfn(n + 1, 0);
	vector<int> size(n + 1, 1);
	vector<int> deep(n + 1, 0);
	vector<int> fa(n + 1, 0);
	int idx = 1;
	auto dfs = [&](auto ff, int u, int f) -> void{
		dfn[u] = idx++;
		deep[u] = deep[f] + 1;
		fa[u] = f;
		for(auto x : dj[u]){
			if(x == f) continue;
			ff(ff, x, u);
			size[u] += size[x];
		}
	};
	dfs(dfs, n, 0);
	// for(int i = 1; i <= n; i++){
	// 	cout << dfn[i] << " " << size[i] << endl;
	// }
	int ans = 0;
	int lca = 1;
	for(int i = 1; i <= n; i++){
		while(lca > 0 && !(dfn[lca] <= dfn[i] && dfn[lca] + size[lca] - 1 >= dfn[i])){
			lca = fa[lca];
		}
		ans += deep[lca];
	}
	cout << ans << endl;
}

```

## 牛客周赛Round-105

### [E-小苯的xor图](https://ac.nowcoder.com/acm/contest/115861/E)

> [!TIP]
> 反思:这道题目经验不足,思考方向不对,怎么会不往二进制的角度去想问题呢?按理来说,题目中遇见**或,异或,与**等问题,我们都应该往二进制的角度去想问题,我一直从如何三个节点的路径上想问题是完全错误的

三个节点的异或值可以从节点的每一位去观察,因为你三个节点在某一位上的情况很少,只有 001,011,010...

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long
#define fr first
#define sc second
#define endl '\n'
using PII = pair<int,int>;
const int mod = 998244353;

signed main(){
	ios::sync_with_stdio(false);
	cin.tie(0);
	int n, m;
	cin >> n >> m;
	vector<int> v(n + 1, 0);
	for(int i = 1; i <= n; i++) cin >> v[i];
	vector<vector<int>> a(n + 1);
	for(int i = 0; i < m; i++){
		int u, v;
		cin >> u >> v;
		a[u].push_back(v); a[v].push_back(u);
	}
	int ans = 0;
	for(int i = 0; i <= 32; i++){
		for(int u = 1; u <= n; u++){
			int cnt0 = 0, cnt1 = 0, falg = (v[u] >> i & 1);
			for(auto x : a[u]){
				int tt = (v[x] >> i & 1);
				cnt0 += (tt == 0);
				cnt1 += (tt == 1);
			}
			int ans1 = (1 << i);
			if(falg == 0){
				ans1 = ans1 * (cnt1 * cnt0 % mod) % mod;
			}else{
				ans1 = ans1 * ((cnt0 * (cnt0 - 1) / 2) % mod + (cnt1 * (cnt1 - 1) / 2) % mod) % mod;
			}
			ans = (ans + ans1) % mod;
		}
	}
	cout << ans << endl;
	return 0;
}

```

## 2025牛客暑期多校训练营3

[E-Equal](https://ac.nowcoder.com/acm/contest/108300/E)

> [!TIP]
> 针对于这个题目,其实最重要的是一个知识点,就是因数分解的知识点

常见的因数分解一个数字是:O(n)

```cpp
for(int i = 2; i <= n; i++) {
    while(n % i == 0) {
        factors.push_back(i);
        n /= i;
    }
}
```

但是针对于一些时间复杂度严苛的题目,这个算法便是不可行的,于是就有了预处理的解决办法

> [!TIP]
> 解决思路: 一个数的因式分解 == 这个数字的最小质因数 \* (m),这样可以将 m 不断分解成最小质因数,这样的乘机也是因式分子

一个数字的时间复杂度为 O(log(n))

```cpp
const int N = 5e6 + 10;
vector<int> prime(N + 1, 0);

void init(){
	for(int i = 2; i <= N; i++){
		if(prime[i] == 0){
			prime[i] = i;
		}
		for(int j = 2; j * i <= N; j++){
			if(prime[j * i] == 0){
				prime[j * i] = prime[i];
			}
		}
	}
}
signed main(){
	init();
	map<int, int> mp;
	for(int i = 1; i <= n; i++){
		while(a[i] > 1){
			int t = prime[a[i]]; mp[t]++;
			// cout << t << endl;
			a[i] /= t;
		}
	}
}
```

## 牛客周赛Round-107

### F

> [!TIP]
> 这个题目是一个离线处理的题目,也是一个很好又很经典的离线题目

题意:
![](https://dns.whalefall.top/nowcoder107-F.png)

我一开始是想通过DP来找到这个位置的最早被覆盖的位置,其实和题目的想法差不多,但是我这么写的话就是没有这么简单.....

思路: 一个很明显的递推关系,就是如果这个点被X覆盖了,那么比X大的覆盖图的大小只会比X的覆盖图更大(这个也是我想使用DP的原因,因为有一个很明显的递推关系),但是DP不行,因为没有一个明显的递推公式,所以通过离线处理,通过对X进行排序,在前面的基础上进行扩展

```cpp
#include<bits/stdc++.h>
using namespace std;
#define int long long

/*
需要记录的笔记:
1. 离线思维题:
ex: 一个数组,每次删除 一个数,求每一次删除后的gcd
2. 针对于 priority_queue的自定义排序
*/

struct node{
	int val, x, y;
	bool operator < (const node &n) const{
		return val > n.val;
	}
};

int dx[4] = {0, 1, -1, 0};
int dy[4] = {1, 0, 0, -1};
signed main(){
	int n, m, q;
	cin >> n >> m >> q;
	vector dj(n + 1, vector<int>(m + 1, 0));
	for(int i = 1; i <= n; i++){
		for(int j = 1; j <= m; j++){
			cin >> dj[i][j];
		}
	}
	vector<array<int,2>> t1(q);
	for(int i = 0; i < q; i++){
		cin >> t1[i][0];
		t1[i][1] = i + 1;
	}
	sort(t1.begin(), t1.end(), [&](array<int,2> p1, array<int,2> p2){
		return p1[0] < p2[0];
	});
	vector<int> ans(q + 1, 0);
	vector vis(n + 1, vector<bool> (m + 1, 0));
	int cnt = 0;
	// deque<int> q1;
	priority_queue<node> h;
	for(int i = 1; i <= m; i++){
		h.push({dj[1][i], 1, i});
	}
	for(int i = 0; i < q; i++){
		auto temp = t1[i];
		while(!h.empty() && temp[0] >= h.top().val){
			auto X = h.top(); h.pop();
			// cout << X.x << " " << X.y << endl;
			if(vis[X.x][X.y]) continue;
			vis[X.x][X.y] = 1; cnt++;
			for(int i = 0; i < 4; i++){
				int tx = X.x + dx[i], ty = X.y + dy[i];
				if(tx <= n && ty <= m && tx >= 1 && ty >= 1){
					if(!vis[tx][ty]) h.push({dj[tx][ty], tx, ty});
				}
			}
		}
		ans[temp[1]] = cnt;
	}
	for(int i = 1; i <= q; i++) cout << ans[i] << " ";
}
```

目前赛时题目补完了,9月份之前补完所有题目 + 寒假多校 + HDU春季联赛的一些题目.

## 牛客多校第一场

### I题

> [!NOTE]
> 这个题目是一个区间DP,写了一会的递归形式想把这个题目的一些基础思想理解,但是写完以后发现题目看错了😭

整体思路:

1. 记录每一个区间的每一种可能的{价值, b}
2. 然后使用二分查找 子区间小于 b 的最小价值,只要求最接近的b的位置的信息(信息用前缀求最小来处理)

条件一:

$$
f(l, r, k) = f(l, k, t1) + f(k + 1, r, t2) + cost
$$

条件二:
$b(l, r, k) > b(l, k, t1)$ AND $b(l, r, k) > b(k + 1, r, t2)$

总体思路:
就是一个大区间的价值是子区间中满足条件二的最小价值,所以针对于 满足条件二,我们就可以使用 **前缀和**的操作,**将小于条件二的最小价值存储在 大的 b 的元素(优化关键)**

感觉:
区间DP像一种感觉,你仔细去思考其中的流程反而容易将自己绕晕,就是要深刻理解DP的灵魂,就是我目前的状态只跟我前面一个状态有关
其实这个题目也好理解,因为 b要求递增,但是b其实就跟目前的切割点有关,所以我只要看b和子区间的b的关系就行了,b并没有顺推关系

```cpp
void slove(){
	int n;
	cin >> n;
	vector<int> a(n + 1),sum(n + 1, 0);
	for(int i = 1; i <= n; i++) cin >> a[i],sum[i] = sum[i - 1] + a[i];
	vector dp(n + 1, vector(n + 1, vector<PII>())); // {最小代价, b}
	for(int i = 1; i <= n; i++) dp[i][i].push_back({0ll,0ll});
	auto get = [&](int x, vector<PII>& t) -> int{
		int l = 0, r = t.size() - 1, mid, ans = -1;
		while(l <= r){
			mid = (l + r) >> 1;
			if(t[mid].sc <= x){
				l = mid + 1;
				ans = t[mid].fr;
			}else r = mid - 1;
		}
		return ans;
	};
	for(int len = 2; len <= n; len++){
		for(int l = 1, r = l + len - 1; r <= n; l++,r++){
			for(int k = l; k < r; k++){
				int l1 = sum[k] - sum[l - 1], l2 = sum[r] - sum[k];
				int b = abs(l1 - l2), cost = (min(l1, l2) * ceil(log2(l1 + l2)));
				int c_l1 = get(b, dp[l][k]), c_l2 = get(b, dp[k + 1][r]);
				if(len == n){
					// 相当于以每一个点的最小代价都在这里输出
					if(c_l1 == -1 || c_l2 == -1){
						cout << -1 << " ";
					}else cout << c_l1 + c_l2 + cost << " ";
					continue;
				}
				if(c_l1 == -1 || c_l2 == -1) continue;
				dp[l][r].push_back({c_l1 + cost + c_l2, b});
			}
			sort(dp[l][r].begin(), dp[l][r].end(), [&](PII p1, PII p2){
				if(p1.sc == p2.sc) return p1.fr < p2.fr;
				else return p1.sc < p2.sc;
			});
			for(int i = 1; i < dp[l][r].size(); i++){
				dp[l][r][i].fr = min(dp[l][r][i].fr, dp[l][r][i - 1].fr);
			}
		}
	}
	cout << "\n";
}
```

## 牛客多校第二场

### A题

> [!NOTE]
> 这个题目相对比较基础,但是我比赛场上没有写出来,针对于 DP线形动态规划的问题还是不太敏感(其实比赛的时候想过 DP,但是没有把转移方程写出来,比较遗憾\[主要是包子丸写的太快了,导致我方程都没写明白,😈\])

题解思路:

1. 针对于这个题目,自然而然的会想到 递归,然后又是针对于一个数据的线性访问,所以我们可以不由自主的想到 DP(动态规划)
2. 状态转移方程的问题: 我一开始是想将 0,1都进行合并然后再去观察这个题目
   G\[i\]\[j\] 就表示 前i 个数字 中 以 j 结尾的 1的段的数量
   $$
   G[i][0] = G[i - 1][0] + G[i - 1][1]
   $$

$$
G[i][1] = G[i - 1][0] + f[i - 1][0] + G[i - 1][1]
$$

f\[i - 1\]\[0\]其实就是为了统计 k 的影响的,可以理解为k构造了多少个新的子序列

以下是代码:

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long
#define fr first
#define sc second
#define endl '\n'
using PII = pair<int,int>;

const int mod = 998244353;

void slove(){
	int n;
	cin >> n;
	int last = -1;
	vector<int> a;
	int t;
	for(int i = 0; i < n; i++){
		cin >> t;
		if(t != last || t == -1){
			a.push_back(t);
			last = t;
		}
	}
	/*
	1. 考虑 [1, i] ai = j 的时候 1的段数和
		g[i][0] = g[i - 1][0] + g[i - 1][1]
		g[i][1] = g[i - 1][0] + f[i - 1][0] + g[i - 1][1]
	2. 考虑 [1, i] ai = j 的时候的数组数量 // 这个其实可以理解为 记录前面有多少个 ?
		f[i][0] = f[i - 1][0] + f[i - 1][1]
		f[i][1] = f[i - 1][0] + f[i - 1][1]
	*/
	n = a.size();
	vector<array<int,2>> f(n + 1,{0,0});
	vector<array<int,2>> g(n + 1,{0,0});
	f[0][0] = 1;
	for(int i = 1; i <= n; i++){
		if(a[i - 1] == 1){
			g[i][1] = ((g[i - 1][0] + f[i - 1][0]) % mod + g[i - 1][1]) % mod;
			f[i][1] = (f[i - 1][0] + f[i - 1][1]) % mod;
		}else if(a[i - 1] == 0){
			g[i][0] = (g[i - 1][0] + g[i - 1][1]) % mod;
			f[i][0] = (f[i - 1][0] + f[i - 1][1]) % mod;
		}else{
			g[i][1] = ((g[i - 1][0] + f[i - 1][0]) % mod + g[i - 1][1]) % mod;
			f[i][1] = (f[i - 1][0] + f[i - 1][1]) % mod;
			g[i][0] = (g[i - 1][0] + g[i - 1][1]) % mod;
			f[i][0] = (f[i - 1][0] + f[i - 1][1]) % mod;
		}
	}
	cout << (g[n][0] + g[n][1]) % mod << endl;
}


signed main(){
	ios::sync_with_stdio(false);
	cin.tie(0);
	int t;
	cin >> t;
	while(t--){
		slove();
	}
	return 0;
}
```

## 牛客多校第三场

### B

题目介绍: 有四种操作,通过不超过 64次操作,使a, b, c相等

![](https://dns.whalefall.top/newcode3_B.png)

思路: 其实操作都是固定的,我可以先将 a 变成 c,然后在这个过程中 b先变成0,然后 b^a == c

但是这个思路还是很巧妙的.从中也有一个特殊性质: **if(a != b) 则 a ^ 1 == b**,这个性质也是解答这个题目的关键

```cpp
#include<bits/stdc++.h>
using namespace std;

#define int long long
#define fr first
#define sc second
#define endl '\n'
using PII = pair<int,int>;

void slove(){
	int a, b, c;
	cin >> a >> b >> c;
	if(a == b && b == c && c == a){
		cout << "0" << "\n";
		cout << '\n';
		return;
	}
	if(a == 0 && b == 0 && c != 0){
		cout << "-1" << '\n';
		return;
	}
	int ans = 0;
	vector<int> falg;
	int ha, hb, hc;
	auto get = [&](int x) -> int{
		int i;
		for(i = 31; i >= 0; i--){
			if((x >> i) & 1 == 1){
				break;
			}
		}
		return i;
    };
	ha = get(a), hb = get(b), hc = get(c);
	// cout << ha << " " << hb << " " << hc << endl;
	if(ha > hb){
		falg.push_back(4);
		b = b ^ a;
	}else if(ha < hb){
		// while(ha != hb){b >>= 1, hb--, ans++;falg.push_back(2);}
		falg.push_back(3);
		a = a ^ b;
	}
    ha = max(ha, hb);
    // cout << ha << " " << hb << " " << hc << endl;
    // cout << a << " " << b << " " << c << endl;
	if(ha < hc){
		for(int i = 0; i <= ha; i++){
			int t1 = (a >> (ha - i)) & 1;
			int t2 = (c >> (hc - i)) & 1;
			if(t1 != t2){
                falg.push_back(3);
                a ^= b;
            }
			if(i < ha){falg.push_back(2); b >>= 1;}
		}
        // cout << b << "b: " << endl;
		for(int i = hc - ha - 1; i >= 0; i--){
            a <<= 1; falg.push_back(1);
			if(((c >> i) & 1) == 1) {
                falg.push_back(3);
                a ^= b;
            }
		}
        // cout << "b:" << b << endl;
        b >>= 1; b ^= a;
		falg.push_back(2); falg.push_back(4);
	}else{
		for(int i = ha; i >= 0; i--){
			int t1 = (a >> i) & 1;
			int t2 = (c >> i) & 1;
			if(t1 != t2){
                falg.push_back(3);
                a ^= b;
            }
            b >>= 1;
			falg.push_back(2);
		}
        b ^= a;
		falg.push_back(4);
    }
    // cout << a << " " << b << " " << c << endl;
	cout << falg.size()<< endl;
	for(auto x : falg) cout << x << " ";
	cout << endl;
}

signed main(){
	ios::sync_with_stdio(false);
	cin.tie(0);
	int t;
	cin >> t;
	while(t--){
		slove();
	}
	return 0;
}

```

## 牛客多校第九场

### F

题目介绍: 给定一个长度为1的棒子,通过固定一个点选择90度,最少旋转多少次,能旋转到目标棒子的状态的最少次数

思路: 这道题目首先会想到就是暴力模拟,但是其实因为你是固定一个点去移动的话,两个点的状态很难考虑,我们可以尝试去思考一下,两个都是变化的状态能不能转变成就一个变化状态呢...我的想法就是因为你移动的时候,其实可以理解成棒子的中间坐标也是在移动的,而且这个移动是不需要看棒子固定哪一个点进行移动,目标的状态也只有一个,因为**中间坐标其实就决定了棒子的状态**,所以我们可以用中间坐标去替代棒子目前的状态

收获: 这道题给我的感觉就是其实思路是比较简单的,但是越是简单的思路就要考察你解决问题的速度,但是其实简单的思路中可能就隐藏了一些快速的解决方案...

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
	int t;
	cin >> t;
	while(t--){
		array<int,2> l, r, tl, tr;
		cin >> l[0] >> l[1] >> r[0] >> r[1] >> tl[0] >> tl[1] >> tr[0] >> tr[1];
		array<double,2> d, dt;
		d[0] = (double)(l[0] + r[0]) / 2; d[1] = (double)(l[1] + r[1]) / 2;
		dt[0] = (double)(tl[0] + tr[0]) / 2; dt[1] = (double)(tl[1] + tr[1]) / 2;
		// cout << d[0] << " " << d[1] << endl;
		// cout << dt[0] << " " << dt[1] << endl;
		// 向右移动 1 -> 2, x + 0.5, y + 0.5 -> 1
		int ans = max(abs(d[0] - dt[0]), abs(d[1] - dt[1])) * 2;
		cout << ans << endl;

	}
	return 0;
}


```

## 牛客周赛110

### F

相邻元素合并 == 区间划分

## 牛客周赛111

> [!NOTE]
> 史上最有意思的结论场
