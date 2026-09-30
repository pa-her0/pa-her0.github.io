#include<bits/stdc++.h>
using namespace std;

#define int long long

int dx[4] = {1,0,-1,0};
int dy[4] = {0,1,0,-1};

void slove(){
    int n,m,q;
    cin >> n >> m >> q;
    vector<int> dp(n * m + 10 ,0);
    vector<int> fa(n * m + 10, 0);
    for(int i = 1; i <= n*m; i++){
        fa[i] = i
    }
    for(int i = 1; i <= q; i++){
        int op;
        cin >> op;
        if(op == 1){
            int x, y, v;
            cin >> x >> y >> v;
            for(int i = 0; i < 4; i++){
                int x1 = x + dx[i], y1 = y + dy[i];

            }
        }else if(op == 2){
            int x, y;
            cin >> x >> y;
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