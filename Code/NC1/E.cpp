#include<bits/stdc++.h>
using namespace std;

#define int long long

void slove(){
    int n;
    cin >> n;
    vector<int> a(n + 1, 0);
    for(int i = 1; i <= n; i++){
        cin >> a[i];
    }
    int ans = 0;
    for(int i = 1; i <= n; i++){
        ans += (a[i] * i) - (a[i] * (n - i + 1));
    }
    cout << ans << endl;
}

signed main(){
    int t = 1;
    // cin >> t;
    while(t--){
        slove();
    }
}