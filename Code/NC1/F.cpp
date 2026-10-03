#include<bits/stdc++.h>
using namespace std;

#define int long long

void slove(){
    int n, k, x;
    cin >> n >> k >> x;
    vector<int> a(n, 0);
    for(int i = 0; i < n; i++){
        cin >> a[i];
    }
    int pos = 0;
    for(int i = 0; i < n; i++){
        if(a[i] == x){
            pos = i;
            break;
        }
    }
    int t1 = (k - pos + n) % n;
    vector<int> ans(n);
    for(int i = 0; i < n; i++){
        ans[(i + t1) % n] = a[i];
    }
    for(auto &x : ans) cout << x << " ";
    cout << endl;

}

signed main(){
    int t = 1;
    // cin >> t;
    while(t--){
        slove();
    }
}