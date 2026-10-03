#include<bits/stdc++.h>
using namespace std;

#define int long long

int dx[4] = {1,0,-1,0};
int dy[4] = {0,1,0,-1};

void slove(){
    int n,m,q;
    cin >> n >> m >> q;
    vector<int> dp(n * m + 10 ,0);
    vector<int> fa(n * m + 10, 0), sz(n * m + 10, 1), dj(n * m + 10, 0);
    vector<bool> vis(n * m + 10, 0);
    auto ID = [&](int x, int y) -> int {
        return (x - 1) * m + y;
    };
    for(int i = 1; i <= n*m; i++){
        fa[i] = i;
    }
    auto find = [&](int i) -> int {
        vector<int> r;
        int t1 = i;
        while(t1 != fa[t1]){
            r.push_back(t1);
            t1 = fa[t1];
        }
        int root = t1;
        int ed = r.size() - 1;
        int cur = 0;
        for(int k = ed; k >= 0; k--){
            int id = r[k];
            dp[id] = max(cur, dp[id]);
            cur = dp[id];
            fa[id] = root;
        }
        return root;
    };
    int l = 0;
    for(int i = 1; i <= q; i++){
        int op;
        cin >> op;
        if(op == 1){
            int x, y, v;
            cin >> x >> y >> v;
            x ^= l; y ^= l;
            dj[ID(x, y)] = v;
            int root1 = ID(x, y);
            vis[root1] = 1;
            vector<int> ro;
            for(int i = 0; i < 4; i++){
                int x1 = x + dx[i], y1 = y + dy[i];
                if(x1 < 1 || x1 > n || y1 < 1 || y1 > m) continue;
                int id1 = ID(x1,y1); 
                if(!vis[id1]) continue;
                int r = find(id1);
                bool flag = 1;
                for(auto tt : ro){
                    if(tt == r) flag = 0;
                }
                if(flag) ro.push_back(r);
            }
            for(auto x : ro){
                dp[x] = max(0ll, v - sz[x] + 1);
                fa[x] = root1;
                sz[root1] += sz[x];
            }
            l = sz[root1] - 1;
            cout << sz[root1] - 1 << endl;
        }else if(op == 2){
            int x, y;
            cin >> x >> y;
            x ^= l; y ^= l;
            int root1 = ID(x, y);
            find(root1);
            l = max(0ll, dp[root1] - dj[root1]);
            cout << max(0ll, dp[root1] - dj[root1]) << endl;
        }
    }
}

signed main(){
    int t = 1;
    // cin >> t;
    while(t--){
        slove();
    }
}