#include<bits/stdc++.h>
using namespace std;

#define int long long

void slove(){
    int n, k;
    cin >> n >> k;
    vector<int> sum(n + 2, 0ll);
    int ans = 0ll;
    vector<int> a(n + 1, 0);
    for(int i = 1; i <= n; i++){
        cin >> a[i];
    }
    sort(a.begin(), a.end());
    for(int i = 1,t; i <= n; i++){
        t = a[i];
        sum[i] = sum[i - 1] + t;
        ans += t;
    }
    int mn = 0;
    if(k % 2){
        int temp = ans;
        int len = (k + 1) / 2 - 1;
        for(int i = len + 1; i + len <= n; i++){
            int last = sum[i + len] - sum[i - 1] + sum[len];
            int now = k * (sum[i] - sum[i - 1]);
            mn = max(mn, now - last);
        }
    }else{
        int temp = ans;
        int len = k / 2 - 1;
        for(int i = len + 1, last; i + len + 1 <= n; i++){
            last = sum[i + len + 1] - sum[i - 1] + sum[len];
            int now = k * ((sum[i + 1] - sum[i - 1])) / 2;
            // cout << last << " " << now << endl;
            mn = max(mn, now - last);
        }
    }
    cout << ans + mn << endl;
}

signed main(){
    int t;
    cin >> t;
    while(t--) slove();
}